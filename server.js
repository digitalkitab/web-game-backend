const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

/* ===== ENV ===== */
const ADMIN_SECRET = process.env.ADMIN_SECRET;

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
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ===== SIGNUP (FIXED) ===== */
app.post("/signup", async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    if (!username || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const exists = await User.findOne({
      $or: [{ username }, { email }]
    });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists"
      });
    }

    const hash = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      phone,
      password: hash,
      approved: false
    });

    return res.json({
      success: true,
      message: "Account created, waiting for admin approval"
    });

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({
      success: false,
      message: "Signup failed"
    });
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

/* ===== ADMIN AUTH ===== */
function adminAuth(req, res, next) {
  if (req.headers["x-admin-secret"] !== ADMIN_SECRET) {
    return res.status(401).json({ success: false });
  }
  next();
}

/* ===== ADMIN REQUESTS ===== */
app.get("/admin/forgot-requests", adminAuth, async (req, res) => {
  const list = await Forgot.find().sort({ _id: -1 });
  res.json(list);
});

/* ===== ADMIN RESET ===== */
app.post("/admin/reset-password", adminAuth, async (req, res) => {
  const hash = await bcrypt.hash(req.body.newPassword, 10);
  const user = await User.findOneAndUpdate(
    { username: req.body.username },
    { password: hash }
  );
  if (!user) return res.json({ success: false });
  res.json({ success: true });
});

/* ===== START ===== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Secure backend running on port", PORT);
});
