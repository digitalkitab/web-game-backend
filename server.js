const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* ======================
   IN-MEMORY DATABASE
====================== */
let users = [
  { username: "admin", password: "admin123" }
];

let forgotRequests = [];

/* ======================
   LOGIN
====================== */
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (user) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

/* ======================
   SIGNUP
====================== */
app.post("/signup", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ success: false, message: "Missing fields" });
  }

  const exists = users.find(u => u.username === username);
  if (exists) {
    return res.json({ success: false, message: "Username already exists" });
  }

  users.push({ username, password });
  console.log("New user:", username);

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
   ADMIN – VIEW REQUESTS
====================== */
app.get("/admin/forgot-requests", (req, res) => {
  res.json(forgotRequests);
});

/* ======================
   ADMIN – RESET PASSWORD
====================== */
app.post("/admin/reset-password", (req, res) => {
  const { username, newPassword } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.json({ success: false });
  }

  user.password = newPassword;
  console.log("Password reset:", username);

  res.json({ success: true });
});

/* ======================
   START SERVER
====================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
