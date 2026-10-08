import mongoose from "mongoose";

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join_auction", (auctionId) => {
      if (typeof auctionId === "string" && mongoose.Types.ObjectId.isValid(auctionId)) {
        socket.join(auctionId);
        console.log(`Socket ${socket.id} joined auction room: ${auctionId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

export default initializeSocket;
