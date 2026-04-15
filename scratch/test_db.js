import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const testDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const users = await User.find({});
    console.log("Users found:", users.length);
    if (users.length > 0) {
        console.log("First user username:", users[0].username);
        console.log("First user role:", users[0].role);
    } else {
        console.log("No users found in database.");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exit(1);
  }
};

testDb();
