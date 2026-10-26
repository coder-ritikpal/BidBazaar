import config from "../config/config.js";

/**
 * Fetches auction details from the features (auctions) service.
 * @param {string} auctionId - The ID of the auction to fetch.
 * @returns {Promise<object>} The full auction object.
 */
export const fetchAuctionFromService = async (auctionId) => {
  if (!auctionId) {
    const error = new Error("auctionId is required to fetch auction details.");
    error.statusCode = 400;
    throw error;
  }
  if (!config.AUCTIONS_SERVICE_URL) {
    console.error("[Cart Service] AUCTIONS_SERVICE_URL is not configured.");
    const error = new Error("Internal configuration error: Auction service URL is missing.");
    error.statusCode = 500;
    throw error;
  }

  const url = new URL(`/api/auctions/${auctionId}`, config.AUCTIONS_SERVICE_URL);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        const error = new Error(`Auction with ID ${auctionId} not found.`);
        error.statusCode = 404;
        throw error;
      }
      const errorText = await response.text();
      console.error(`Failed to fetch auction ${auctionId}: ${response.status} ${response.statusText}`, errorText);
      const error = new Error("Failed to fetch auction details from features service.");
      error.statusCode = response.status || 500;
      throw error;
    }
    const data = await response.json();
    const auction = data?.auction || data;
    if (!auction) {
      const error = new Error(`Auction with ID ${auctionId} not found in response payload.`);
      error.statusCode = 404;
      throw error;
    }
    return auction;
  } catch (error) {
    console.error(`Error during fetch for auction ${auctionId}:`, error);
    throw error;
  }
};

