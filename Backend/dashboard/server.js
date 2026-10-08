import app from './src/app.js';
import connectDB from './src/db/db.js';

const PORT = process.env.PORT || 3004;

if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      await connectDB();
      app.listen(PORT, () => {
        console.log(`Dashboard server is running on port ${PORT}`);
      });
    } catch (error) {
      console.error("Failed to start Dashboard service:", error);
      process.exit(1);
    }
  })();
}
