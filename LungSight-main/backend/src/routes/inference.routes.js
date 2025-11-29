import express from "express";
import { CLASSIFIER_MODELS, VLM_MODEL } from "../models.js";
import { hopprClassify, hopprVLM } from "../hoppr.js";
import { mockClassify, mockVLM } from "../mock.js";

const router = express.Router();
const USE_MOCK = String(process.env.USE_MOCK).toLowerCase() === "true";

const cache = new Map(); // key -> {score, ts}
const TTL_MS = 5 * 60 * 1000;

async function classifyOnce(studyId, modelId) {
  const key = `${studyId}:${modelId}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.ts < TTL_MS) return { model_id: modelId, score: hit.score };

  const data = USE_MOCK ? await mockClassify(studyId, modelId)
                        : await hopprClassify(studyId, modelId);
  cache.set(key, { score: data.score, ts: now });
  return data;
}

router.get("/models", (_, res) => {
  res.json({ classifiers: CLASSIFIER_MODELS, vlm: VLM_MODEL });
});

router.post("/classify", async (req, res) => {
  try {
    const { studyId, models, threshold } = req.body || {};
    if (!studyId) return res.status(400).json({ error: "studyId required" });
    const th = threshold ?? Number(process.env.THRESHOLD ?? 0.5);
    const selected = (models?.length ? models : CLASSIFIER_MODELS.map(m => m.id));

    const results = await Promise.all(selected.map(async id => {
      const { model_id, score } = await classifyOnce(studyId, id);
      const label = CLASSIFIER_MODELS.find(m => m.id === id)?.label ?? id;
      return { modelId: model_id, label, score, positive: score >= th };
    }));

    results.sort((a,b)=>b.score-a.score);
    res.json({
      studyId,
      threshold: th,
      count: results.length,
      results,
      disclaimer: "Research prototype. Not for clinical use."
    });
  } catch (err) {
    res.status(502).json({ error: "classification failed", details: err?.response?.data ?? err.message });
  }
});

router.post("/vlm", async (req, res) => {
  try {
    const { studyId, prompt = "Provide a description of the findings in the radiology image." } = req.body || {};
    if (!studyId) return res.status(400).json({ error: "studyId required" });
    const data = USE_MOCK ? await mockVLM(studyId, prompt) : await hopprVLM(studyId, prompt);
    res.json({ studyId, findings: data?.response?.findings ?? "", disclaimer: "Research prototype. Not for clinical use." });
  } catch (err) {
    res.status(502).json({ error: "vlm failed", details: err?.response?.data ?? err.message });
  }
});

router.post("/run-all", async (req, res) => {
  try {
    const { studyId, models, threshold, prompt } = req.body || {};
    if (!studyId) return res.status(400).json({ error: "studyId required" });

    const [cls, vlm] = await Promise.all([
      // call our own handlers’ logic:
      (async () => {
        const fakeReq = { body: { studyId, models, threshold } };
        const fakeRes = { json: (x)=>x };
        return await new Promise((ok, fail)=>{
          // reuse function directly (simplest is re-run logic)
          const th = threshold ?? Number(process.env.THRESHOLD ?? 0.5);
          const selected = (models?.length ? models : CLASSIFIER_MODELS.map(m => m.id));
          Promise.all(selected.map(async id => {
            const { model_id, score } = await classifyOnce(studyId, id);
            const label = CLASSIFIER_MODELS.find(m => m.id === id)?.label ?? id;
            return { modelId: model_id, label, score, positive: score >= th };
          }))
          .then(results => {
            results.sort((a,b)=>b.score-a.score);
            ok({ studyId, threshold: th, count: results.length, results });
          }).catch(fail);
        });
      })(),
      (USE_MOCK ? mockVLM(studyId, prompt) : hopprVLM(studyId, prompt))
    ]);

    res.json({
      ...cls,
      findings: vlm?.response?.findings ?? "",
      disclaimer: "Research prototype. Not for clinical use."
    });
  } catch (err) {
    res.status(500).json({ error: "run-all failed", details: err?.response?.data ?? err.message });
  }
});

router.post("/run-all", async (req, res) => {
  try {
    const { studyId, models, threshold, prompt } = req.body || {};
    if (!studyId) return res.status(400).json({ error: "studyId required" });

    // Reuse same logic as /classify and /vlm to avoid hitting Hoppr twice for the same model
    const th = threshold ?? Number(process.env.THRESHOLD ?? 0.5);
    const MODEL_LIST = models?.length ? models : [
      "mc_chestradiography_pneumothorax:v1.20250828",
      "mc_chestradiography_pleural_effusion:v1.20250828",
      "mc_chestradiography_cardiomegaly:v1.20250828"
    ];

    // classify
    const classifyCalls = MODEL_LIST.map(model =>
      hoppr.post(`/studies/${studyId}/inference`, {
        model,
        prompt: "prompt is ignored for classification",
        organization: "hoppr",
        response_format: "json"
      }).then(r => {
        const { model_id, score } = r.data;
        return { modelId: model_id, score, positive: score >= th };
      })
    );

    const results = await Promise.all(classifyCalls);
    results.sort((a,b)=>b.score-a.score);

    // vlm
    const { data: vlmData } = await hoppr.post(`/studies/${studyId}/inference`, {
      model: "cxr-vlm-experimental",
      prompt: prompt || "Provide a description of the findings in the radiology image.",
      response_format: "json"
    });

    res.json({
      studyId,
      threshold: th,
      count: results.length,
      results,
      findings: vlmData?.response?.findings ?? "",
      disclaimer: "Research prototype. Not for clinical use."
    });

  } catch (err) {
    res.status(500).json({ error: "run-all failed", details: err?.response?.data ?? err.message });
  }
});


export default router;
