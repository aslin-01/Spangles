import Job from "../models/Job.js";

/* Admin – all jobs */
export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
};

/* 🌍 Public – ONLY active jobs */
// export const getPublicJobs = async (req, res) => {
//   const jobs = await Job.find({ status: "Active" }).sort({
//     createdAt: -1,
//   });
//   res.json(jobs);
// };
export const getPublicJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ 
      status: { $in: ["Active", "On Hold"] } 
    }).sort({ createdAt: -1 });
    
    console.log("🔍 Backend returning jobs with statuses:", 
      jobs.map(j => ({ title: j.jobTitle, status: j.status }))
    );
    
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching public jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
};
export const createJob = async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json(job);
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(job);
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ error: error.message });
  }
};
