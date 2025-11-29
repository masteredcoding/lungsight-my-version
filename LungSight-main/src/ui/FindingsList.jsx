import { useState } from "react";

export default function FindingsList({ findings = [] }) {
    const [openIndex, setOpenIndex] = useState(-1);
    if (!findings.length) return null;
    return (
        <div className="panel-card">
            <h3 style={{ marginTop: 0 }}>Findings</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {findings.map((f, idx) => (
                    <li key={idx} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <button onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
                                    style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontWeight: 600 }}>
                                    {f.name}
                                </button>
                                <span style={{ color: "var(--muted)", fontSize: 12 }}>{(f.localization || []).length} loc</span>
                            </div>
                            <ConfidenceBadge value={f.confidence || 0} />
                        </div>

                        {openIndex === idx && (
                            <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                                <div><strong>Confidence:</strong> {(Math.round((f.confidence || 0) * 100))}%</div>
                                {(f.localization || []).length ? (
                                    <div style={{ marginTop: 6 }}>Localizations:
                                        <ul style={{ margin: 6, paddingLeft: 16 }}>
                                            {(f.localization || []).map((b, j) => (
                                                <li key={j}>x: {b.x}%, y: {b.y}%, w: {b.w}%, h: {b.h}%</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : <div style={{ marginTop: 6 }}>No bounding boxes available.</div>}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function ConfidenceBadge({ value = 0 }) {
    const pct = Math.round(value * 100);
    const bg = pct >= 75 ? "rgba(239,68,68,0.12)" : pct >= 50 ? "rgba(245,158,11,0.10)" : "rgba(34,197,94,0.08)";
    const color = pct >= 75 ? "#ef4444" : pct >= 50 ? "#f59e0b" : "#22c55e";
    return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <div style={{ minWidth: 56, height: 24, background: bg, color, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{pct}%</div>
        </div>
    );
}
