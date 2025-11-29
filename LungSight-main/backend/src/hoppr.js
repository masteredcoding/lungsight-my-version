import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const hoppr = axios.create({
  baseURL: process.env.HOPPR_BASE,
  headers: {
    Authorization: `Bearer ${process.env.HOPPR_API_KEY}`,
    "Content-Type": "application/json"
  },
  timeout: 20000
});

export async function hopprClassify(studyId, modelId) {
  const { data } = await hoppr.post(`/studies/${studyId}/inference`, {
    model: modelId,
    prompt: "prompt is ignored for classification",
    organization: "hoppr",
    response_format: "json"
  });
  return data; // { model_id, score }
}

export async function hopprVLM(studyId, prompt) {
  const { data } = await hoppr.post(`/studies/${studyId}/inference`, {
    model: "cxr-vlm-experimental",
    prompt,
    response_format: "json"
  });
  return data; // { response: { findings } }
}
