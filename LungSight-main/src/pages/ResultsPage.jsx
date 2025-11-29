// src/pages/ResultsPage.jsx
import { useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { runAll } from "../lib/api";

// Optional UI components (if you have them)
let HeatmapOverlay, FindingsList, ReportActions;
try { HeatmapOverlay = (await import("../ui/HeatmapOverlay")).default; } catch {}
try { FindingsList = (await import("../ui/FindingsList")).default; } catch {}
try { ReportActions = (await import("../ui/ReportActions")).default; } catch {}

export default function ResultsPage() {
  const { state } = useLocation(); // { imageUrl, fileName, id }
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState(null);

  // prevent double fetch in React 18 StrictMode
  const fetchedRef = useRef(false);

  const studyId = state?.id ?? state?.studyId ?? null;

  // Map HOPPR-style payload -> UI report
  const toReport = (payload) => {
    if (!payload) return null;

    // Prefer HOPPR fields
    const hopprModels = Array.isArray(payload.models) ? payload.models : [];
    const vlmFindings =
      payload?.vlm?.findings ??
      payload?.findings ??
      "";

    // --- Build findings array (prefer HOPPR models, else results[]) ---
    const base = hopprModels.length
      ? hopprModels.map((m) => {
          const score = Number(m.score ?? 0);
          const threshold = Number(m.threshold ?? 0.5);
          const heatmapUrl = m.heatmap?.url ?? null;

          return {
            name: m.label ?? prettyLabelFromModelId(m.id),
            score,
            positive: typeof m.positive === "boolean" ? m.positive : score >= threshold,
            modelId: m.id ?? m.model ?? "unknown-model",
            threshold,
            heatmapUrl,

            // aliases used by FindingsList
            confidence: score,
            percent: Math.round(score * 100),
            locs: heatmapUrl ? 1 : 0,
          };
        })
      : (payload?.results || []).map((r) => {
          const score = Number(r.score ?? r.confidence ?? 0);
          const threshold = Number(r.threshold ?? 0.5);
          const heatmapUrl = r.heatmapUrl ?? null;
          return {
            name: r.label ?? r.name ?? "Unknown",
            score,
            positive: typeof r.positive === "boolean" ? r.positive : score >= threshold,
            modelId: r.modelId ?? r.model ?? "unknown-model",
            threshold,
            heatmapUrl,

            confidence: score,
            percent: Math.round(score * 100),
            locs: heatmapUrl ? 1 : 0,
          };
        });

    const positives = base.filter((x) => x.positive);
    const triage = positives.length ? "Review promptly" : "Routine";
    const overallImpression = positives.length
      ? `Possible findings: ${positives
          .map((p) => `${p.name} (${(p.score || 0).toFixed(2)})`)
          .join(", ")}.`
      : "No significant findings detected.";

    // Prefer backend preview URL; else use state.imageUrl
    const imageUrl =
      payload?.meta?.preview?.url ??
      payload?.imageUrl ??
      state?.imageUrl ??
      null;

    // NEW: care advice from backend (if present)
    const careAdvice = payload?.careAdvice || null;

    return {
      studyId: payload.studyId ?? studyId ?? null,
      fileName: payload?.meta?.fileName ?? state?.fileName ?? null,
      imageUrl,
      triage,
      overallImpression,
      findingsText: vlmFindings,
      findings: base,
      careAdvice, // <-- added
    };
  };

  function prettyLabelFromModelId(id = "") {
    const marker = "_chestradiography_";
    const mid = id.includes(marker) ? id.split(marker)[1] : id;
    return (mid.split(":")[0] || id).replace(/_/g, " ");
  }

  useEffect(() => {
    if (!studyId || fetchedRef.current) return;
    fetchedRef.current = true;

    (async () => {
      try {
        setLoading(true);
        setErrMsg(null);
        const raw = await runAll(studyId);
        setReport(toReport(raw));
      } catch (e) {
        setErrMsg("Backend unavailable — using fallback mock.");
        setReport({
          studyId,
          fileName: state?.fileName ?? null,
          imageUrl: state?.imageUrl ?? null,
          triage: "Review promptly",
          overallImpression: "Possible findings: Pleural Effusion (0.72).",
          findingsText:
            "Right blunting of the costophrenic angle suggests small effusion.",
          findings: [
            { name: "Pleural Effusion", score: 0.72, positive: true, modelId: "clf-2" },
            { name: "Pneumonia",        score: 0.18, positive: false, modelId: "clf-1" },
          ],
          careAdvice: null,
        });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]);

  // --- Render ---

  if (!studyId) {
    return (
      <div className="content-wrapper" style={{ padding: 24 }}>
        <h2>No study to show</h2>
        <p>Go back and upload an image.</p>
      </div>
    );
  }

  return (
    <div className="results-grid content-wrapper" style={{ paddingTop: 12 }}>
      {/* Top bar / debug */}
      <div className="panel-card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div><strong>Study ID:</strong> <code>{studyId}</code></div>
          {loading && <span style={{ color: "#666" }}>Fetching…</span>}
          {errMsg && <span style={{ color: "#b91c1c" }}>{errMsg}</span>}
        </div>
      </div>

      {/* Left panel: image + (optional) overlay */}
      <div className="panel-card left-panel">
        <div style={{ marginBottom: 8, color: "#666" }}>
          {report?.fileName ? `File: ${report.fileName}` : state?.fileName ? `File: ${state.fileName}` : "No file name"}
        </div>

        {HeatmapOverlay ? (
          <HeatmapOverlay imageUrl={report?.imageUrl} findings={report?.findings || []} />
        ) : (
          <div style={{ borderRadius: 8, overflow: "hidden", background: "#111" }}>
            {report?.imageUrl ? (
              <img
                src={report.imageUrl}
                alt="Chest X-ray"
                style={{ width: "100%", maxHeight: 520, objectFit: "contain", display: "block" }}
              />
            ) : (
              <div style={{ padding: 24, color: "#888" }}>No image available</div>
            )}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="right-panel">
        <div className="panel-card impression-card">
          <h2 style={{ marginTop: 0 }}>Impression</h2>
          {!report ? (
            <p>Waiting for results…</p>
          ) : (
            <>
              <p><strong>Triage:</strong> {report.triage}</p>
              <p>{report.overallImpression}</p>
              {report.findingsText && <p>{report.findingsText}</p>}
            </>
          )}
        </div>

        {/* NEW: Next steps card (care advice) */}
        {report?.careAdvice && (
          <div className="panel-card">
            <h3 style={{ marginTop: 0 }}>Next steps</h3>
            <p style={{ margin: "6px 0 10px" }}>
              <strong>Urgency:</strong>{" "}
              <span style={{
                padding: "2px 8px",
                borderRadius: 999,
                border: "1px solid #444",
                textTransform: "capitalize"
              }}>
                {report.careAdvice.urgency}
              </span>
            </p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {report.careAdvice.referrals.map((r, i) => (
                <li key={i}><strong>{r.type}</strong> — {r.reason}</li>
              ))}
            </ul>
            <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>

            </div>
          </div>
        )}

        {FindingsList ? (
          <FindingsList findings={report?.findings || []} />
        ) : (
          <div className="panel-card">
            <h3 style={{ marginTop: 0 }}>Findings</h3>
            {!report?.findings?.length ? (
              <div style={{ color: "#666" }}>None.</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {report.findings.map((f, i) => (
                  <li key={i}>
                    {f.name} — {(f.score ?? 0).toFixed(2)} {f.positive ? "✅" : "❌"}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="panel-card actions-card">
          {ReportActions ? (
            <ReportActions report={report || {}} data={{ id: studyId, imageUrl: report?.imageUrl, fileName: report?.fileName }} />
          ) : (
            <div style={{ color: "#666" }}>Actions go here</div>
          )}
        </div>
      </div>
    </div>
  );
}
