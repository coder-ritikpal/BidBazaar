import amqp from 'amqplib';
import config from '../config/config.js';

const SERVICE = 'Mail Service';
const RECONNECT_DELAY_MS = 5000;
const MAX_PENDING_MESSAGES = 1000;
const MAX_DELIVERY_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

let connection = null;
let channel = null;
let connecting = null;
let reconnectTimer = null;
let flushPromise = null;
const pendingMessages = [];
const subscriptions = new Map();
const activeConsumers = new Map();

const scheduleReconnect = () => {
  if (process.env.NODE_ENV === 'test' || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectRabbitMQ();
  }, RECONNECT_DELAY_MS);
  reconnectTimer.unref?.();
};

const consumeSubscription = async (queueName, callback) => {
  if (!channel || activeConsumers.has(queueName)) return;
  await channel.assertQueue(queueName, { durable: true });
  await channel.assertQueue(`${queueName}.retry`, {
    durable: true,
    arguments: {
      'x-message-ttl': RETRY_DELAY_MS,
      'x-dead-letter-exchange': '',
      'x-dead-letter-routing-key': queueName,
    },
  });
  await channel.assertQueue(`${queueName}.dead`, { durable: true });
  const activeChannel = channel;
  const { consumerTag } = await activeChannel.consume(queueName, async (message) => {
    if (!message) return;
    try {
      await callback(JSON.parse(message.content.toString()));
      activeChannel.ack(message);
    } catch (error) {
      console.error(`[${SERVICE}] Failed to process message from ${queueName}.`, error);
      const retryCount = Number(message.properties.headers?.['x-bidbazaar-retry-count'] || 0);
      const isRetryable = retryCount < MAX_DELIVERY_RETRIES;
      const destination = isRetryable ? `${queueName}.retry` : `${queueName}.dead`;

      try {
        activeChannel.sendToQueue(destination, message.content, {
          persistent: true,
          headers: {
            ...message.properties.headers,
            'x-bidbazaar-retry-count': retryCount + 1,
          },
        });
        await activeChannel.waitForConfirms();
        activeChannel.ack(message);
        if (!isRetryable) {
          console.error(`[${SERVICE}] Moved message from ${queueName} to its dead-letter queue after ${retryCount} retries.`);
        }
      } catch (publishError) {
        console.error(`[${SERVICE}] Could not retain failed message from ${queueName}; requeueing it.`, publishError);
        activeChannel.nack(message, false, true);
      }
    }
  });
  if (channel === activeChannel) activeConsumers.set(queueName, consumerTag);
};

const attachSubscriptions = async () => {
  for (const [queueName, callback] of subscriptions) {
    try {
      await consumeSubscription(queueName, callback);
    } catch (error) {
      console.error(`[${SERVICE}] Failed to subscribe to ${queueName}.`, error);
    }
  }
};

const handleDisconnect = (source) => {
  channel = null;
  connection = null;
  activeConsumers.clear();
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
      activeConnection.on('error', (error) => console.error(`[${SERVICE}] RabbitMQ connection error.`, error));
      activeConnection.on('close', () => {
        if (connection === activeConnection) handleDisconnect('connection');
      });
      activeChannel.on('error', (error) => console.error(`[${SERVICE}] RabbitMQ channel error.`, error));
      activeChannel.on('close', () => {
        if (channel === activeChannel) handleDisconnect('channel');
      });

      console.log(`[${SERVICE}] Connected to RabbitMQ`);
      await attachSubscriptions();
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

export const subscribeToQueue = async (queueName, callback) => {
  subscriptions.set(queueName, callback);
  if (!channel) {
    scheduleReconnect();
    return false;
  }

  try {
    await consumeSubscription(queueName, callback);
    return true;
  } catch (error) {
    console.error(`[${SERVICE}] Failed to subscribe to ${queueName}; it will retry after reconnect.`, error);
    handleDisconnect('channel');
    return false;
  }
};
