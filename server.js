const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const USERS_FILE = "./users.json";

// LOGIN API
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    const user = users.find(
        u => u.username === username && u.password === password
    );

    if (user) {
        res.json({ success: true, username: user.username });
    } else {
        res.json({ success: false });
    }
});

// SAVE SCORE API
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

// SERVER START
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
app.get("/", (req, res) => {
    res.send("Backend is running");
});
app.get("/", (req, res) => {
    res.send("Backend is running");
});
