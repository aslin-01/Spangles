import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

async function testCreation() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for test");

    const tempUsername = "test_user_" + Date.now();
    const newUser = await User.create({
      name: "Test User",
      phone: "1234567890",
      username: tempUsername,
      password: "TestPassword123",
      role: "user"
    });

    console.log("User created:", newUser.username);
    
    // Check in DB directly via collection to see the actual value
    const rawUser = await mongoose.connection.db.collection('users').findOne({ username: tempUsername });
    console.log("Raw Password in DB:", rawUser.password);
    
    const isHashed = /^\$2[aby]\$/.test(rawUser.password);
    if (isHashed) {
      console.log("✅ SUCCESS: Password was hashed automatically.");
    } else {
      console.log("❌ FAILURE: Password was saved in plain text.");
    }

    // Cleanup
    await User.deleteOne({ _id: newUser._id });
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

testCreation();
