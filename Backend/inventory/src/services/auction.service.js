import config from "../config/config.js";

/**
 * A custom error class for issues communicating with the auction service.
 */
class AuctionServiceError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'AuctionServiceError';
    this.status = status;
    this.payload = payload;
  }
}

/**
 * A helper to construct the payload for auction creation and updates.
 * @param {object} productObject - The product object.
 * @returns {object} The payload for the auction service.
 */
const toAuctionPayload = (productObject) => ({
  productId: productObject._id,
  sellerId: productObject.sellerId,
  title: productObject.title,
  description: productObject.description,
  startingPrice: productObject.price,
  category: productObject.category,
  images: productObject.images,
  reviewEndsAt: productObject.reviewEndsAt,
  startAuctionAt: productObject.startAuctionAt,
  auctionDuration: productObject.auctionDuration,
  auctionDurationUnit: productObject.auctionDurationUnit,
  size: productObject.size,
  sizeUnit: productObject.sizeUnit,
  weight: productObject.weight,
  weightUnit: productObject.weightUnit,
  brand: productObject.brand,
  condition: productObject.condition,
  color: productObject.color,
  material: productObject.material,
});

/**
 * A generic request handler for the auction service.
 * @param {string} path - The API path (e.g., `/${auctionId}`).
 * @param {object} options - The options for the `fetch` call.
 * @returns {Promise<object|void>} The JSON response or void for 204.
 */
async function auctionServiceRequest(path, options) {
  const url = `${config.AUCTIONS_SERVICE_URL}/api/auctions${path}`;

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({
      message: `Request to auction service at '${path}' failed with status ${response.status}`,
    }));
    throw new AuctionServiceError(
      errorPayload.message || `Failed request to auction service at ${path}`,
      response.status,
      errorPayload
    );
  }

  if (response.status === 204) { // Handle No Content for DELETE
    return;
  }

  return response.json();
}

export async function createAuctionForProduct(product) {
  const productObject = product.toObject ? product.toObject() : product;
  const payload = toAuctionPayload(productObject);

  return auctionServiceRequest('', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateAuctionForProduct(product) {
  if (!product.auctionId) {
    throw new Error("Product does not have a linked auction to update.");
  }

  const productObject = product.toObject ? product.toObject() : product;
  const payload = toAuctionPayload(productObject);

  return auctionServiceRequest(`/${product.auctionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteAuctionForProduct(auctionId) {
  if (!auctionId) {
    throw new Error("Auction ID is required to delete an auction.");
  }

  return auctionServiceRequest(`/${auctionId}`, {
    method: "DELETE",
  });
}
