/**
 * config/db.js
 * --------------------------------------------------
 * Establishes a connection to MongoDB Atlas using
 * Mongoose. The connection URI is read from the
 * MONGO_URI environment variable in .env.
 * --------------------------------------------------
 */

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
