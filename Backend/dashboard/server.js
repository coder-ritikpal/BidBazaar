import app from './src/app.js';
import connectDB from './src/db/db.js';

// Only connect to the database and RabbitMQ if not in a test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}
 
 const PORT = process.env.PORT || 3004;
 
if(process.env.NODE_ENV !== 'test'){app.listen(PORT, () => {
  console.log(`Dashboard server is running on port ${PORT}`);
});}
