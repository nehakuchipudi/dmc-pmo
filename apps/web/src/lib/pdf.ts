import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FIRM_LETTERHEAD, invoiceBillToLines, invoiceHeading, invoicePdfName } from "./invoice";
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

export function exportInvoicePdf(invoice: Invoice, companyAddress?: string) {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  drawDmcMark(doc, 14, 14, 28);

  doc.setTextColor(40, 48, 56);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(FIRM_LETTERHEAD.name, pageWidth - 14, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  FIRM_LETTERHEAD.lines.forEach((line, index) => {
    doc.text(line, pageWidth - 14, 23 + index * 4.2, { align: "right" });
  });

  const billTo = invoiceBillToLines(invoice, companyAddress);
  doc.setFontSize(10);
  billTo.forEach((line, index) => {
    doc.text(line, 14, 52 + index * 5);
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("INVOICE", pageWidth - 14, 52, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`INVOICE DATE: ${invoice.raised ? formatShortDate(invoice.raised) : "Not set"}`, pageWidth - 14, 58, {
    align: "right",
  });
  doc.text(`INVOICE NO: ${invoice.number}`, pageWidth - 14, 63, { align: "right" });
  doc.text(
    `BILLING THROUGH: ${invoice.billingThrough ? formatLongMonthDay(invoice.billingThrough) : "Not set"}`,
    pageWidth - 14,
    68,
    { align: "right" },
  );

  const headingY = 78;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const heading = invoiceHeading(invoice);
  doc.text(heading, 14, headingY);
  const manager = invoice.manager || invoice.owner;
  if (manager) {
    doc.setFont("helvetica", "normal");
    doc.text(`Managed by: ${manager}`, pageWidth - 14, headingY, { align: "right" });
  }

  const pdfLines = invoice.lineItems.filter((line) => line.includeInPdf !== false);
  autoTable(doc, {
    startY: headingY + 8,
    head: [["Activity", "AMOUNT"]],
    body: pdfLines.map((line) => [line.description, moneyExact(line.amount)]),
    foot: [
      ["SUBTOTAL", moneyExact(invoice.amount)],
      ["AMOUNT DUE THIS INVOICE", moneyExact(invoice.amount)],
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2.4, textColor: [40, 48, 56] },
    headStyles: { textColor: [43, 123, 185], fontStyle: "bold", fillColor: [255, 255, 255] },
    footStyles: { fontStyle: "bold", fillColor: [255, 255, 255] },
    columnStyles: { 1: { halign: "right", cellWidth: 40 } },
  });

  const afterItems = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? headingY + 20;
  const payments = invoice.payments ?? [];
  autoTable(doc, {
    startY: afterItems + 10,
    head: [["Date", "Description", "Amount"]],
    body: payments.length
      ? payments.map((payment) => [formatShortDate(payment.date), payment.description, moneyExact(payment.amount)])
      : [["", "No payments recorded.", ""]],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2.4, textColor: [40, 48, 56] },
    headStyles: { fontStyle: "bold", fillColor: [255, 255, 255] },
    columnStyles: { 2: { halign: "right", cellWidth: 40 } },
  });

  const afterPay = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? afterItems + 24;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`This invoice is due on ${formatShortDate(invoice.due)}`, pageWidth - 14, afterPay + 8, { align: "right" });

  doc.save(invoicePdfName(invoice));
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
