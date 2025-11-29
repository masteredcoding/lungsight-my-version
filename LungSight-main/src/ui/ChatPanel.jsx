import { useState } from "react";
export default function ChatPanel({ context }) {
    const [messages, setMessages] = useState([]);
    const [q, setQ] = useState("");
    async function send() {
        if (!q.trim()) return;
        setMessages(m => [...m, { role: "user", content: q }]);
        setQ("");
        // TODO: call backend /chat with { question:q, context }
        setTimeout(() => {
            setMessages(m => [...m, { role: "assistant", content: "AI answer placeholder — backend not connected yet." }]);
        }, 400);
    }
    return (
        <div className="panel-card">
            <h3 style={{ marginTop: 0 }}>Ask AI about this study</h3>
            <div style={{ maxHeight: 180, overflowY: "auto", marginBottom: 8, border: "1px solid rgba(255,255,255,0.03)", padding: 8, borderRadius: 8 }}>
                {messages.length === 0 && <div style={{ color: "var(--muted)" }}>No messages yet. Ask something about the report.</div>}
                {messages.map((m, i) => (
                    <div key={i} style={{ marginBottom: 6 }}>
                        <strong>{m.role === "user" ? "You" : "AI"}:</strong> <span style={{ marginLeft: 8 }}>{m.content}</span>
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g., Why is pneumothorax flagged?" style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', background: 'transparent', color: 'inherit' }} />
                <button onClick={send} style={{ padding: '8px 12px', borderRadius: 8 }}>Send</button>
            </div>
        </div>
    );
}
