import Blog from "../models/Blog.js";
import path from "path";
import fs from "fs";
import slugify from "slugify";

/* -------------------- CREATE BLOG -------------------- */
export const createBlog = async (req, res) => {
  try {
    if (!req.body.title || !req.body.content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    // Generate slug from title
    const slug = slugify(req.body.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    // Normalize tags (Handle both array and comma-separated string)
    let tags = [];
    if (req.body.tags) {
      if (Array.isArray(req.body.tags)) {
        tags = req.body.tags.map(t => t.trim()).filter(Boolean);
      } else {
        tags = req.body.tags.split(",").map(t => t.trim()).filter(Boolean);
      }
    }

    const blog = new Blog({
      title: req.body.title,
      content: req.body.content,
      image: `/uploads/blogs/${req.file.filename}`,
      slug: slug,
      category: req.body.category || "",
      tags: tags,
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    console.error("Create blog error:", err);
    if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
      const uniqueSlug = slugify(req.body.title, { lower: true, strict: true }) + '-' + Date.now();
      try {
        const blog = new Blog({
          title: req.body.title,
          content: req.body.content,
          image: `/uploads/blogs/${req.file.filename}`,
          slug: uniqueSlug,
          category: req.body.category || "",
          tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags.map(t => t.trim()).filter(Boolean) : req.body.tags.split(",").map(t => t.trim()).filter(Boolean)) : [],
        });
        await blog.save();
        return res.status(201).json(blog);
      } catch (retryErr) {
        return res.status(500).json({ error: "Failed to create blog after retry" });
      }
    }
    res.status(500).json({ error: err.message || "Server error" });
  }
};

/* -------------------- GET ALL BLOGS -------------------- */
export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
};

/* -------------------- GET SINGLE BLOG -------------------- */
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (err) {
    if (err.kind === "ObjectId") return res.status(400).json({ error: "Invalid blog ID" });
    res.status(500).json({ error: err.message || "Server error" });
  }
};

/* -------------------- UPDATE BLOG -------------------- */
export const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    blog.title = req.body.title || blog.title;
    blog.content = req.body.content || blog.content;

    if (req.body.title && req.body.title !== blog.title) {
      blog.slug = slugify(req.body.title, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
      });
    }

    if (req.body.category !== undefined) {
      blog.category = req.body.category;
    }

    if (req.body.tags !== undefined) {
      if (Array.isArray(req.body.tags)) {
        blog.tags = req.body.tags.map(t => t.trim()).filter(Boolean);
      } else {
        blog.tags = req.body.tags.split(",").map(t => t.trim()).filter(Boolean);
      }
    }

    if (req.file) {
      if (blog.image) {
        const oldImagePath = path.join(process.cwd(), blog.image);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      blog.image = `/uploads/blogs/${req.file.filename}`;
    }

    await blog.save();
    res.json(blog);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
      return res.status(400).json({ error: "A blog with similar title already exists." });
    }
    if (err.kind === "ObjectId") return res.status(400).json({ error: "Invalid blog ID" });
    res.status(500).json({ error: err.message || "Server error" });
  }
};

/* -------------------- DELETE BLOG -------------------- */
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    if (blog.image) {
      const imagePath = path.join(process.cwd(), blog.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Blog deleted successfully" });
  } catch (err) {
    if (err.kind === "ObjectId") return res.status(400).json({ error: "Invalid blog ID" });
    res.status(500).json({ error: err.message || "Server error" });
  }
};


/* -------------------- SECURE IMAGE SERVING -------------------- */
export const serveBlogImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const blogsDir = path.join(process.cwd(), "uploads", "blogs");
    const filePath = path.join(blogsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Image not found");
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    
    res.sendFile(filePath);
  } catch (err) {
    console.error("Blog serve error:", err);
    res.status(500).send("Server error");
  }
};

