const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

/* ================== MONGODB ================== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB error:", err.message));

/* ================== SCHEMAS ================== */

// Approved users
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  phone: String,
  password: String,
  approved: { type: Boolean, default: false }
});

// Signup approval requests
const SignupRequestSchema = new mongoose.Schema({
  username: String,
  email: String,
  phone: String,
  password: String,
  createdAt: { type: Date, default: Date.now }
});

// Forgot password requests
const ForgotSchema = new mongoose.Schema({
  username: String,
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: "pending" }
});

const User = mongoose.model("User", UserSchema);
const SignupRequest = mongoose.model("SignupRequest", SignupRequestSchema);
const Forgot = mongoose.model("Forgot", ForgotSchema);

/* ================== AUTH ================== */

// LOGIN (only approved users)
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.json({ success: false, message: "Invalid login" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.json({ success: false, message:_toggle });

  if (!user.approved) {
    return res.json({ success: false, message: "Waiting for admin approval" });
  }

  res.json({ success: true });
});

/* ================== SIGNUP ================== */

// Create signup request (NOT direct user)
app.post("/signup", async (req, res) => {
  const { username, email, phone, password } = req.body;

  if (!username || !email || !phone || !password) {
    return res.json({ success: false, message: "All fields required" });
  }

  const exists =
    await User.findOne({ username }) ||
    await SignupRequest.findOne({ username });

  if (exists) {
    return res.json({ success: false, message: "User already exists" });
  }

  const hash = await bcrypt.hash(password, 10);

  await SignupRequest.create({
    username,
    email,
    phone,
    password: hash
  });

  res.json({
    success: true,
    message: "Account created, waiting for admin approval"
  });
});

/* ================== FORGOT PASSWORD ================== */

// User sends forgot request
app.post("/forgot-password", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.json({ success: false });

  await Forgot.create({ username });
  res.json({ success: true });
});

/* ================== ADMIN ================== */

// Get all pending signup requests
app.get("/admin/signup-requests", async (req, res) => {
  const list = await SignupRequest.find().sort({ _id: -1 });
  res.json(list);
});

// Approve signup
app.post("/admin/approve-signup", async (req, res) => {
  const { id } = req.body;

  const reqq = await SignupRequest.findById(id);
  if (!reqq) return res.json({ success: false });

  await User.create({
    username: reqq.username,
    email: reqq.email,
    phone: reqq.phone,
    password: reqq.password,
    approved: true
  });

  await SignupRequest.findByIdAndDelete(id);
  res.json({ success: true });
});

// Reject signup
app.post("/admin/reject-signup", async (req, res) => {
  await SignupRequest.findByIdAndDelete(req.body.id);
  res.json({ success: true });
});

// Forgot password requests (admin panel)
app.get("/admin/forgot-requests", async (req, res) => {
  const list = await Forgot.find().sort({ _id: -1 });
  res.json(list);
});

// Admin resets password
app.post("/admin/reset-password", async (req, res) => {
  const { username, newPassword } = req.body;

  const hash = await bcrypt.hash(newPassword, 10);
  await User.findOneAndUpdate({ username }, { password: hash });

  await Forgot.deleteOne({ username });
  res.json({ success: true });
});

/* ================== START ================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Backend running on port", PORT);
});
