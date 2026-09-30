import app from "./src/app.js";
import connectDB from "./src/db/db.js";
import { connectRabbitMQ } from "./src/broker/rabbit.js";


const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  connectDB();
  connectRabbitMQ();
}

if(process.env.NODE_ENV !== 'test'){app.listen(PORT, () => {
  console.log(`Inventory server is running on port ${PORT}`);
});}