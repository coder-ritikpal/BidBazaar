import app from './src/app.js';
import { connectRabbitMQ } from './src/broker/rabbit.js';
import startListener from './src/broker/listener.js';

connectRabbitMQ().then(() => {
  startListener();
}).catch((error) => {
  console.error("Error initializing RabbitMQ:", error);
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Notification service is running on port ${PORT}`);
});