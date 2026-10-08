import app from "./src/app.js";
import connectDB from "./src/db/db.js";
import { connectRabbitMQ } from "./src/broker/rabbit.js";


const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      await connectDB();
      await connectRabbitMQ();
      app.listen(PORT, () => {
        console.log(`Inventory server is running on port ${PORT}`);
      });
    } catch (error) {
      console.error("Failed to start Inventory service:", error);
      process.exit(1);
    }
  })();
}