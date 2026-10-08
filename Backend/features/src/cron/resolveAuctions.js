import cron from 'node-cron';
import auctionModel from '../models/auction.model.js';
import { getAuctionStatus, processAuctionTransitions, processUnresolvedOrders } from '../controllers/auction.controller.js';

const startResolveAuctionsCron = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Running resolveAuctions job...');
    try {
      // Find auctions that have NOT been resolved (deleteAt is null)
      // and haven't been cancelled
      const activeAuctions = await auctionModel.find({
        deleteAt: null,
        cancelledAt: null,
      });

      let resolvedCount = 0;

      for (const auction of activeAuctions) {
        // processAuctionTransitions determines if the auction is live or ended,
        // publishes relevant events, assigns winners, and sets deleteAt.
        await processAuctionTransitions(auction);

        const currentStatus = getAuctionStatus(auction);
        if (currentStatus === 'ended') {
          resolvedCount++;
        }
      }

      if (resolvedCount > 0) {
        console.log(`[CRON] Successfully resolved ${resolvedCount} ended auctions.`);
      } else {
        console.log('[CRON] No newly ended auctions to resolve at this time.');
      }

      // Also retry unresolved order creations
      const retriedCount = await processUnresolvedOrders();
      if (retriedCount > 0) {
        console.log(`[CRON] Triggered order creation retry for ${retriedCount} unresolved auctions.`);
      }

    } catch (error) {
      console.error('[CRON] Error resolving auctions:', error);
    }
  });
};

export default startResolveAuctionsCron;
