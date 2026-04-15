import User from "../models/User.js";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

/* ================= MAIL TRANSPORT ================= */
const createTransporter = async () => {
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS missing in .env");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: EMAIL_USER, // HR email
      pass: EMAIL_PASS, // App password
    },
  });

  await transporter.verify();
  console.log("✅ Email transporter verified");

  return transporter;
};

/* ================= GET USERS ================= */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.json(users);
  } catch {
    res.status(500).json({ message: "Failed to load users" });
  }
};

/* ================= CREATE USER ================= */
export const createUser = async (req, res) => {
  try {
    const { name, phone, username, password, role, access, email } = req.body;

    if (!name || !phone || !username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(409).json({ message: "Username already exists" });
    }

    console.log("------------------------------------------");
    console.log("🔒 [TRACE-01] CREATING USER:", username);
    
    // 🔒 Manual hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("🔒 [TRACE-02] PASSWORD HASHED IN CONTROLLER");

    const user = await User.create({
      name,
      phone,
      username,
      password: hashedPassword,
      email,
      role,
      access,
    });

    console.log("✨ USER SAVED TO DB. PASSWORD IN OBJECT IS:", user.password);
    console.log("████████████████████████████████████████");

    res.status(201).json(user);

  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE USER ================= */
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};

/* ================= SEND ADMIN OTP ================= */
export const sendAdminOtp = async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return res.status(500).json({ message: "ADMIN_EMAIL not set" });
    }

    const admin = await User.findOne({ username: "Webx Admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // 🔐 Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    admin.resetOtp = otp;
    admin.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    admin.isOtpVerified = false;
    await admin.save();

    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: `"SPANGLES WBX Support" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: "Password Reset OTP",

      // Plain text (important for inbox delivery)
      text: `
Hello Webx Admin,

We received a request to reset your password.

Your One-Time Password (OTP) is:
${otp}

Please enter this OTP to proceed with resetting your password.

This code is valid for a limited time for security reasons (3 minutes).
If you did not request a password reset, please ignore this email.

Thank you,
SPANGLES WEBX
Support Team
      `,

      // HTML email
      html: `
        <p>Hello <b>Webx Admin</b>,</p>

        <p>We received a request to reset your password.</p>

        <p><b>Your One-Time Password (OTP) is:</b></p>

        <h2 style="letter-spacing:2px;">${otp}</h2>

        <p>Please enter this OTP to proceed with resetting your password.</p>

        <p style="color:#555;">
          This code is valid for a limited time for security reasons(3mins).
          <br />
          If you did not request a password reset, please ignore this email.
        </p>

        <br />

        <p>
          Thank you,<br />
          <b>SPANGLES WEBX</b><br />
          Support Team
        </p>
      `,
    });

    console.log("📨 OTP Mail sent:", info.messageId);

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

/* ================= VERIFY OTP ================= */
export const verifyAdminOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    const admin = await User.findOne({ username: "Webx Admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (
      !admin.resetOtp ||
      admin.resetOtp !== otp ||
      Date.now() > admin.resetOtpExpires
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    admin.isOtpVerified = true;
    await admin.save();

    res.json({ message: "OTP verified" });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ message: "OTP verification failed" });
  }
};

/* ================= RESET PASSWORD ================= */
export const resetAdminPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password required" });
    }

    // 🔐 Password strength check
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({ message: "WEAK_PASSWORD" });
    }

    const admin = await User.findOne({ username: "Webx Admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (!admin.isOtpVerified) {
      return res.status(400).json({ message: "OTP not verified" });
    }

    const isSamePassword = await admin.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ message: "SAME_PASSWORD" });
    }

    // ✅ Update password FIRST (most important)
    admin.password = newPassword;
    admin.resetOtp = null;
    admin.resetOtpExpires = null;
    admin.isOtpVerified = false;
    await admin.save();

    /* ================= SEND CONFIRMATION MAIL ================= */
    try {
      const transporter = await createTransporter();

      await transporter.sendMail({
        from: `"SPANGLES WBX Support" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: "Password Updated Successfully",

        text: `
Hello Webx Admin,

Your account password has been updated successfully.

If you performed this action, no further steps are required.
If you did not update your password, please contact support immediately.

Thank you,
SPANGLES WEBX
Support Team
        `,

        html: `
          <p>Hello <b>Webx Admin</b>,</p>

          <p>Your Admin Pannel password has been <b>UPDATED SUCESSFULLY</b>.</p>

          

          <br />

          <p>
            Thank you,<br />
            <b>SPANGLES WEBX</b><br />
            Support Team
          </p>
        `,
      });

      console.log("📧 Password confirmation email sent");
    } catch (mailErr) {
      console.error("⚠️ Password mail failed:", mailErr.message);
      // ❗ DO NOT fail password reset because of email
    }

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("RESET ERROR:", err);
    res.status(500).json({ message: "Password reset failed" });
  }
};
/* ================= LOGIN USER ================= */
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    console.log(`🔍 [LOGIN] Attempt for: ${username}`);
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log(`❌ [LOGIN] User not found: ${username}`);
      return res.status(401).json({ message: "Invalid username or password" });
    }

    console.log(`✅ [LOGIN] User found, comparing password...`);
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log(`❌ [LOGIN] Password mismatch for: ${username}`);
      return res.status(401).json({ message: "Invalid username or password" });
    }

    console.log(`✨ [LOGIN] Success for: ${username}`);

    // Return user data (sanitize!)
    const userData = {
      _id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      access: user.access,
    };

    res.json(userData);
  } catch (err) {
    console.error("CRITICAL LOGIN ERROR:", err);
    res.status(500).json({ 
      message: "Server error during login", 
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
};
