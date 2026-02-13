/**
 * config/db.js
 * --------------------------------------------------
 * Establishes a connection to MongoDB Atlas using
 * Mongoose. The connection string is read from
 * process.env.MONGO_URI (set in .env or deployment env).
 * --------------------------------------------------
 */

import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI environment variable is not set.");
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
