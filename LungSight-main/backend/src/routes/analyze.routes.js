import express from "express";
import multer from "multer";
import fs from "fs";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => { if (!fs.existsSync("uploads")) fs.mkdirSync("uploads"); cb(null, "uploads"); },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// matches frontend: form.append('xray', file)
router.post("/", upload.single("xray"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded (field name must be 'xray')" });
  // TODO: replace with real HOPPR study creation/upload; for now return a known studyId
  res.json({ studyId: "4d79221a-a352-44f4-8140-72d88c2e91cf", file: req.file.filename });
});

export default router;
