const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const ENDED_VISIBILITY_WINDOW_MS = 2 * DAY_IN_MS;

const toDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

export const getAuctionEndTime = (auction) => {
  const explicitEndTime = toDate(auction.endAuctionAt || auction.endTime);
  if (explicitEndTime) {
    return explicitEndTime;
  }

  const startTime = toDate(auction.startAuctionAt);
  if (!startTime) return new Date(); // Should not happen for valid auctions
  const duration = Number(auction.auctionDuration || 0);
  const unit = auction.auctionDurationUnit || 'days';
  const durationInMs = unit === 'hours' ? duration * 60 * 60 * 1000 : duration * DAY_IN_MS;
  return new Date(startTime.getTime() + durationInMs);
};

export const getAuctionStatus = (auction, now = Date.now()) => {
  if (auction.cancelledAt) {
    return 'cancelled';
  }

  const startTime = toDate(auction.startAuctionAt);
  const endTime = getAuctionEndTime(auction);

  if (startTime && now < startTime.getTime()) {
    return 'upcoming';
  }

  if (now <= endTime.getTime()) {
    return 'live';
  }

  if (now <= endTime.getTime() + ENDED_VISIBILITY_WINDOW_MS) {
    return 'ended';
  }

  return 'expired';
};

export const normalizeAuction = (auction, now = Date.now()) => {
  const startTime = toDate(auction.startAuctionAt);
  const endTime = getAuctionEndTime(auction);
  const status = getAuctionStatus(auction, now);

  return {
    ...auction,
    id: auction._id || auction.id,
    currentBid: auction.currentPrice || auction.currentBid || auction.startingPrice || auction.price || 0,
    imageUrl: auction.images?.[0]?.url || auction.images?.[0]?.thumbnailUrl || auction.image || '',
    startTime: startTime?.toISOString() || null,
    endTime: endTime.toISOString(),
    status,
  };
};

export const splitAuctionsByStatus = (auctions, now = Date.now()) => {
  const normalizedAuctions = auctions
    .map((auction) => normalizeAuction(auction, now))
    .filter((auction) => auction.status !== 'expired');

  return {
    upcoming: normalizedAuctions
      .filter((auction) => auction.status === 'upcoming')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    live: normalizedAuctions
      .filter((auction) => auction.status === 'live')
      .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime()),
    ended: normalizedAuctions
      .filter((auction) => auction.status === 'ended')
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()),
  };
};

export const getCountdownParts = (targetTime, now = Date.now()) => {
  const target = new Date(targetTime).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
  }

  const days = Math.floor(diff / DAY_IN_MS);
  const hours = Math.floor((diff % DAY_IN_MS) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diff % (60 * 1000)) / 1000);

  return { days, hours, minutes, seconds, isOver: false };
};

export const formatAuctionCountdown = (targetTime, now = Date.now(), endedLabel = 'Auction Ended') => {
  const target = new Date(targetTime).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return endedLabel;
  }

  const days = Math.floor(diff / DAY_IN_MS);
  const hours = Math.floor((diff % DAY_IN_MS) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diff % (60 * 1000)) / 1000);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};
