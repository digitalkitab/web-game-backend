const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

/* ======================
   ADMIN SECRET
====================== */
const ADMIN_SECRET = "admin@ak47$pawan";

/* ======================
   IN-MEMORY DATABASE
====================== */
let users = [
  {
    username: "admin",
    password: bcrypt.hashSync("admin123", 10)
  }
];

let forgotRequests = [];

/* ======================
   LOGIN
====================== */
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.json({ success: false });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.json({ success: false });
  }

  res.json({ success: true });
});

/* ======================
   SIGNUP (HASHED)
====================== */
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ success: false, message: "Missing fields" });
  }

  const exists = users.find(u => u.username === username);
  if (exists) {
    return res.json({ success: false, message: "Username already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);
  users.push({ username, password: hashed });

  console.log("New secure user:", username);
  res.json({ success: true });
});

/* ======================
   FORGOT PASSWORD
====================== */
app.post("/forgot-password", (req, res) => {
  const { username } = req.body;

  forgotRequests.push({
    username,
    time: new Date().toLocaleString(),
    status: "pending"
  });

  console.log("Forgot request:", username);
  res.json({ success: true });
});

/* ======================
   ADMIN AUTH MIDDLEWARE
====================== */
function adminAuth(req, res, next) {
  const secret = req.headers["x-admin-secret"];
  if (secret !== ADMIN_SECRET) {
    return res.status(401).json({ success: false });
  }
  next();
}

/* ======================
   ADMIN – VIEW REQUESTS
====================== */
app.get("/admin/forgot-requests", adminAuth, (req, res) => {
  res.json(forgotRequests);
});

/* ======================
   ADMIN – RESET PASSWORD
====================== */
app.post("/admin/reset-password", adminAuth, async (req, res) => {
  const { username, newPassword } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.json({ success: false });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  console.log("Admin reset password:", username);

  res.json({ success: true });
});

/* ======================
   START SERVER
====================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Secure backend running on port", PORT);
});

