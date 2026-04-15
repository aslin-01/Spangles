import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    yourName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    yourEmail: { type: String, required: true },

    experienceYears: { type: String, required: true },

    // ✅ optional fields
    skills: { type: String, default: "" },
    salaryExpectation: { type: String, default: "" },

    designation: { type: String },
    description: { type: String },
    appliedDate: { type: Date, default: Date.now },

    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    jobTitle: { type: String },

    status: { type: String, default: "new" },

    pdfFile: {
      filename: String,
      contentType: String,
      size: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Application", applicationSchema);