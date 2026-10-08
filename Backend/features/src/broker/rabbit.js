import amqp from 'amqplib';
import config from '../config/config.js';

const SERVICE = 'Features Service';
const RECONNECT_DELAY_MS = 5000;
const MAX_PENDING_MESSAGES = 1000;

// TODO (future): Replace this in-memory retry buffer with a durable solution
// (e.g. a Mongoose-backed outbox collection or a dead-letter queue on RabbitMQ).
//
// Current trade-offs:
//   - Messages queued here survive brief RabbitMQ outages and are flushed on reconnect.
//   - If the Node process restarts, or the buffer fills (> 1000 messages), queued
//     messages are silently dropped — delivery is at-most-once, not guaranteed.
//   - This is acceptable for the current scale, but means auction_join events can
//     be lost during sustained outages or deploys.
let connection = null;
let channel = null;
let connecting = null;
let reconnectTimer = null;
let flushPromise = null;
const pendingMessages = [];

const scheduleReconnect = () => {
  if (process.env.NODE_ENV === 'test' || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectRabbitMQ();
  }, RECONNECT_DELAY_MS);
  reconnectTimer.unref?.();
};

const handleDisconnect = (source) => {
  channel = null;
  connection = null;
  console.warn(`[${SERVICE}] RabbitMQ ${source} closed; reconnecting.`);
  scheduleReconnect();
};

const publishPendingMessages = async () => {
  if (!channel || flushPromise) return flushPromise;

  flushPromise = (async () => {
    while (channel && pendingMessages.length > 0) {
      const { queueName, data } = pendingMessages[0];
      const activeChannel = channel;
      try {
        await activeChannel.assertQueue(queueName, { durable: true });
        activeChannel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), { persistent: true });
        await activeChannel.waitForConfirms();
        pendingMessages.shift();
      } catch (error) {
        console.error(`[${SERVICE}] Failed to publish to ${queueName}; message retained for retry.`, error);
        if (channel === activeChannel) handleDisconnect('channel');
        break;
      }
    }
  })().finally(() => {
    flushPromise = null;
    if (channel && pendingMessages.length > 0) {
      queueMicrotask(() => void publishPendingMessages());
    }
  });

  return flushPromise;
};

export const connectRabbitMQ = async () => {
  if (channel) return channel;
  if (connecting) return connecting;

  connecting = (async () => {
    try {
      const activeConnection = await amqp.connect(config.RABBITMQ_URL);
      const activeChannel = await activeConnection.createConfirmChannel();

      connection = activeConnection;
      channel = activeChannel;
      activeConnection.on('error', (error) => {
        console.error(`[${SERVICE}] RabbitMQ connection error.`, error);
      });
      activeConnection.on('close', () => {
        if (connection === activeConnection) handleDisconnect('connection');
      });
      activeChannel.on('error', (error) => {
        console.error(`[${SERVICE}] RabbitMQ channel error.`, error);
      });
      activeChannel.on('close', () => {
        if (channel === activeChannel) handleDisconnect('channel');
      });

      console.log(`[${SERVICE}] Connected to RabbitMQ`);
      await publishPendingMessages();
      return activeChannel;
    } catch (error) {
      channel = null;
      connection = null;
      console.error(`[${SERVICE}] Failed to connect to RabbitMQ; retrying in ${RECONNECT_DELAY_MS / 1000}s.`, error);
      scheduleReconnect();
      return null;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
};

export const publishToQueue = async (queueName, data) => {
  if (pendingMessages.length >= MAX_PENDING_MESSAGES) {
    console.error(`[${SERVICE}] Pending RabbitMQ queue is full; unable to retain message for ${queueName}.`);
    return false;
  }

  pendingMessages.push({ queueName, data });
  if (!channel) {
    console.warn(`[${SERVICE}] RabbitMQ channel unavailable; message queued for retry on ${queueName}.`);
    scheduleReconnect();
    return false;
  }

  await publishPendingMessages();
  return pendingMessages.length === 0;
};
