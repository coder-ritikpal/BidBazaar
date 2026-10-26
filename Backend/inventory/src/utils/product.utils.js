import config from "../config/config.js";

export const REVIEW_WINDOW_MS = (config.REVIEW_WINDOW_MINUTES || 30) * 60 * 1000;
export const MIN_AUCTION_DURATION_MS = (config.MIN_AUCTION_DURATION_MINUTES || 5) * 60 * 1000;

export const toDurationMs = (duration, unit = "days") => {
  const parsedDuration = Number(duration || 0);
  switch (unit) {
    case "minutes":
      return parsedDuration * 60 * 1000;
    case "hours":
      return parsedDuration * 60 * 60 * 1000;
    default: // days
      return parsedDuration * 24 * 60 * 60 * 1000;
  }
};

export const getAuctionEndTime = (product) => {
  const durationInMs = toDurationMs(product.auctionDuration, product.auctionDurationUnit);
  return new Date(new Date(product.startAuctionAt).getTime() + durationInMs);
};

export const getAuctionStatus = (product, now = Date.now()) => {
  const reviewEndsAtTime = new Date(product.reviewEndsAt).getTime();
  const startAuctionAtTime = new Date(product.startAuctionAt).getTime();
  const endAuctionAtTime = getAuctionEndTime(product).getTime();

  if (now >= endAuctionAtTime) return "ended";
  if (now >= startAuctionAtTime) return "live";
  if (now >= reviewEndsAtTime) return "upcoming";
  return "under_review";
};

export const toProductResponse = (product) => {
  const productObject = product.toObject ? product.toObject() : product;
  return {
    ...productObject,
    status: getAuctionStatus(productObject),
    endAuctionAt: getAuctionEndTime(productObject),
  };
};

export const resolveReviewTimeline = ({ startOption, startAuctionAt: requestedStart }) => {
  const now = Date.now();
  let startAuctionAt, reviewEndsAt;
  const minStartTime = now + REVIEW_WINDOW_MS;

  if (startOption === "now") {
    // For 'now', the review window is a fixed duration from creation.
    // The auction starts right after.
    startAuctionAt = new Date(minStartTime);
  } else {
    // For 'later', the auction starts at the user's requested time,
    // but no earlier than the end of the minimum review window.
    const requestedStartTime = new Date(requestedStart).getTime();
    startAuctionAt = new Date(Math.max(requestedStartTime, minStartTime));
  }

  // The review/editable period always ends when the auction is set to start.
  reviewEndsAt = startAuctionAt;

  return { reviewEndsAt, startAuctionAt };
};

