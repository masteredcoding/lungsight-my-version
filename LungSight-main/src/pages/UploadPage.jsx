// src/pages/UploadPage.tsx  (JS version, no TypeScript types)
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeXray } from "../lib/api";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function isDicom(f) {
    const name = f.name.toLowerCase();
    return name.endsWith(".dcm") || name.endsWith(".dicom") || f.type === "application/dicom";
  }

  function onFileChange(e) {
    const f = e.target.files?.[0] ?? null;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    setError(null);
    setFile(f);

    if (f && !isDicom(f)) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    }
  }

  async function onAnalyze() {
    if (!file) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await analyzeXray(file); // POST to /api/analyze-xray
      const imageUrl = result.imageUrl ?? previewUrl ?? null;

      // ✅ Navigate after we have the studyId
      navigate(`/results/${result.studyId}`, {
        state: {
          imageUrl,
          fileName: result.fileName ?? file.name,
          id: result.studyId, // ResultsPage reads this
        },
      });
    } catch (err) {
      setError((err && err.message) || "Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="hero">
        <h1>LUNGSIGHT</h1>
        <p>
          Quickly analyze chest X-rays with an explainable, clinician-oriented assistant.
          Upload a de-identified scan to get model-identified findings, confidence scores, and
          localization heatmaps you can review and export.
        </p>
        
      </section>

      <section className="panel">
        <h2>Upload Chest X-Ray</h2>
        <div className="sub">PNG / JPG / DICOM (de-identified)</div>

        <div className="row" style={{ gap: 12, alignItems: "center" }}>
          <label className="file-label" htmlFor="file" style={{ cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke="#cfcaf3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" stroke="#cfcaf3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>{" "}
            Choose file
          </label>

          <input
            id="file"
            ref={inputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.dcm,.dicom,image/png,image/jpeg,application/dicom"
            onChange={onFileChange}
            style={{ display: "none" }}
          />

          <button
            className="btn btn-primary"
            onClick={onAnalyze}
            disabled={!file || submitting}
          >
            {submitting ? "Analyzing…" : "Analyze"}
          </button>
        </div>

        <div className="file-name" style={{ marginTop: 10 }}>
          {file ? <>Selected: <strong>{file.name}</strong></> : "No file chosen"}
        </div>

        {previewUrl && (
          <div style={{ marginTop: 12 }}>
            <img
              src={previewUrl}
              alt="preview"
              style={{ width: 260, height: 180, objectFit: "cover", borderRadius: 8 }}
            />
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 8,
              border: "1px solid rgba(220,38,38,.25)",
              background: "rgba(220,38,38,.08)",
              color: "#b91c1c",
            }}
          >
            {error}
          </div>
        )}

        <div className="features" style={{ marginTop: 16 }}>
          <div className="feature">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke="#9f7aea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>{" "}
            Model predictions with confidence scores
          </div>
          <div className="feature">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke="#9f7aea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>{" "}
            Heatmaps highlighting regions of interest
          </div>
          <div className="feature">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke="#9f7aea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>{" "}
            Structured report you can export or copy to notes
          </div>
        </div>
      </section>
    </>
  );
}
