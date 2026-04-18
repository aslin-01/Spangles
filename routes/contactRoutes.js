import express from "express";
import Contact from "../models/Contact.js";

const router = express.Router();

/* ✅ VERY IMPORTANT TEST ROUTE */
router.get("/test", (req, res) => {
  res.send("Contact route working");
});

/* GET ALL ENQUIRIES */
router.get("/", async (req, res) => {
  try {
    const enquiries = await Contact.find().sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch enquiries" });
  }
});

/* POST CONTACT */
router.post("/", async (req, res) => {
  try {
    const { name, phone, email, subject, message, type } = req.body;

    const newContact = new Contact({
      name,
      phone,
      email,
      subject,
      message,
      type,
    });

    await newContact.save();

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* DELETE */
router.delete("/:id", async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;