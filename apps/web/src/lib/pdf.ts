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
  doc.text(`Invoice ${invoice.number}`, 14, 30);
  doc.text(`Bill to: ${invoice.companyName}`, 14, 38);
  doc.text(`Terms: ${invoice.terms}`, 14, 46);
  doc.text(`Due: ${formatDisplayDate(invoice.due)}`, 14, 54);
  doc.text(`Status: ${invoice.status}`, 14, 62);

  autoTable(doc, {
    startY: 72,
    head: [["Description", "Amount"]],
    body: invoice.lineItems.map((l) => [l.description, money(l.amount)]),
    foot: [["Total", money(invoice.amount)]],
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
