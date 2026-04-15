import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/* ------------------ ACCESS SCHEMA ------------------ */
const AccessSchema = new mongoose.Schema(
  {
    job: { type: Boolean, default: false },
    blogs: { type: Boolean, default: false },
    gallery: { type: Boolean, default: false },
    applicants: { type: Boolean, default: false },
    invoice: { type: Boolean, default: false },
    quotation: { type: Boolean, default: false },
  },
  { _id: false }
);

/* ------------------ USER SCHEMA ------------------ */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // Optional email (used internally for admin OTP)
    email: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    access: {
      type: AccessSchema,
      default: () => ({}),
    },

    /* -------- FORGOT PASSWORD / OTP -------- */
    resetOtp: {
      type: String,
    },

    resetOtpExpires: {
      type: Date,
    },

    isOtpVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.resetOtp;
        delete ret.resetOtpExpires;
        delete ret.isOtpVerified;
        return ret;
      },
    },
  }
);

// 🔐 Encrypt password before saving
UserSchema.pre("save", async function (next) {
  console.log("🔒 [TRACE-03] MODEL PRE-SAVE HOOK TRIGGERED:", this.username);

  // Skip hash if not modified
  if (!this.isModified("password")) {
    return next();
  }

  // Skip if already hashed
  if (/^\$2[aby]\$/.test(this.password)) {
    console.log("🔒 [TRACE-04] PASSWORD ALREADY HASHED, SKIPPING MODEL HASH");
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("🔒 [TRACE-05] PASSWORD HASHED IN MODEL");
    next();
  } catch (err) {
    console.error("❌ HASHING ERROR:", err);
    next(err);
  }
});



// 🔓 Compare entered password with hashed password
UserSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) {
    console.error("❌ [MODEL] comparePassword failed: No password hash found on user document");
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", UserSchema);
