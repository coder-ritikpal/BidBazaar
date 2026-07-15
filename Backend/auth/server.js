import app from './src/app.js';
import connectDB from './src/db/db.js';
import { connectRabbitMQ } from './src/broker/rabbit.js';

// Only connect to the database and RabbitMQ if not in a test environment
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      await connectRabbitMQ(); // Await RabbitMQ connection
      await connectDB();       // Await MongoDB connection
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`Auth server is running on port ${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start Auth service due to critical dependency error:', error);
      process.exit(1); // Exit if critical services fail to connect
    }
  })();
} else {
  // In test environment, the app might be imported for supertest or similar.
  // If a test server needs to listen, it should be handled by the test runner or explicitly.
  // For now, we'll assume it's not listening in test mode unless explicitly configured.
}
