// src/lib/pdf.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // function import


export async function fetchImageAsDataURL(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("[PDF] fetchImageAsDataURL failed:", e);
    return null;
  }
}

export async function buildAndSavePdf({ report, studyId, fileName, imageUrl }) {
  try {
    const doc = new jsPDF({ unit: "pt", format: "a4" }); 

    const leftX = 40;
    let y = 40;

    // header
    doc.setFont("helvetica", "bold"); doc.setFontSize(18);
    doc.text("X-Ray Report", leftX, y); y += 18;

    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const genAt = new Date().toLocaleString();
    doc.text(`Generated: ${genAt}`, leftX, y); y += 14;
    doc.text(`Study ID: ${studyId || report?.studyId || "-"}`, leftX, y); y += 14;
    doc.text(`File: ${fileName || report?.fileName || "-"}`, leftX, y); y += 20;

    doc.setDrawColor(200);
    doc.line(leftX, y, 555, y); y += 14;

    // columns
    const colGap = 20;
    const colW = (555 - leftX - colGap - leftX) / 2;
    const imgX = leftX;
    const textX = leftX + colW + colGap;

    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text("Image", imgX, y);
    doc.text("Impression", textX, y);
    y += 10;


    const imgTop = y;
    const imgH = 220;
    const dataUrl = await fetchImageAsDataURL(imageUrl);
    if (dataUrl) {
      try {
        try { doc.addImage(dataUrl, "PNG", imgX, imgTop, colW, imgH, undefined, "FAST"); }
        catch { doc.addImage(dataUrl, "JPEG", imgX, imgTop, colW, imgH, undefined, "FAST"); }
      } catch (e) {
        console.warn("[PDF] addImage failed:", e);
        doc.setFont("helvetica", "italic"); doc.setFontSize(10);
        doc.text("(image unavailable)", imgX, imgTop + 12);
      }
    } else {
      doc.setFont("helvetica", "italic"); doc.setFontSize(10);
      doc.text("(no image)", imgX, imgTop + 12);
    }


    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    const impression = [
      `Triage: ${report?.triage || "-"}`,
      report?.overallImpression || "",
      report?.findingsText || "",
    ].filter(Boolean).join("\n\n");
    const lines = doc.splitTextToSize(impression || "No impression.", colW);
    doc.text(lines, textX, y);

    y = Math.max(imgTop + imgH + 16, y + lines.length * 12 + 10);


    const rows = (report?.findings || []).map((f) => ([
      f.name || "—",
      `${Math.round((f.percent ?? f.score * 100) || 0)}%`,
      f.positive ? "Positive" : "—",
      f.threshold != null ? `${Math.round(f.threshold * 100)}%` : "—",
      (typeof f.locs === "number" ? f.locs : (f.heatmapUrl ? 1 : 0)).toString(),
    ]));

    autoTable(doc, {
      startY: y,
      head: [["Finding", "Score", "Flag", "Threshold", "Loc"]],
      body: rows.length ? rows : [["—", "—", "—", "—", "—"]],
      styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [60, 60, 60] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: leftX, right: leftX },
      tableWidth: 515,
    });


    const nextY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 18 : y + 18;
    if (report?.careAdvice) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text("Next steps", leftX, nextY);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      const careLines = [
        `Urgency: ${report.careAdvice.urgency}`,
        ...(report.careAdvice.referrals || []).map(r => `• ${r.type} — ${r.reason}`),
      ];
      doc.text(doc.splitTextToSize(careLines.join("\n"), 515), leftX, nextY + 16);
    }

    
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(9); doc.setTextColor(130);
    doc.text("© LungSight — Not for clinical use", leftX, pageH - 24);

    const outName =
      (fileName?.replace(/\.[^.]+$/, "") ||
        report?.studyId ||
        studyId ||
        "report") + ".pdf";

    doc.save(outName);
  } catch (e) {
    console.error("[PDF] buildAndSavePdf fatal error:", e);
    alert("Failed to generate PDF. See console for details.");
  }
}


export async function buildAndSavePdfCompare({ left, right }) {
  try {
    const doc = new jsPDF({ unit: "pt", format: "a4" }); // 595x842
    const leftX = 40;
    let y = 40;

    doc.setFont("helvetica", "bold"); doc.setFontSize(18);
    doc.text("X-Ray Comparison Report", leftX, y); y += 18;

    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, leftX, y); y += 20;

    doc.setDrawColor(200); doc.line(leftX, y, 555, y); y += 14;

   
    const colGap = 20;
    const colW = (555 - leftX - colGap - leftX) / 2; // ~220
    const Lx = leftX;
    const Rx = leftX + colW + colGap;


    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text("Left study", Lx, y);
    doc.text("Right study", Rx, y);
    y += 12;

 
    const imgH = 180;
    const lImg = await fetchImageAsDataURL(left?.imageUrl);
    const rImg = await fetchImageAsDataURL(right?.imageUrl);
    const imgTop = y;

    if (lImg) {
      try { doc.addImage(lImg, "PNG", Lx, imgTop, colW, imgH, undefined, "FAST"); }
      catch { try { doc.addImage(lImg, "JPEG", Lx, imgTop, colW, imgH, undefined, "FAST"); } catch {} }
    } else {
      doc.setFont("helvetica", "italic"); doc.setFontSize(10);
      doc.text("(no image)", Lx, imgTop + 12);
    }

    if (rImg) {
      try { doc.addImage(rImg, "PNG", Rx, imgTop, colW, imgH, undefined, "FAST"); }
      catch { try { doc.addImage(rImg, "JPEG", Rx, imgTop, colW, imgH, undefined, "FAST"); } catch {} }
    } else {
      doc.setFont("helvetica", "italic"); doc.setFontSize(10);
      doc.text("(no image)", Rx, imgTop + 12);
    }

    y = imgTop + imgH + 14;

    // File + Study IDs
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(`Study: ${left?.studyId ?? "-"}`, Lx, y);
    doc.text(`File: ${left?.fileName ?? "-"}`, Lx, y + 12);

    doc.text(`Study: ${right?.studyId ?? "-"}`, Rx, y);
    doc.text(`File: ${right?.fileName ?? "-"}`, Rx, y + 12);
    y += 28;

 
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text("Impressions", leftX, y); y += 10;

    const leftImp = [
      left?.findingsText ? `Left: ${left.findingsText}` : "",
    ].filter(Boolean).join("\n");
    const rightImp = [
      right?.findingsText ? `Right: ${right.findingsText}` : "",
    ].filter(Boolean).join("\n");

    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    const imp = [leftImp, rightImp].filter(Boolean).join("\n\n");
    const lines = doc.splitTextToSize(imp || "No impressions.", 515);
    doc.text(lines, leftX, y);
    y += lines.length * 12 + 12;

    // Left findings table
    const lRows = toRows(left).map(r => [
      r.name, `${Math.round(r.score * 100)}%`, r.positive ? "Positive" : "—"
    ]);
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text("Left Findings", leftX, y); y += 8;
    autoTable(doc, {
      startY: y,
      head: [["Finding", "Score", "Flag"]],
      body: lRows.length ? lRows : [["—", "—", "—"]],
      styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [60, 60, 60] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: leftX, right: leftX },
      tableWidth: 515,
    });
    y = doc.lastAutoTable.finalY + 14;

    // Right findings table
    const rRows = toRows(right).map(r => [
      r.name, `${Math.round(r.score * 100)}%`, r.positive ? "Positive" : "—"
    ]);
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text("Right Findings", leftX, y); y += 8;
    autoTable(doc, {
      startY: y,
      head: [["Finding", "Score", "Flag"]],
      body: rRows.length ? rRows : [["—", "—", "—"]],
      styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [60, 60, 60] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: leftX, right: leftX },
      tableWidth: 515,
    });

    
    let y0 = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 18 : y + 18;
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text("Next steps", leftX, y0); y0 += 14;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const leftLines = left?.careAdvice
      ? [`Left — Urgency: ${left.careAdvice.urgency}`, ...(left.careAdvice.referrals || []).map(r => `• ${r.type} — ${r.reason}`)]
      : ["Left — none"];
    const rightLines = right?.careAdvice
      ? [`Right — Urgency: ${right.careAdvice.urgency}`, ...(right.careAdvice.referrals || []).map(r => `• ${r.type} — ${r.reason}`)]
      : ["Right — none"];
    const combined = [...leftLines, "", ...rightLines];
    doc.text(doc.splitTextToSize(combined.join("\n"), 515), leftX, y0);

    // Footer
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(9); doc.setTextColor(130);
    doc.text("© Hackathon X-Ray — Not for clinical use", leftX, pageH - 24);

    const outName = `compare_${(left?.studyId || "left")}_${(right?.studyId || "right")}.pdf`;
    doc.save(outName);
  } catch (e) {
    console.error("[PDF] buildAndSavePdfCompare fatal error:", e);
    alert("Failed to generate comparison PDF. See console for details.");
  }
}

function toRows(item) {
  if (!item) return [];
  if (Array.isArray(item.models) && item.models.length) {
    return item.models.map(m => ({
      name: m.label || prettyLabelFromModelId(m.id),
      score: Number(m.score || 0),
      positive: typeof m.positive === "boolean" ? m.positive : Number(m.score || 0) >= Number(m.threshold ?? 0.5),
    }));
  }
  if (Array.isArray(item.results) && item.results.length) {
    return item.results.map(r => ({
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
