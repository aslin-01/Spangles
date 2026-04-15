import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const inspectUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const users = await User.find({}).limit(5);
    console.log("Inspecting up to 5 users:");
    users.forEach(u => {
        console.log(`- Username: ${u.username}, Role: ${u.role}, HasPassword: ${!!u.password}`);
        if (u.password) {
            console.log(`  Password starts with: ${u.password.substring(0, 10)}...`);
        }
    });

    process.exit(0);
  } catch (err) {
    console.error("❌ Inspection failed:", err);
    process.exit(1);
  }
};

inspectUsers();
