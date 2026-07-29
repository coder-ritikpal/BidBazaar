import { jest } from "@jest/globals";
import mongoose from "mongoose";

const findByIdAndDeleteMock = jest.fn();

jest.unstable_mockModule("../../../src/models/auction.model.js", () => ({
  default: {
    findByIdAndDelete: findByIdAndDeleteMock,
  },
}));

const { deleteAuction } = await import(
  "../../../src/controllers/auction.controller.js"
);

describe("deleteAuction", () => {
  let req, res;
  const auctionId = new mongoose.Types.ObjectId().toHexString();

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { auctionId } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
  });

  it("should delete an auction successfully", async () => {
    findByIdAndDeleteMock.mockResolvedValue({ _id: auctionId });

    await deleteAuction(req, res);

    expect(findByIdAndDeleteMock).toHaveBeenCalledWith(auctionId);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it("should return 404 if auction not found", async () => {
    findByIdAndDeleteMock.mockResolvedValue(null);

    await deleteAuction(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Auction not found" });
  });

  it("should return 400 on database error", async () => {
    const dbError = new Error("DB Error");
    findByIdAndDeleteMock.mockRejectedValue(dbError);

    await deleteAuction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to delete auction", error: "DB Error" });
  });
});