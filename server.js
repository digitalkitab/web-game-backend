const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

/* ===== MONGODB CONNECT ===== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB error:", err.message));

/* ===== SCHEMAS ===== */
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  phone:    { type: String, required: true },
  password: { type: String, required: true },
  approved: { type: Boolean, default: false }
});

const ForgotSchema = new mongoose.Schema({
  username: String,
  time: String,
  status: String
});

const User = mongoose.model("User", UserSchema);
const Forgot = mongoose.model("Forgot", ForgotSchema);

/* ===== SIGNUP ===== */
app.post("/signup", async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    if (!username || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      phone,
      password: hash,
      approved: false
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ===== LOGIN ===== */
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.json({ success: false });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.json({ success: false });

    if (!user.approved) {
      return res.json({ success: false, message: "Waiting for admin approval" });
    }

    res.json({ success: true });

  } catch {
    res.status(500).json({ success: false });
  }
});

/* ===== FORGOT PASSWORD ===== */
app.post("/forgot-password", async (req, res) => {
  await Forgot.create({
    username: req.body.username,
    time: new Date().toLocaleString(),
    status: "pending"
  });
  res.json({ success: true });
});

/* ===== ADMIN: PENDING USERS ===== */
app.get("/admin/pending-users", async (req, res) => {
  try {
    const users = await User.find({ approved: false }).select("-password");
    res.json(users);
  } catch {
    res.status(500).json([]);
  }
});

/* ===== ADMIN: APPROVE USER ===== */
app.post("/admin/approve-user", async (req, res) => {
  const { userId } = req.body;
  await User.findByIdAndUpdate(userId, { approved: true });
  res.json({ success: true });
});

/* ===== ADMIN: REJECT USER ===== */
app.post("/admin/reject-user", async (req, res) => {
  const { userId } = req.body;
  await User.findByIdAndDelete(userId);
  res.json({ success: true });
});

/* ===== START ===== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Backend running on port", PORT);
});
