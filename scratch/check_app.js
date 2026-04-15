import mongoose from "mongoose";
import Application from "../models/Application.js";
import dotenv from "dotenv";

dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const id = "69df0c814ff53d5a58b6e074";
    const app = await Application.findById(id);
    if (app) {
      console.log("Application found:", JSON.stringify(app, null, 2));
    } else {
      console.log("Application NOT found with ID:", id);
    }

    const id2 = "69df0d064ff53d5a58b6e08d";
    const app2 = await Application.findById(id2);
     if (app2) {
      console.log("Application found (2):", JSON.stringify(app2, null, 2));
    } else {
      console.log("Application NOT found with ID (2):", id2);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
