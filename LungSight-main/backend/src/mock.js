export async function mockClassify(studyId, modelId) {
  const seed = [...modelId].reduce((a,c)=>a+c.charCodeAt(0),0) % 100;
  const score = ((seed % 67) + 20) / 100; // 0.20–0.86
  return { model_id: modelId, score };
}
export async function mockVLM(studyId, prompt) {
  return {
    response: {
      model: "cxr-vlm-experimental",
      findings: "No acute cardiopulmonary process. Cardiomediastinal silhouette within normal limits. No pneumothorax."
    }
  };
}
