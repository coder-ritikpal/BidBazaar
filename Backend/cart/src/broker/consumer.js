import amqp from 'amqplib';
import config from '../config/config.js';
import orderModel from '../models/order.model.js';

let channel = null;

const handlePaymentVerified = async (msg) => {
  if (msg !== null) {
    try {
      const { orderId } = JSON.parse(msg.content.toString());
      console.log(`[Cart Service] Received payment verification for order: ${orderId}`);

      const order = await orderModel.findById(orderId);
      if (order && order.status === 'pending_payment') {
        order.status = 'paid';
        await order.save();
        console.log(`[Cart Service] Order ${orderId} status updated to 'paid'.`);
        channel.ack(msg);
      } else {
        console.warn(`[Cart Service] Order ${orderId} not found or not in 'pending_payment' state.`);
        channel.ack(msg); // Acknowledge to remove from queue
      }
    } catch (error) {
      console.error('[Cart Service] Error processing payment_verified message:', error);
      channel.nack(msg, false, false); // Do not requeue to avoid infinite loops
    }
  }
};

export const connectAndConsume = async () => {
  try {
    const connection = await amqp.connect(config.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue('payment_verified', { durable: true });
    console.log('[Cart Service] Waiting for payment messages.');
    channel.consume('payment_verified', handlePaymentVerified, { noAck: false });
  } catch (error) {
    console.error('[Cart Service] Failed to connect to RabbitMQ for consumption:', error);
    setTimeout(connectAndConsume, 5000); // Retry connection
  }
};