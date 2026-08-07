import app from './src/app.js';
import connectDB from './src/db/db.js';
import { connectAndConsume } from './src/broker/consumer.js';

// Only connect to the database and RabbitMQ if not in a test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB();
  // Connect to RabbitMQ and start consuming messages for payment verification
  connectAndConsume();
}
 
 const PORT = process.env.PORT || 3003;
 
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Cart server is running on port ${PORT}`);
  });
}