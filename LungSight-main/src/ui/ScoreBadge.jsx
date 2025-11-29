// src/ui/ScoreBadge.jsx
export default function ScoreBadge({ score }) {
  const pct = typeof score === "number" ? Math.round(score * 100) : null;
  const tone =
    typeof score !== "number"
      ? "bg-gray-200 text-gray-700"
      : score >= 0.8
      ? "bg-green-600 text-white"
      : score >= 0.5
      ? "bg-yellow-500 text-black"
      : "bg-gray-300 text-gray-800";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${tone}`}>
      {pct !== null ? `${pct}%` : "—"}
    </span>
  );
}
