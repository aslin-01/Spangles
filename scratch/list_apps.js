import mongoose from "mongoose";
import Application from "../models/Application.js";
import dotenv from "dotenv";

dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const apps = await Application.find({}, { _id: 1, yourName: 1 });
    console.log("All Application IDs in DB:");
    apps.forEach(app => console.log(`- ${app._id} (${app.yourName})`));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
