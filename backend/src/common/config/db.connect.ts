// src/config/db.ts
import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI as string
    );

    console.log(`MongoDB Connected:  `);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1); // stop server if DB fails
  }
};

export default connectDB;