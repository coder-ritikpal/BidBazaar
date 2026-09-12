import cron from 'node-cron';
import auctionModel from '../models/auction.model.js';
import { getAuctionStatus, toAuctionResponse } from '../controllers/auction.controller.js';

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
        const currentStatus = getAuctionStatus(auction);
        if (currentStatus === 'ended') {
          // toAuctionResponse automatically determines the winner, saves deleteAt, 
          // and triggers order auto-creation in the cart service.
          await toAuctionResponse(auction);
          resolvedCount++;
        }
      }

      if (resolvedCount > 0) {
        console.log(`[CRON] Successfully resolved ${resolvedCount} ended auctions.`);
      } else {
        console.log('[CRON] No newly ended auctions to resolve at this time.');
      }
    } catch (error) {
      console.error('[CRON] Error resolving auctions:', error);
    }
  });
};

export default startResolveAuctionsCron;

