import Application from "../models/Application.js";
import Job from "../models/Job.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* --------------------------------------------------- */
export const createApplication = async (req, res) => {
  try {
    // ✅ check file
    if (!req.file) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    // ✅ get data from body
    const {
      yourName,
      yourEmail,
      mobileNumber,
      skills,
      experienceYears,
      salaryExpectation,
      jobId,
    } = req.body;

    // ✅ required validation
    if (!yourName || !yourEmail || !mobileNumber || !jobId) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // ✅ fetch job
    const jobData = await Job.findById(jobId);
    if (!jobData) {
      return res.status(404).json({ message: "Job not found" });
    }

    // ✅ create application (IMPORTANT FIX HERE)
    const application = new Application({
      yourName,
      yourEmail,
      mobileNumber,

      // ✅ MUST BE VALUES (NOT SCHEMA)
      experienceYears: experienceYears ? String(experienceYears) : "",
      skills: skills ? String(skills) : "",
      salaryExpectation: salaryExpectation ? String(salaryExpectation) : "",

      jobId: jobData._id,
      jobTitle: jobData.jobTitle,
      designation: jobData.designation,
      description: jobData.jobSummary,

      pdfFile: {
        filename: req.file.filename,
        contentType: req.file.mimetype,
        size: req.file.size,
      },
    });

    await application.save();

    res.status(201).json({ message: "Application submitted successfully" });

  } catch (err) {
    console.error("❌ Application Error:", err);
    res.status(500).json({ message: err.message });
  }
};
/* ---------------------------------------------------
   GET APPLICATION RESUME (PDF / IMAGE)
--------------------------------------------------- */
export const getApplicationPDF = async (req, res) => {
  try {
    console.log("🔍 Fetching resume for ID:", req.params.id);
    const application = await Application.findById(req.params.id);

    if (!application) {
      console.log("❌ Application document not found in DB for ID:", req.params.id);
      return res.status(404).send(`Resume not found for ID: ${req.params.id}`);
    }

    if (!application.pdfFile?.filename) {
      console.log("❌ Application found but pdfFile.filename is missing:", application);
      return res.status(404).send("Resume file information missing in application record");
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const uploadsDir = path.join(__dirname, "..", "uploads");

    const filePath = path.join(uploadsDir, application.pdfFile.filename);
    console.log("📂 Resolved filePath:", filePath);

    if (!fs.existsSync(filePath)) {
      console.error("❌ File missing on disk:", filePath);
      return res.status(404).send("File missing on server");
    }

    res.setHeader("Content-Type", application.pdfFile.contentType || "application/pdf");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.sendFile(filePath);

  } catch (err) {
    console.error("🔥 Resume fetch error:", err);
    res.status(500).send("Server error: " + err.message);
  }
};

/* ---------------------------------------------------
   GET ALL APPLICATIONS (WITHOUT FILE BINARY)
--------------------------------------------------- */
export const getApplications = async (req, res) => {
  try {
    let apps = await Application.find().sort({ createdAt: -1 }).lean();
    apps = apps.map((a) => {
      if (a.pdfFile?.data) delete a.pdfFile.data;
      return a;
    });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------------------------------------------
   UPDATE APPLICATION STATUS
--------------------------------------------------- */
export const updateApplicationStatus = async (req, res) => {
  try {
    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ message: err.message });
  }
};