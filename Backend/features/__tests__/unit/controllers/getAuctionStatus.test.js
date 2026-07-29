import { getAuctionStatus } from "../../../src/controllers/auction.controller.js";

describe("getAuctionStatus", () => {
  const now = new Date("2023-01-01T12:00:00.000Z").getTime();

  it('should return "cancelled" if cancelledAt is set', () => {
    const auction = { cancelledAt: new Date() };
    expect(getAuctionStatus(auction, now)).toBe("cancelled");
  });

  it('should return "ended" if endAuctionAt is set and in the past', () => {
    const auction = { endAuctionAt: new Date(now - 1000) };
    expect(getAuctionStatus(auction, now)).toBe("ended");
  });

  it('should return "ended" if the calculated end time is in the past', () => {
    const auction = {
      startAuctionAt: new Date(now - 2 * 60 * 60 * 1000), // 2 hours ago
      auctionDuration: 1,
      auctionDurationUnit: "hours",
    };
    expect(getAuctionStatus(auction, now)).toBe("ended");
  });

  it('should return "live" if the start time is in the past and end time is in the future', () => {
    const auction = {
      startAuctionAt: new Date(now - 1 * 60 * 60 * 1000), // 1 hour ago
      auctionDuration: 2,
      auctionDurationUnit: "hours",
    };
    expect(getAuctionStatus(auction, now)).toBe("live");
  });

  it('should return "upcoming" if the start time is in the future', () => {
    const auction = {
      startAuctionAt: new Date(now + 1 * 60 * 60 * 1000), // 1 hour from now
      auctionDuration: 2,
      auctionDurationUnit: "hours",
    };
    expect(getAuctionStatus(auction, now)).toBe("upcoming");
  });

  it('should correctly calculate end time with "minutes"', () => {
    const auction = {
      startAuctionAt: new Date(now - 30 * 60 * 1000), // 30 mins ago
      auctionDuration: 20,
      auctionDurationUnit: "minutes",
    };
    expect(getAuctionStatus(auction, now)).toBe("ended");
  });

  it('should correctly calculate end time with "days"', () => {
    const auction = {
      startAuctionAt: new Date(now - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      auctionDuration: 1,
      auctionDurationUnit: "days",
    };
    expect(getAuctionStatus(auction, now)).toBe("ended");
  });

  it('should return "live" right at the start moment', () => {
    const auction = {
      startAuctionAt: new Date(now),
      auctionDuration: 1,
      auctionDurationUnit: "hours",
    };
    expect(getAuctionStatus(auction, now)).toBe("live");
  });
});