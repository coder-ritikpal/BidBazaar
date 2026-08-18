import { jest } from "@jest/globals";

const wishlistModel = {
  find: jest.fn(),
  create: jest.fn(),
  findOneAndDelete: jest.fn(),
};

jest.unstable_mockModule("../../src/models/wishlist.model.js", () => ({
  default: wishlistModel,
}));

const { health, getWishlist, addToWishlist, removeFromWishlist } =
  await import("../../src/controllers/dashboard.controller.js");

const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("dashboard controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete global.fetch;
  });

  test("health returns the dashboard service status", async () => {
    const res = makeResponse();

    await health({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true, service: "dashboard" });
  });

  test("getWishlist returns only the authenticated user's mapped snapshots", async () => {
    const items = [
      { auctionId: "auction-2", snapshot: { title: "Second" } },
      { auctionId: "auction-1", snapshot: { title: "First" } },
    ];
    const lean = jest.fn().mockResolvedValue(items);
    const sort = jest.fn().mockReturnValue({ lean });
    wishlistModel.find.mockReturnValue({ sort });
    const res = makeResponse();

    await getWishlist({ user: { id: "user-1" } }, res);

    expect(wishlistModel.find).toHaveBeenCalledWith({ userId: "user-1" });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Wishlist fetched successfully.",
      wishlist: [
        { _id: "auction-2", title: "Second" },
        { _id: "auction-1", title: "First" },
      ],
    });
  });

  test("addToWishlist rejects a missing auction id", async () => {
    const res = makeResponse();

    await addToWishlist({ user: { id: "user-1" }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "auctionId is required" });
    expect(wishlistModel.create).not.toHaveBeenCalled();
  });

  test("addToWishlist stores the normalized auction snapshot", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        auction: {
          title: "Camera",
          images: [{ url: "camera.jpg" }],
          currentBid: 125,
          status: "active",
        },
      }),
    });
    wishlistModel.create.mockResolvedValue({
      auctionId: "auction-1",
      snapshot: { title: "Camera", currentBid: 125, status: "active" },
    });
    const res = makeResponse();

    await addToWishlist({ user: { id: "user-1" }, body: { auctionId: "auction-1" } }, res);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: "http://localhost:3002/api/auctions/auction-1" }),
      { method: "GET" },
    );
    expect(wishlistModel.create).toHaveBeenCalledWith({
      userId: "user-1",
      auctionId: "auction-1",
      snapshot: expect.objectContaining({
        title: "Camera",
        image: "camera.jpg",
        currentBid: 125,
        status: "active",
      }),
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("addToWishlist translates duplicate database errors", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ title: "Camera" }),
    });
    wishlistModel.create.mockRejectedValue({ code: 11000 });
    const res = makeResponse();

    await addToWishlist({ user: { id: "user-1" }, body: { auctionId: "auction-1" } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Item already in wishlist" });
  });

  test("removeFromWishlist returns not found when no item was deleted", async () => {
    wishlistModel.findOneAndDelete.mockResolvedValue(null);
    const res = makeResponse();

    await removeFromWishlist(
      { user: { id: "user-1" }, params: { auctionId: "auction-1" } },
      res,
    );

    expect(wishlistModel.findOneAndDelete).toHaveBeenCalledWith({
      userId: "user-1",
      auctionId: "auction-1",
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Wishlist item not found" });
  });
});
