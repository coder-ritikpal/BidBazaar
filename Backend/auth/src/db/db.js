import mongoose from "mongoose";
import config from "../config/config.js";

async function connectDB() {
  try {
    const uri =
      process.env.NODE_ENV === "test"
        ? process.env.MONGO_URI   
        : config.MONGODB_URI;     

    await mongoose.connect(uri, { bufferCommands: false });

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

export default connectDB;

export { mongoose };