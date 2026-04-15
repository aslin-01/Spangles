import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    for (let user of users) {
      // Check if password looks like a bcrypt hash (starts with $2a$ or $2b$ or $2y$)
      const isHashed = /^\$2[aby]\$/.test(user.password);
      
      if (!isHashed) {
        console.log(`Hashing password for user: ${user.username}`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        
        // ✅ Use updateOne to bypass the model's pre-save hook (prevents double-hashing)
        await User.updateOne({ _id: user._id }, { password: hashedPassword });
        console.log(`Successfully hashed: ${user.username}`);
      } else {
        console.log(`User ${user.username} already has a hashed password`);
      }
    }


    console.log("Migration complete");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
