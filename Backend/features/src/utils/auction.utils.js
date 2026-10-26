import config from "../config/config.js";
import { AUCTION_DURATION_UNITS } from "../constants/auction.constants.js";

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

export const ensureMinAuctionDuration = (duration, unit) => {
  if (toDurationMs(duration, unit) < MIN_AUCTION_DURATION_MS) {
    const error = new Error(`Auction duration must be at least ${config.MIN_AUCTION_DURATION_MINUTES || 5} minutes.`);
    error.statusCode = 400;
    throw error;
  }
};

export const isValidDurationUnit = (unit) => AUCTION_DURATION_UNITS.includes(unit);

export const getAuctionEndTime = (auction) => {
  if (auction.endAuctionAt) return new Date(auction.endAuctionAt); // If manually ended
  const durationInMs = toDurationMs(auction.auctionDuration, auction.auctionDurationUnit);
  return new Date(new Date(auction.startAuctionAt).getTime() + durationInMs);
};

export const maskName = (name) => {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (trimmed.length <= 2) return `${trimmed[0]}*`;
  if (trimmed.length === 3) return `${trimmed[0]}*${trimmed[2]}`;
  return `${trimmed[0]}***${trimmed[trimmed.length - 1]}`;
};

export const formatMaskedBidder = (fullName) => {
  if (!fullName) return null;
  let firstName = '';
  let lastName = '';
  if (typeof fullName === 'object') {
    firstName = fullName.firstName || '';
    lastName = fullName.lastName || '';
  } else if (typeof fullName === 'string') {
    const parts = fullName.trim().split(/\s+/);
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }
  if (firstName && lastName) {
    const maskedFirst = maskName(firstName);
    const lastInitial = lastName.trim()[0]?.toUpperCase() || '';
    return `${maskedFirst} ${lastInitial}.`;
  }
  if (firstName) {
    return maskName(firstName);
  }
  return null;
};

export const getAuctionStatus = (auction, now = Date.now()) => {
  if (auction.cancelledAt) return "cancelled";
  if (auction.endAuctionAt && now >= new Date(auction.endAuctionAt).getTime()) {
    return "ended";
  }

  const startAuctionAtTime = new Date(auction.startAuctionAt).getTime();
  const endAuctionAtTime = getAuctionEndTime(auction).getTime();

  if (now >= endAuctionAtTime) return "ended";
  if (now >= startAuctionAtTime) return "live";
  return "upcoming";
};

export const toAuctionResponse = async (auction) => {
  const endAuctionAtTime = getAuctionEndTime(auction).getTime();
  const currentStatus = getAuctionStatus(auction);
  const response = {
    ...auction.toObject(),
    status: currentStatus,
    endAuctionAt: new Date(endAuctionAtTime),
  };

  // This private mapping is used internally to assign stable public labels.
  // Never expose bidder ObjectIds through the public auction response.
  delete response.uniqueBidders;
  return response;
};

