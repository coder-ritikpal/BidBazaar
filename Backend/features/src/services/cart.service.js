import config from '../config/config.js';

/**
 * Communicates with the Cart service to create an order when an auction is won.
 * This is called from the auction controller when an auction's status becomes 'ended'.
 * @param {object} auction - The completed auction object.
 * @returns {Promise<boolean>} - True if the order creation was successful or already existed.
 */
export const createOrderForAuction = async (auction) => {
  try {
    if (!config.CART_SERVICE_URL) {
      console.error('CART_SERVICE_URL is not configured in the features service.');
      return false;
    }

    const url = new URL('/api/orders', config.CART_SERVICE_URL);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auctionId: auction._id,
        productId: auction.productId,
        sellerId: auction.sellerId,
        winnerId: auction.winnerId,
        amount: auction.currentPrice,
        title: auction.title,
        image: auction.images?.[0]?.url || auction.image || null,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error(`Error communicating with cart service for auction ${auction._id}:`, error);
    return false;
  }
};