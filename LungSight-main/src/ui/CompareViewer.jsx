// src/ui/CompareViewer.jsx
import React from "react";

export default function CompareViewer({ left, right }) {
  return (
    <div className="results-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {/* Left */}
      <div className="panel-card">
        <Header block="Left" item={left} />
        <ImageBlock item={left} />
        <FindingsBlock item={left} />
        <NextSteps item={left} />
      </div>

      {/* Right */}
      <div className="panel-card">
        <Header block="Right" item={right} />
        <ImageBlock item={right} />
        <FindingsBlock item={right} />
        <NextSteps item={right} />
      </div>
    </div>
  );
}

function Header({ block, item }) {
  return (
    <div style={{ marginBottom: 8, color: "#666", display: "flex", gap: 8, alignItems: "baseline", justifyContent: "space-between" }}>
      <div>
        <strong>{block}</strong>{" "}
        <code style={{ opacity: .8 }}>{item?.studyId ?? "(no study)"}</code>
      </div>
      <div>{item?.fileName || ""}</div>
    </div>
  );
}

function ImageBlock({ item }) {
  return (
    <div style={{ borderRadius: 8, overflow: "hidden", background: "#111", marginBottom: 12 }}>
      {item?.imageUrl ? (
        <img
          src={item.imageUrl}
          alt="X-ray"
          style={{ width: "100%", display: "block", objectFit: "contain", maxHeight: 520 }}
        />
      ) : (
        <div style={{ padding: 24, color: "#888" }}>No image</div>
      )}
    </div>
  );
}

function FindingsBlock({ item }) {
  const rows = toRows(item);
  return (
    <div className="panel-card">
      <h3 style={{ marginTop: 0 }}>Findings</h3>
      {!rows.length ? (
        <div style={{ color: "#666" }}>None.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#888" }}>
              <th style={{ padding: "6px 4px" }}>Finding</th>
              <th style={{ padding: "6px 4px" }}>Score</th>
              <th style={{ padding: "6px 4px" }}>Flag</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <td style={{ padding: "8px 4px" }}>{r.name}</td>
                <td style={{ padding: "8px 4px" }}>{(r.score * 100).toFixed(0)}%</td>
                <td style={{ padding: "8px 4px" }}>{r.positive ? "⚠️" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {item?.findingsText && (
        <p style={{ marginTop: 12, color: "#bbb" }}>{item.findingsText}</p>
      )}
    </div>
  );
}

function NextSteps({ item }) {
  if (!item?.careAdvice) return null;
  return (
    <div className="panel-card" style={{ marginTop: 12 }}>
      <h3 style={{ marginTop: 0 }}>Next steps</h3>
      <p style={{ margin: "6px 0 10px" }}>
        <strong>Urgency:</strong>{" "}
        <span style={{
          padding: "2px 8px",
          borderRadius: 999,
          border: "1px solid #444",
          textTransform: "capitalize"
        }}>
          {item.careAdvice.urgency}
        </span>
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {item.careAdvice.referrals.map((r, i) => (
          <li key={i}><strong>{r.type}</strong> — {r.reason}</li>
        ))}
      </ul>
    </div>
  );
}

function toRows(item) {
  if (!item) return [];
  // Prefer HOPPR models
  if (Array.isArray(item.models) && item.models.length) {
    return item.models.map((m) => ({
      name: m.label || prettyLabelFromModelId(m.id),
      score: Number(m.score || 0),
      positive: typeof m.positive === "boolean" ? m.positive : Number(m.score || 0) >= Number(m.threshold ?? 0.5),
    }));
  }
  // Fallback to normalized results
  if (Array.isArray(item.results) && item.results.length) {
    return item.results.map((r) => ({
      name: r.label || r.name || "Unknown",
      score: Number(r.score ?? r.confidence ?? 0),
      positive: typeof r.positive === "boolean" ? r.positive : Number(r.score ?? 0) >= Number(r.threshold ?? 0.5),
    }));
  }
  return [];
}

function prettyLabelFromModelId(id = "") {
  const marker = "_chestradiography_";
  const mid = id.includes(marker) ? id.split(marker)[1] : id;
  return (mid.split(":")[0] || id).replace(/_/g, " ");
}
