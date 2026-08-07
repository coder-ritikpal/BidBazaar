import amqp from 'amqplib';
import config from '../config/config.js';

let channel = null;

export const connectToRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(config.RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log('Connected to RabbitMQ in Payment service');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ in Payment service:', error);
    setTimeout(connectToRabbitMQ, 5000);
  }
};

export const publishToQueue = async (queueName, data) => {
  if (!channel) {
    throw new Error('RabbitMQ channel is not available.');
  }
  await channel.assertQueue(queueName, { durable: true });
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), { persistent: true });
};
