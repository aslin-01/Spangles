import dotenv from "dotenv";
import dns from "dns";
import mongoose from "mongoose";

dotenv.config();

const dnsServers = process.env.DNS_SERVERS
  ? process.env.DNS_SERVERS.split(",").map((s) => s.trim())
  : ["8.8.8.8", "1.1.1.1"];

try {
  dns.setServers(dnsServers);
  console.log("🌐 Using DNS servers:", dnsServers);
} catch (err) {
  console.log("❌ DNS error:", err.message);
}

console.log("URI is:", process.env.MONGO_URI ? "Present" : "Missing");

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  })
  .then(() => {
     console.log("✅ MongoDB connected");
     process.exit(0);
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  });
