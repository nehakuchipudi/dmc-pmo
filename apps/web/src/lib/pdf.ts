import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FIRM_LETTERHEAD, invoiceBillToLines, invoiceHeading, invoicePdfName } from "./invoice";
import { formatDisplayDate, formatLongMonthDay, formatShortDate, moneyExact } from "./seed";
import type { Invoice, Milestone, Project, Task } from "./types";

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

export function exportProjectPlanPdf(
  project: Project,
  milestones: Milestone[],
  tasks: Task[],
) {
  const doc = new jsPDF();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Project Plan", 14, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(project.name, 14, 30);
  doc.text(`${project.companyName}  |  Manager: ${project.manager}`, 14, 38);
  doc.text(
    `Window: ${formatDisplayDate(project.start)} to ${formatDisplayDate(project.due)}  |  Progress: ${project.progress}%`,
    14,
    46,
  );

  autoTable(doc, {
    startY: 56,
    head: [["Milestone", "Start", "Due", "Status"]],
    body: milestones.map((m) => [
      m.name,
      formatDisplayDate(m.start),
      formatDisplayDate(m.due),
      m.status,
    ]),
  });

  const afterMilestones =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 56;

  autoTable(doc, {
    startY: afterMilestones + 10,
    head: [["Task", "Assignee", "Start", "Due", "Status", "Est. hrs"]],
    body: tasks.map((t) => [
      t.name,
      t.assignee,
      formatDisplayDate(t.start),
      formatDisplayDate(t.due),
      t.status,
      String(t.estimateHours),
    ]),
  });

  doc.save(`${project.name.replace(/\s+/g, "-").toLowerCase()}-plan.pdf`);
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
