import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

/* ---------- ADMIN DETAILS ---------- */
const ADMIN_DATA = {
  name: " Admin",
  phone: "9999999999",
  username: "webxadmin",
  password: "Admin@123", // stored as plain text
  email: process.env.ADMIN_EMAIL,
  role: "admin",
  access: {
    job: true,
    blogs: true,
    gallery: true,
    applicants: true,
    invoice: true,
    quotation: true,
  },
};

async function createAdmin() {
  try {
    /* ---------- CONNECT DB ---------- */
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    /* ---------- CHECK EXISTING ADMIN ---------- */
    const existingAdmin = await User.findOne({
      username: ADMIN_DATA.username,
    });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists");
      process.exit(0);
    }

    /* ---------- CREATE ADMIN ---------- */
    const admin = new User(ADMIN_DATA);
    await admin.save();

    console.log("🚀 Admin user created successfully");
    console.log("👉 Username:", ADMIN_DATA.username);
    console.log("👉 Password:", ADMIN_DATA.password);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
}

createAdmin();
