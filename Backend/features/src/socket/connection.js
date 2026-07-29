const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join_auction", (auctionId) => {
      if (auctionId) {
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