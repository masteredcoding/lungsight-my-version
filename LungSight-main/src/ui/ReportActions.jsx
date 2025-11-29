// src/ui/ReportActions.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { buildAndSavePdf } from "../lib/pdf";

export default function ReportActions({ report, data }) {
  const navigate = useNavigate();

  async function onDownloadPDF() {
    await buildAndSavePdf({
      report,
      studyId: data?.id || report?.studyId,
      fileName: data?.fileName || report?.fileName,
      imageUrl: data?.imageUrl || report?.imageUrl,
    });
  }

  function onCompare() {
    navigate("/compare", {
      state: {
        left: {
          studyId: data?.id ?? report?.studyId ?? null,
          fileName: data?.fileName ?? report?.fileName ?? null,
          imageUrl: data?.imageUrl ?? report?.imageUrl ?? null,
        },
      },
    });
  }

  function onNewImage() {
    // Go back to Upload page and clear the current history entry
    navigate("/", { replace: true });
    // Optional: scroll to top (nice UX)
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button className="btn btn-primary" onClick={onDownloadPDF}>
        Download PDF
      </button>

      <button className="btn btn-secondary" onClick={onCompare}>
        Compare…
      </button>

      {/* New: start over with a fresh upload */}
      <button className="btn btn-secondary" onClick={onNewImage}>
        New Image
      </button>
    </div>
  );
}
