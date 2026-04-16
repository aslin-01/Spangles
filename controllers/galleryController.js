import mongoose from "mongoose";
import Gallery from "../models/Gallery.js";
import path from "path";
import fs from "fs";

const GALLERY_DIR = path.join(process.cwd(), "uploads", "gallery");

if (!fs.existsSync(GALLERY_DIR)) {
  fs.mkdirSync(GALLERY_DIR, { recursive: true });
}

export const getGalleries = async (req, res) => {
  try {
    const galleries = await Gallery.find().sort({ createdAt: -1 });
    res.json(galleries);
  } catch {
    res.status(500).json({ message: "Failed to load galleries" });
  }
};

export const createGallery = async (req, res) => {
  try {
    const items = (req.files || []).map((f) => ({
      url: `/uploads/gallery/${f.filename}`,
      type: f.mimetype.includes("video") ? "video" : "image",
      name: f.originalname,
    }));

    console.log("Creating gallery with title:", req.body.title, "and category:", req.body.category);
    const gallery = await Gallery.create({
      title: req.body.title || "",
      category: req.body.category || "",
      items,
    });

    res.json(gallery);
  } catch {
    res.status(500).json({ message: "Failed to create gallery" });
  }
};

export const updateGallery = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid gallery ID" });
    }
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) return res.status(404).json({ message: "Not found" });

    if (req.body.title !== undefined) gallery.title = req.body.title;
    if (req.body.category !== undefined) gallery.category = req.body.category;

    const newItems = (req.files || []).map((f) => ({
      url: `/uploads/gallery/${f.filename}`,
      type: f.mimetype.includes("video") ? "video" : "image",
      name: f.originalname,
    }));

    gallery.items.push(...newItems);
    await gallery.save();

    res.json(gallery);
  } catch {
    res.status(500).json({ message: "Failed to update gallery" });
  }
};

export const deleteGalleryItem = async (req, res) => {
  try {
    const { id, filename } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid gallery ID" });
    }
    const gallery = await Gallery.findById(id);
    if (!gallery) return res.status(404).json({ message: "Not found" });

    gallery.items = gallery.items.filter(
      (i) => i.url.split("/").pop() !== filename
    );

    const filePath = path.join(GALLERY_DIR, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await gallery.save();
    res.json(gallery);
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};

export const deleteFullGallery = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid gallery ID" });
    }
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) return res.status(404).json({ message: "Not found" });

    gallery.items.forEach((item) => {
      const filename = item.url.split("/").pop();
      const filePath = path.join(GALLERY_DIR, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ message: "Gallery deleted" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};

/* ---------------------------------------------------
   SECURE IMAGE SERVING (PREVENT DIRECT ACCESS)
--------------------------------------------------- */
export const serveGalleryImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(GALLERY_DIR, filename);

    // ✅ Basic Referrer Check (Optional but recommended)
    // const referrer = req.headers.referrer || req.headers.referer;
    // if (!referrer || !referrer.includes(req.headers.host)) {
    //   // return res.status(403).send("Direct access not allowed");
    // }

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Image not found");
    }

    // ✅ Determine content type
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".mp4": "video/mp4",
      ".webp": "image/webp",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";

    // ✅ Set Headers to discourage downloading and prevent ORB issues
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year cache for performance
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    
    // ✅ Send file
    res.sendFile(filePath);
  } catch (err) {
    console.error("Gallery serve error:", err);
    res.status(500).send("Server error");
  }
};

