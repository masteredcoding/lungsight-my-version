// server.js

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5050;



app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

function firstExistingDir(candidates) {
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return candidates[0];
}
const STATIC_DIR = firstExistingDir([
  path.join(__dirname, "public"),
  path.join(process.cwd(), "public"),
  path.join(__dirname, "../public"),
]);
app.use("/static", cors(), express.static(STATIC_DIR));

const upload = multer({ storage: multer.memoryStorage() });

const knownFilesToStudy = {
  "07d82e7e5749cbc21633134f489a7fbf.dcm": "study_calc_01",
  "c341b3f8a0353bab2ec49147b97ce9d0.dcm": "study_calc_02",
  "17dc4a83558d835efd5f7d6f110f07f3.dcm": "study_calc_03",
  "de7c0acddd7ed5fb90f5f5e12458235b.dcm": "study_cons_01",
  "23f29ee2101fa421afeb84cf923ee9b6.dcm": "study_ild_01",
};
const STUDY_IDS = Object.values(knownFilesToStudy);

const BASE = {
  study_calc_01: {
    vlmFindings:
      "Suspected vascular/valvular calcifications along the aortic knob; no focal consolidation; cardiac silhouette within normal range.",
    models: [
      "mc_chestradiography_cardiomegaly:v1.20250828|0.18",
      "mc_chestradiography_calcification:v1.20250828|0.87",
      "mc_chestradiography_consolidation:v1.20250828|0.11",
      "mc_chestradiography_pleural_effusion:v1.20250828|0.09",
    ],
    meta: { modality: "CR", view: "PA" },
  },
  study_calc_02: {
    vlmFindings:
      "Patchy arterial calcifications projected over the mediastinum; no acute airspace disease identified.",
    models: [
      "mc_chestradiography_cardiomegaly:v1.20250828|0.22",
      "mc_chestradiography_calcification:v1.20250828|0.78",
      "mc_chestradiography_consolidation:v1.20250828|0.08",
      "mc_chestradiography_pneumothorax:v1.20250828|0.04",
    ],
    meta: { modality: "CR", view: "AP" },
  },
  study_calc_03: {
    vlmFindings:
      "Atherosclerotic calcifications are suggested; lungs are clear; no edema pattern.",
    models: [
      "mc_chestradiography_cardiomegaly:v1.20250828|0.25",
      "mc_chestradiography_calcification:v1.20250828|0.74",
      "mc_chestradiography_emphysema:v1.20250828|0.10",
      "mc_chestradiography_edema:v1.20250828|0.07",
    ],
    meta: { modality: "CR", view: "PA" },
  },
  study_cons_01: {
    vlmFindings:
      "Focal airspace consolidation in the right lower zone; consider infectious/inflammatory etiology. No large effusion.",
    models: [
      "mc_chestradiography_consolidation:v1.20250828|0.83",
      "mc_chestradiography_atelectasis:v1.20250828|0.31",
      "mc_chestradiography_pleural_effusion:v1.20250828|0.18",
      "mc_chestradiography_calcification:v1.20250828|0.05",
    ],
    meta: { modality: "CR", view: "PA" },
  },
  study_ild_01: {
    vlmFindings:
      "Basilar-predominant reticular opacities with subtle volume loss; pattern compatible with interstitial lung disease.",
    models: [
      "mc_chestradiography_interstitial_patterns:v1.20250828|0.81",
      "mc_chestradiography_fibrosis:v1.20250828|0.66",
      "mc_chestradiography_consolidation:v1.20250828|0.12",
      "mc_chestradiography_cardiomegaly:v1.20250828|0.20",
    ],
    meta: { modality: "CR", view: "PA" },
  },
};

function labelToSpecialist(label) {
  switch (label) {
    case "pneumothorax":                return "Emergency Medicine";
    case "pleural_effusion":            return "Pulmonologist";
    case "consolidation":               return "Pulmonologist";
    case "interstitial_patterns":
    case "fibrosis":
    case "emphysema":                   return "Pulmonologist";
    case "cardiomegaly":
    case "edema":
    case "calcification":               return "Cardiologist";
    default:                            return "Primary Care";
  }
}


function urgencyFor(label, score) {
  
  const s = Number(score || 0);

  
  if (label === "pneumothorax") {
    if (s >= 0.50) return "immediate";
    if (s >= 0.30) return "urgent";        
  }


  if (label === "pleural_effusion") {
    if (s >= 0.70) return "urgent";
    if (s >= 0.50) return "routine";       
  }
  if (label === "consolidation") {
    if (s >= 0.60) return "urgent";        
  }
  if (label === "interstitial_patterns" || label === "fibrosis") {
    if (s >= 0.75) return "urgent";
  }
  if (label === "emphysema") {
    if (s >= 0.80) return "urgent";
  }

 
  if (label === "edema") {
    if (s >= 0.60) return "urgent";
  }
  if (label === "cardiomegaly") {
    if (s >= 0.70) return "urgent";
  }
  if (label === "calcification") {
    if (s >= 0.85) return "urgent";        
  }

  
  return "routine";
}

function buildCareAdvice(models) {

  const positives = models
    .filter(m => Number(m.score || 0) >= Number(m.threshold ?? 0.5))
    .sort((a, b) => b.score - a.score);

  if (!positives.length) {
    return { urgency: "routine", referrals: [{ type: "Primary Care", reason: "No high-probability findings" }] };
  }

  const rank = { routine: 0, urgent: 1, immediate: 2 };
  let overall = "routine";

  const referrals = positives.map(m => {
    const u = urgencyFor(m.label, Number(m.score || 0));
    if (rank[u] > rank[overall]) overall = u;
    return {
      type: labelToSpecialist(m.label),
      reason: `${m.label.replace(/_/g, " ")} ${Math.round(Number(m.score || 0) * 100)}%`,
      urgency: u,
    };
  });


  const best = new Map();
  for (const r of referrals) {
    const prev = best.get(r.type);
    if (!prev || rank[r.urgency] > rank[prev.urgency]) best.set(r.type, r);
  }

  return { urgency: overall, referrals: Array.from(best.values()) };
}


function pickStudyIdFromUnknown(buf) {
  const h = crypto.createHash("md5").update(buf).digest("hex");
  const all = Object.keys(BASE);
  return all[parseInt(h.slice(0, 8), 16) % all.length];
}
function resolveStudyIdByNameOrHash(file) {
  const base = path.basename((file?.originalname || "").toLowerCase());
  return knownFilesToStudy[base] || pickStudyIdFromUnknown(file.buffer || Buffer.alloc(0));
}
function previewUrl(req, studyId) {
  return `${req.protocol}://${req.get("host")}/static/studies/${studyId}.png`;
}
function heatmapUrl(req, studyId, label) {

  const p = path.join(STATIC_DIR, "heatmaps", studyId, `${label}.png`);
  return fs.existsSync(p)
    ? `${req.protocol}://${req.get("host")}/static/heatmaps/${studyId}/${label}.png`
    : null;
}
function parseModelId(id) {
  
  const [left, version = "v1"] = id.split(":");
  let label = left;
  const marker = "_chestradiography_";
  if (left.includes(marker)) label = left.split(marker)[1];
  return { label, version };
}
function toHopprPayload(req, studyId, fileName) {
  const base = BASE[studyId];
  const uploadedAt = new Date().toISOString();

 
  const hopprModels = base.models.map((pair) => {
    const [id, scoreStr] = pair.split("|");
    const { label, version } = parseModelId(id);
    const score = Number(scoreStr || 0);
    const threshold = 0.5;
    const positive = score >= threshold;
    return {
      id,            
      label,              
      version,           
      score,              
      threshold,          
      positive,           // score >= threshold
      heatmap: {
        type: "png",
        url: heatmapUrl(req, studyId, label), 
      },
    };
  });

  
  const careAdvice = buildCareAdvice(
    hopprModels.map(m => ({
      label: m.label,
      score: m.score,
      threshold: m.threshold,
    }))
  );


  const payload = {

    studyId,
    meta: {
      fileName: fileName || null,
      uploadedAt,
      modality: base.meta.modality,
      view: base.meta.view,
      preview: {
        type: "png",
        url: previewUrl(req, studyId),
      },
    },
    models: hopprModels,
    vlm: {
      model: "cxr-vlm-experimental",
      version: "v0",
      findings: base.vlmFindings,
      grounding: [], // mock
    },


    careAdvice,


    findings: base.vlmFindings,
    results: hopprModels.map((m) => ({
      label: m.label,
      score: m.score,
      modelId: m.id,
      model: m.id,
      threshold: m.threshold,
      positive: m.positive,
      heatmapUrl: m.heatmap.url,
    })),
    imageUrl: previewUrl(req, studyId),
  };

  return payload;
}



app.get("/health", (_req, res) => {
  res.json({ ok: true, mode: "mock", staticDir: STATIC_DIR, studies: Object.keys(BASE).length });
});


app.post("/api/analyze-xray", upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded (field name must be 'file')." });
    const studyId = resolveStudyIdByNameOrHash(req.file);
    const payload = toHopprPayload(req, studyId, req.file.originalname);
    res.json({ studyId, id: studyId, fileName: req.file.originalname, imageUrl: payload.imageUrl });
  } catch (err) {
    console.error("analyze-xray error:", err);
    res.status(500).json({ error: "Internal error in mock analyze-xray." });
  }
});


app.get("/api/run-all", (req, res) => {
  try {
    const studyId = (req.query.studyId || req.query.id || "").toString();
    if (!studyId) return res.status(400).json({ error: "Missing 'studyId' query parameter." });
    if (!BASE[studyId]) return res.status(404).json({ error: `Unknown studyId '${studyId}'.` });
    const payload = toHopprPayload(req, studyId, null);
    res.json(payload);
  } catch (err) {
    console.error("run-all error:", err);
    res.status(500).json({ error: "Internal error in mock run-all." });
  }
});


app.get("/debug/study", (req, res) => {
  const studyId = (req.query.studyId || "").toString();
  const prev = path.join(STATIC_DIR, "studies", `${studyId}.png`);
  res.json({
    studyId,
    previewExists: fs.existsSync(prev),
    previewUrl: `${req.protocol}://${req.get("host")}/static/studies/${studyId}.png`,
  });
});

app.listen(PORT, () => {
  console.log(`Mock backend listening on http://localhost:${PORT}`);
  console.log(`[static] ${STATIC_DIR}`);
});
