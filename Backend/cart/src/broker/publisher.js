import amqp from 'amqplib';
import config from '../config/config.js';

let channel = null;

export const connectProducer = async () => {
  try {
    const connection = await amqp.connect(config.RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log('[Cart Service] Connected RabbitMQ Producer');
  } catch (error) {
    console.error('[Cart Service] Failed to connect RabbitMQ Producer, retrying...', error);
    await new Promise(resolve => setTimeout(resolve, 5000));
    return connectProducer();
  }
};

export const publishToQueue = async (queueName, data) => {
  if (!channel) {
    console.warn(`[Cart Service] RabbitMQ channel not ready. Skipping message to ${queueName}.`);
    return;
  }
  await channel.assertQueue(queueName, { durable: true });
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), { persistent: true });
  console.log(`[Cart Service] Published message to queue: ${queueName}`);
};

