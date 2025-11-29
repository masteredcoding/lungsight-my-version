
import { useState } from "react";

export default function HeatmapOverlay({ imageUrl, findings = [] }) {
    const [natural, setNatural] = useState({ width: 1, height: 1 });
    const aspect = natural.width / natural.height;
    // Limit max height and width to prevent scroll/crop
    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                maxWidth: 480,
                maxHeight: 480,
                margin: "0 auto",
                overflow: "hidden",
                aspectRatio: aspect > 0 ? aspect : undefined,
                background: "#181a20",
                borderRadius: 12,
                boxShadow: "0 2px 12px rgba(0,0,0,0.18)"
            }}
        >
            <img
                src={imageUrl}
                alt="Chest X-Ray"
                style={{
                    width: "100%",
                    height: "100%",
                    maxWidth: 480,
                    maxHeight: 480,
                    objectFit: "contain",
                    display: "block",
                    background: "#222"
                }}
                onLoad={e => {
                    setNatural({ width: e.target.naturalWidth, height: e.target.naturalHeight });
                }}
            />
            {findings.map((f, i) => (f.localization || []).map((b, j) => (
                <div
                    key={`${i}-${j}`}
                    title={`${f.name} (${Math.round((f.confidence || 0) * 100)}%)`}
                    style={{
                        position: "absolute",
                        left: `${b.x}%`,
                        top: `${b.y}%`,
                        width: `${b.w}%`,
                        height: `${b.h}%`,
                        border: "2px solid rgba(255,0,0,0.85)",
                        boxShadow: "0 0 8px rgba(255,0,0,0.6) inset",
                        borderRadius: 6,
                        pointerEvents: "none"
                    }}
                />
            )))}
        </div>
    );
}
