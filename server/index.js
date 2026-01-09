const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_PATH = path.join(__dirname, "data", "menu.json");

function ensureFile() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({ version: 3, admin: [], user: [] }, null, 2), "utf-8");
  }
}

function readMenu() {
  ensureFile();
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeMenu(data) {
  ensureFile();
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

app.get("/api/menu", (req, res) => {
  try {
    return res.json(readMenu());
  } catch (e) {
    return res.status(500).json({ message: "Read menu failed", error: String(e) });
  }
});

app.put("/api/menu", (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object") return res.status(400).json({ message: "Invalid payload" });
    if (typeof body.version !== "number") return res.status(400).json({ message: "Missing version" });
    if (!Array.isArray(body.admin)) return res.status(400).json({ message: "admin must be array" });
    if (!Array.isArray(body.user)) body.user = []; // cho nhẹ

    writeMenu(body);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ message: "Write menu failed", error: String(e) });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Menu API running http://localhost:${PORT}`));
