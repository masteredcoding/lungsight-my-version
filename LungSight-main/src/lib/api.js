// src/lib/api.js

// GET mock results for a study
export async function runAll(studyId) {
  if (!studyId) throw new Error("runAll: missing studyId");
  const res = await fetch(`/api/run-all?studyId=${encodeURIComponent(studyId)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `runAll failed: ${res.status}`);
  return json;
}

// POST upload → get { studyId, imageUrl, fileName }
export async function analyzeXray(arg) {
  // Accept either analyzeXray(file) or analyzeXray({file, imageUrl, fileName})
  const file = arg && arg instanceof File ? arg : arg?.file;
  const imageUrl = arg?.imageUrl;
  const fileName = arg?.fileName;

  const fd = new FormData();
  if (file) fd.append("file", file); // FIELD NAME MUST BE "file"
  if (imageUrl) fd.append("imageUrl", imageUrl);
  if (fileName) fd.append("fileName", fileName);

  // Do NOT add a fake fallback here — backend expects a file in mock mode.
  if (!file) throw new Error("Please select a DICOM/image file before analyzing.");

  const res = await fetch("/api/analyze-xray", { method: "POST", body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `Analyze failed: ${res.status}`);
  return json; // { studyId, id, fileName, imageUrl }
}
