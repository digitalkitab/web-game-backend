const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

const ADMIN_SECRET = process.env.ADMIN_SECRET;

/* ===== MONGODB CONNECT ===== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.log("❌ MongoDB connection error:", err.message);
  });

/* ===== SCHEMAS ===== */
const UserSchema = new mongoose.Schema({
  username: String,
  password: String
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
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.json({ success: false });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.json({ success: false });

  res.json({ success: true });
});

/* ===== SIGNUP ===== */
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const exists = await User.findOne({ username });
  if (exists) return res.json({ success: false });

  const hash = await bcrypt.hash(password, 10);
  await User.create({ username, password: hash });
  res.json({ success: true });
});

/* ===== FORGOT ===== */
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

