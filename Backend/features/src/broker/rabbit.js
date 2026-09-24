import amqp from 'amqplib';
import config from '../config/config.js';

let channel = null;

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(config.RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log('[Features Service] Connected to RabbitMQ');
  } catch (error) {
    console.error('[Features Service] Failed to connect to RabbitMQ, retrying in 5s...', error);
    await new Promise(res => setTimeout(res, 5000));
    return connectRabbitMQ();
  }
};

export const publishToQueue = async (queueName, data) => {
  if (!channel) {
    console.warn(`[Features Service] RabbitMQ channel not available. Skipping message to ${queueName}.`);
    return;
  }
  await channel.assertQueue(queueName, { durable: true });
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), { persistent: true });
  console.log(`[Features Service] Published message to queue: ${queueName}`);
};

