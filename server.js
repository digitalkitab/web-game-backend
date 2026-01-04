const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const USERS_FILE = "./users.json";

/* ROOT CHECK */
app.get("/", (req, res) => {
  res.json({ status: "Backend running" });
});

/* LOGIN */
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));

  const user = users.find(
    u => u.username === username && u.password === password
  );

  res.json({ success: !!user });
});

/* SAVE SCORE */
app.post("/score", (req, res) => {
  const { username, score } = req.body;
  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));

  const user = users.find(u => u.username === username);
  if (user && score > user.highScore) {
    user.highScore = score;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  }

  res.json({ success: true });
});

/* LEADERBOARD */
app.get("/leaderboard", (req, res) => {
  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  users.sort((a, b) => b.highScore - a.highScore);
  res.json(users);
});

/* IMPORTANT: PORT FIX FOR RENDER */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

let forgotRequests = [];

app.post("/forgot-password", (req, res) => {
  const { username } = req.body;
  if (!username) return res.json({ success: false });

  forgotRequests.push({
    username,
    time: new Date().toLocaleString(),
    status: "pending"
  });

  console.log("Forgot password request:", username);
  res.json({ success: true });
});

app.get("/admin/forgot-requests", (req, res) => {
  res.json(forgotRequests);
});

app.post("/admin/forgot-done", (req, res) => {
  const { index } = req.body;
  if (forgotRequests[index]) {
    forgotRequests[index].status = "done";
  }
  res.json({ success: true });
});
