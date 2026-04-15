import express from "express";
import {
  getJobs,
  getPublicJobs,
  createJob,
  updateJob,
  deleteJob
} from "../controllers/jobController.js";

const router = express.Router();

// public careers page
router.get("/public", getPublicJobs);

// admin
router.get("/", getJobs);
router.post("/", createJob);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

// Add to your jobRoutes.js
router.get("/test", async (req, res) => {
  const allJobs = await Job.find();
  const statusCounts = {
    total: allJobs.length,
    active: allJobs.filter(j => j.status === "Active").length,
    onHold: allJobs.filter(j => j.status === "On Hold").length,
    inactive: allJobs.filter(j => j.status === "Inactive").length
  };
  
  res.json({
    message: "Test endpoint",
    statusCounts,
    allJobs: allJobs.map(j => ({ title: j.jobTitle, status: j.status }))
  });
});
export default router;
