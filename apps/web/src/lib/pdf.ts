import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDisplayDate, money } from "./seed";
import type { Invoice, Milestone, Project, Task } from "./types";

export function exportInvoicePdf(invoice: Invoice) {
  const doc = new jsPDF();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Dillon Morgan Consulting", 14, 20);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.title || `Invoice ${invoice.number}`, 14, 30);
  doc.text(`Invoice ${invoice.number}`, 14, 38);
  doc.text(`Bill to: ${invoice.billToName || invoice.companyName}`, 14, 46);
  doc.text(`Terms: ${invoice.terms}  |  Currency: ${invoice.currency || "USD"}`, 14, 54);
  doc.text(
    `Raised: ${invoice.raised ? formatDisplayDate(invoice.raised) : "n/a"}  |  Due: ${formatDisplayDate(invoice.due)}`,
    14,
    62,
  );
  if (invoice.poNumber) doc.text(`PO: ${invoice.poNumber}`, 14, 70);
  if (invoice.description) doc.text(invoice.description, 14, invoice.poNumber ? 78 : 70);

  const lines = invoice.lineItems.filter((l) => l.includeInPdf !== false);
  autoTable(doc, {
    startY: invoice.description || invoice.poNumber ? 86 : 78,
    head: [["Type", "Description", "Qty/Hrs", "Amount"]],
    body: lines.map((l) => [l.kind, l.description, String(l.hours ?? l.quantity ?? ""), money(l.amount)]),
    foot: [["", "Total", "", money(invoice.amount)]],
  });

  doc.save(`${invoice.number}.pdf`);
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
