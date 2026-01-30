import app from './src/app.js';
import connectDB from './src/db/db.js';
import { connectRabbitMQ } from './src/broker/rabbit.js';

 connectRabbitMQ();

 connectDB();
 
 const PORT = process.env.PORT || 3000;
 
app.listen(PORT, () => {
  console.log(`Auth server is running on port ${PORT}`);
});
