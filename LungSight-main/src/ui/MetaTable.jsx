// src/ui/MetaTable.jsx
export default function MetaTable({ meta }) {
  if (!meta || typeof meta !== "object") {
    return <div className="text-sm text-gray-500">No metadata.</div>;
  }

  const rows = Object.entries(meta);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b last:border-0">
              <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">{labelize(k)}</td>
              <td className="py-2">{String(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function labelize(s) {
  return (s || "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());
}
