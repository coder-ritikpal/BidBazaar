import cron from 'node-cron';
import orderModel from '../models/order.model.js';

const startExpireOrdersCron = () => {
  // Run every hour at the top of the hour
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running expireOrders job...');
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const result = await orderModel.updateMany(
        {
          status: 'pending_payment',
          createdAt: { $lt: twentyFourHoursAgo }
        },
        {
          $set: { status: 'cancelled_unpaid' }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`[CRON] Successfully cancelled ${result.modifiedCount} unpaid orders that exceeded the 24-hour timeout.`);
        // Note: In a fully complete system, we might also want to publish an event here
        // to penalize the user (unpaid strike) and free the auction in the features service.
      } else {
        console.log('[CRON] No orders to expire at this time.');
      }
    } catch (error) {
      console.error('[CRON] Error expiring orders:', error);
    }
  });
};

export default startExpireOrdersCron;

