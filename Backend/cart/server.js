import app from './src/app.js';
import connectDB from './src/db/db.js';
import { connectProducer } from './src/broker/publisher.js';
import startExpireOrdersCron from './src/cron/expireOrders.js';
import config from './src/config/config.js';

const PORT = config.PORT;

if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      await connectDB();
      await connectProducer();
      startExpireOrdersCron();

      app.listen(PORT, () => {
        console.log(`Cart server is running on port ${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start Cart service:', error);
      process.exit(1);
    }
  })();
}
