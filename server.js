import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import userRoutes from "./routes/userRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import quotationRoutes from "./routes/quotationRoutes.js";
import contactRoutes from "./routes/contactRoutes.js"


dotenv.config();

const app = express();

/* ---------- PATH FIX (WINDOWS SAFE) ---------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------- MIDDLEWARE ---------- */
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

/* ✅ STATIC UPLOADS (CRITICAL) */
// Block direct access to gallery folder (it must go through /api/gallery/view/:filename)
app.use("/uploads/gallery", (req, res, next) => {
  res.status(403).json({ message: "Direct access to gallery resources is forbidden" });
});

// Block direct access to blogs folder (it must go through /api/blogs/view/:filename)
app.use("/uploads/blogs", (req, res, next) => {
  res.status(403).json({ message: "Direct access to blog resources is forbidden" });
});

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

/* ---------- ROUTES ---------- */
app.use("/api/users", userRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/contact", contactRoutes);


/* ---------- DATABASE ---------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB error:", err);
    // ✅ DO NOT STOP SERVER
  });

/* ---------- ROOT ---------- */
app.get("/", (req, res) => {
  res.json({ message: "🚀 API Running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📂 Uploads → http://localhost:${PORT}/uploads`);
  console.log(`🛡️  SECURITY UPDATE: Password Hashing is ACTIVE`);
});
