import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FIRM_LETTERHEAD, invoiceDocumentModel, invoicePdfName } from "./invoice";
import { formatHours } from "./plan-allocation";
import { addDays, ganttDayLabel, ganttDependencyLinks, ganttMonthBands, type PlanRow } from "./project-plan";
import { formatDisplayDate, formatLongMonthDay, formatShortDate, moneyExact } from "./seed";
import type { Invoice } from "./types";

export type PlanPdfProject = {
  name: string;
  companyName?: string;
  manager?: string;
  start: string;
  due: string;
  progress?: number;
};

function planPdfSlug(name: string) {
  return name.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "") || "project";
}

function planIndent(depth: number) {
  return `${"".padStart(Math.max(0, depth) * 2, " ") }`;
}

function drawDmcMark(doc: jsPDF, x: number, y: number, size: number) {
  doc.setFillColor(125, 154, 168);
  doc.rect(x, y, size, size, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size * 0.32);
  doc.text(FIRM_LETTERHEAD.mark, x + size / 2, y + size * 0.62, { align: "center" });
}

function lastTableY(doc: jsPDF, fallback: number) {
  return (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? fallback;
}

const PX = 25.4 / 96;
const INK: [number, number, number] = [36, 52, 71];
const MUTED: [number, number, number] = [58, 70, 82];
const BLUE: [number, number, number] = [43, 123, 185];
const BAR: [number, number, number] = [238, 241, 244];
const RULE: [number, number, number] = [213, 222, 232];
const EMPTY: [number, number, number] = [107, 124, 143];

function mm(px: number) {
  return px * PX;
}

function drawSectionBar(doc: jsPDF, y: number, title: string, pageWidth: number, marginX: number) {
  const height = mm(34);
  doc.setFillColor(...BAR);
  doc.rect(marginX, y, pageWidth - marginX * 2, height, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.8);
  doc.setTextColor(...MUTED);
  doc.text(title, marginX + mm(10), y + height * 0.68);
  return y + height;
}

function drawPreviewTable(
  doc: jsPDF,
  startY: number,
  head: string[],
  body: string[][],
  pageWidth: number,
  marginX: number,
  amountCol = 1,
) {
  autoTable(doc, {
    startY,
    head: [head],
    body: body.length ? body : [head.map(() => "")],
    theme: "plain",
    styles: {
      fontSize: 10.3,
      cellPadding: { top: mm(8), bottom: mm(8), left: mm(10), right: mm(10) },
      textColor: INK,
      lineColor: RULE,
      lineWidth: 0,
    },
    headStyles: { textColor: BLUE, fontStyle: "bold", fontSize: 9.4, fillColor: [255, 255, 255] },
    columnStyles: {
      [amountCol]: { halign: "right", cellWidth: mm(140) },
    },
    margin: { left: marginX, right: marginX },
    didDrawCell: (data) => {
      if (data.section !== "head" && data.section !== "body") return;
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.2);
      const y = data.cell.y + data.cell.height;
      doc.line(marginX, y, pageWidth - marginX, y);
    },
  });
  return lastTableY(doc, startY + 12);
}

export function buildInvoicePdf(invoice: Invoice, companyAddress?: string) {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const model = invoiceDocumentModel(invoice, companyAddress);
  const marginX = mm(32);
  let y = mm(28);
  const markSize = mm(92);
  drawDmcMark(doc, marginX, y, markSize);

  let firmY = y + mm(14);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.6);
  doc.text(FIRM_LETTERHEAD.name, pageWidth - marginX, firmY, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.8);
  doc.setTextColor(...MUTED);
  FIRM_LETTERHEAD.lines.forEach((line) => {
    firmY += mm(19);
    doc.text(line, pageWidth - marginX, firmY, { align: "right" });
  });

  y = Math.max(y + markSize, firmY) + mm(28);
  const metaTop = y;
  doc.setTextColor(...MUTED);
  doc.setFontSize(10.3);
  model.billTo.forEach((line, index) => {
    doc.text(line, marginX, metaTop + index * mm(20));
  });

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.4);
  doc.text("INVOICE", pageWidth - marginX, metaTop, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.8);
  doc.text(`INVOICE DATE: ${model.raised ? formatShortDate(model.raised) : "Not set"}`, pageWidth - marginX, metaTop + mm(20), {
    align: "right",
  });
  doc.text(`INVOICE NO: ${model.number}`, pageWidth - marginX, metaTop + mm(40), { align: "right" });
  doc.text(
    `BILLING THROUGH: ${model.billingThrough ? formatLongMonthDay(model.billingThrough) : "Not set"}`,
    pageWidth - marginX,
    metaTop + mm(60),
    { align: "right" },
  );

  y = Math.max(metaTop + mm(80), metaTop + model.billTo.length * mm(20) + mm(18));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.6);
  doc.setTextColor(...INK);
  doc.text(model.heading, marginX, y);
  if (model.manager) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(`Managed by: ${model.manager}`, pageWidth - marginX, y, { align: "right" });
  }

  y = drawSectionBar(doc, y + mm(22), "Invoice Items", pageWidth, marginX);
  y = drawPreviewTable(
    doc,
    y,
    ["Activity", "AMOUNT"],
    model.lines.map((line) => [line.description, moneyExact(line.amount)]),
    pageWidth,
    marginX,
  );

  y += mm(12);
  const amountX = pageWidth - marginX;
  const labelX = amountX - mm(120) - mm(24);
  const writeTotal = (label: string, value: string, due = false) => {
    doc.setFont("helvetica", due ? "bold" : "normal");
    doc.setFontSize(10.3);
    doc.setTextColor(...(due ? BLUE : INK));
    doc.text(label, labelX, y, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(value, amountX, y, { align: "right" });
    y += mm(22);
  };
  writeTotal("SUBTOTAL", moneyExact(model.totals.subtotal));
  if (model.totals.tax > 0) writeTotal("TAX", moneyExact(model.totals.tax));
  writeTotal("AMOUNT DUE THIS INVOICE", moneyExact(model.amountDue), true);

  y = drawSectionBar(doc, y + mm(8), "Payments", pageWidth, marginX);
  if (model.payments.length) {
    y = drawPreviewTable(
      doc,
      y,
      ["Date", "Description", "Amount"],
      model.payments.map((payment) => [formatShortDate(payment.date), payment.description, moneyExact(payment.amount)]),
      pageWidth,
      marginX,
      2,
    );
    y += mm(16);
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.2);
    doc.setTextColor(...EMPTY);
    doc.text("No payments recorded.", marginX + mm(10), y + mm(22));
    y += mm(38);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.8);
  doc.setTextColor(...MUTED);
  doc.text(`This invoice is due on ${formatShortDate(model.due)}`, pageWidth - marginX, y + mm(16), { align: "right" });
  return doc;
}

function invoicePaperElement() {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>("[data-invoice-paper]");
}

async function exportInvoicePaperPdf(paper: HTMLElement, filename: string) {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(paper, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    onclone: (clonedDoc) => {
      const el = clonedDoc.querySelector<HTMLElement>("[data-invoice-paper]");
      if (!el) return;
      el.style.boxShadow = "none";
      el.style.border = "none";
      el.style.borderRadius = "0";
      el.style.background = "#fff";
      el.style.color = "#243447";
    },
  });
  if (canvas.width < 40 || canvas.height < 40) {
    throw new Error("Invoice preview capture was empty");
  }
  const img = canvas.toDataURL("image/png");
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const imgH = (canvas.height / canvas.width) * pageW;
  let offset = 0;
  let page = 0;
  while (offset < imgH - 0.4) {
    if (page > 0) doc.addPage();
    doc.addImage(img, "PNG", 0, -offset, pageW, imgH, undefined, "FAST");
    offset += pageH;
    page += 1;
  }
  doc.save(filename);
}

export function exportInvoicePdf(invoice: Invoice, companyAddress?: string) {
  const paper = invoicePaperElement();
  if (paper) {
    void exportInvoicePaperPdf(paper, invoicePdfName(invoice)).catch(() => {
      buildInvoicePdf(invoice, companyAddress).save(invoicePdfName(invoice));
    });
    return;
  }
  buildInvoicePdf(invoice, companyAddress).save(invoicePdfName(invoice));
}

export function buildProjectPlanPdf(project: PlanPdfProject, rows: PlanRow[]) {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  drawDmcMark(doc, 14, 12, 18);
  doc.setTextColor(40, 48, 56);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Project plan", 36, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(project.name, 36, 24);
  doc.setFontSize(8);
  doc.text(
    [
      project.companyName,
      project.manager ? `Manager: ${project.manager}` : "",
      `Planned start ${formatShortDate(project.start)}`,
      `Deadline ${formatShortDate(project.due)}`,
    ]
      .filter(Boolean)
      .join("  |  "),
    36,
    29,
  );
  doc.setFontSize(8);
  doc.text(FIRM_LETTERHEAD.name, pageWidth - 14, 18, { align: "right" });

  autoTable(doc, {
    startY: 36,
    head: [["Milestones and tasks", "Dur.", "Start", "Due", "Budget", "Time"]],
    body: rows.map((row) => [
      `${planIndent(row.depth)}${row.name}`,
      `${row.duration}d`,
      formatShortDate(row.start),
      formatShortDate(row.due),
      moneyExact(row.budget),
      formatHours(row.estimateHours),
    ]),
    theme: "plain",
    styles: { fontSize: 8, cellPadding: 1.6, textColor: [40, 48, 56] },
    headStyles: { fillColor: [238, 243, 248], textColor: [36, 52, 71], fontStyle: "bold" },
    columnStyles: {
      1: { cellWidth: 16, halign: "right" },
      2: { cellWidth: 24 },
      3: { cellWidth: 24 },
      4: { cellWidth: 28, halign: "right" },
      5: { cellWidth: 20, halign: "right" },
    },
  });
  return doc;
}

export function exportProjectPlanPdf(project: PlanPdfProject, rows: PlanRow[]) {
  buildProjectPlanPdf(project, rows).save(`${planPdfSlug(project.name)}-plan.pdf`);
}

export function buildProjectGanttPdf(
  project: PlanPdfProject,
  rows: PlanRow[],
  scale: "Days" | "Weeks" = "Days",
) {
  const doc = new jsPDF({ unit: "mm", format: "letter", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  drawDmcMark(doc, 12, 10, 16);
  doc.setTextColor(40, 48, 56);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Gantt chart", 32, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(project.name, 32, 21);
  doc.setFontSize(8);
  doc.text(
    `Planned start ${formatShortDate(project.start)}  |  Deadline ${formatShortDate(project.due)}  |  ${scale}`,
    32,
    26,
  );
  doc.text(FIRM_LETTERHEAD.name, pageWidth - 12, 16, { align: "right" });

  const starts = rows.map((row) => row.start).sort();
  const dues = rows.map((row) => row.due).sort();
  const boundStart = addDays(starts[0] ?? project.start, -1);
  const boundEnd = addDays(dues.slice(-1)[0] ?? project.due, 2);
  const span = Math.max(Date.parse(`${boundEnd}T12:00:00`) - Date.parse(`${boundStart}T12:00:00`), 1);
  const dayCount = Math.max(Math.ceil(span / 86400000) + 1, 7);
  const tickStep = scale === "Days" ? 1 : 7;
  const ticks = Array.from({ length: Math.ceil(dayCount / tickStep) }, (_, i) => addDays(boundStart, i * tickStep));
  const labelW = 58;
  const left = 12;
  const top = 32;
  const chartW = pageWidth - left - 12 - labelW;
  const rowH = Math.min(6.2, Math.max(4.2, (pageHeight - top - 12) / Math.max(rows.length, 1)));
  const toX = (iso: string) =>
    left + labelW + ((Date.parse(`${iso}T12:00:00`) - Date.parse(`${boundStart}T12:00:00`)) / span) * chartW;
  const months = ganttMonthBands(ticks);

  doc.setFillColor(251, 252, 254);
  doc.rect(left + labelW, top, chartW, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  let monthX = left + labelW;
  months.forEach((band) => {
    const width = (band.count / ticks.length) * chartW;
    doc.setDrawColor(230, 236, 242);
    doc.rect(monthX, top, width, 5);
    doc.setTextColor(36, 52, 71);
    doc.text(band.label, monthX + 1.5, top + 3.6);
    monthX += width;
  });
  ticks.forEach((tick, index) => {
    const x = left + labelW + (index / ticks.length) * chartW;
    doc.setDrawColor(236, 241, 246);
    doc.line(x, top + 5, x, top + 10 + rows.length * rowH);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(110, 124, 138);
    doc.text(scale === "Days" ? String(Number(tick.slice(8))) : ganttDayLabel(tick), x + 0.4, top + 8.6);
  });

  rows.forEach((row, index) => {
    const y = top + 10 + index * rowH;
    if (row.kind === "project" || row.kind === "milestone") {
      doc.setFillColor(row.kind === "project" ? 238 : 247, 243, 248);
      doc.rect(left, y, pageWidth - 24, rowH, "F");
    }
    doc.setTextColor(36, 52, 71);
    doc.setFont("helvetica", row.kind === "task" || row.kind === "subtask" ? "normal" : "bold");
    doc.setFontSize(7);
    doc.text(`${planIndent(row.depth)}${row.name}`.slice(0, 42), left, y + rowH * 0.68);
    const x1 = toX(row.start);
    const x2 = Math.max(toX(row.due), x1 + 2);
    const barY = y + 1.4;
    const barH = rowH - 2.8;
    if (row.kind === "task" || row.kind === "subtask") {
      doc.setFillColor(142, 202, 232);
    } else {
      doc.setFillColor(47, 68, 88);
    }
    doc.roundedRect(x1, barY, x2 - x1, barH, row.kind === "task" || row.kind === "subtask" ? 1.2 : 0.3, row.kind === "task" || row.kind === "subtask" ? 1.2 : 0.3, "F");
  });

  const links = ganttDependencyLinks(rows);
  doc.setDrawColor(74, 163, 208);
  doc.setLineWidth(0.35);
  links.forEach((link) => {
    const from = rows.findIndex((row) => row.id === link.fromId);
    const to = rows.findIndex((row) => row.id === link.toId);
    if (from < 0 || to < 0) return;
    const x1 = toX(link.fromDue);
    const x2 = toX(link.toStart);
    const y1 = top + 10 + from * rowH + rowH / 2;
    const y2 = top + 10 + to * rowH + rowH / 2;
    const elbow = Math.max(x1 + 3, x1 + 2);
    doc.line(x1, y1, elbow, y1);
    doc.line(elbow, y1, elbow, y2);
    doc.line(elbow, y2, x2, y2);
    doc.line(x2, y2, x2 - 1.4, y2 - 1);
    doc.line(x2, y2, x2 - 1.4, y2 + 1);
  });

  return doc;
}

export function exportProjectGanttPdf(
  project: PlanPdfProject,
  rows: PlanRow[],
  scale: "Days" | "Weeks" = "Days",
) {
  buildProjectGanttPdf(project, rows, scale).save(`${planPdfSlug(project.name)}-gantt.pdf`);
}

export function exportCsv(filename: string, rows: Record<string, string | number>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
