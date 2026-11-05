"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Field, Modal, PageHeader, TextInput, TextSelect } from "@/components/ui";
import { DOCUMENT_KINDS, type DocumentKind } from "@/lib/service-ops";
import { useAppStore } from "@/lib/store";

export default function ServiceDocumentsPage() {
  const companies = useAppStore((s) => s.companies);
  const serviceDocuments = useAppStore((s) => s.serviceDocuments);
  const addServiceDocument = useAppStore((s) => s.addServiceDocument);
  const deleteServiceDocument = useAppStore((s) => s.deleteServiceDocument);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [kind, setKind] = useState<DocumentKind>("PDF");

  function exportList() {
    const body = ["Name,Customer,Type,Added", ...serviceDocuments.map((row) => `${row.name},${row.companyName},${row.kind},${row.added}`)].join("\n");
    const blob = new Blob([body], { type: "text/csv" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "service-documents.csv";
    link.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Documents"
        subtitle="Keep field packets, photos, and closeout files with the customer."
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={exportList} disabled={!serviceDocuments.length}>
              Export
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              <Plus size={16} /> Upload
            </button>
          </>
        }
      />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Added</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {serviceDocuments.map((row) => (
              <tr key={row.id}>
                <td className="font-medium">{row.name}</td>
                <td>{row.companyName}</td>
                <td>{row.kind}</td>
                <td>{row.added}</td>
                <td className="text-right">
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => deleteServiceDocument(row.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!serviceDocuments.length ? (
              <tr>
                <td colSpan={5} className="empty-row">
                  No documents yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <Modal open={open} title="Add document" onClose={() => setOpen(false)}>
        <Field label="Name" required>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Site photo or packet name" />
        </Field>
        <Field label="Customer">
          <TextSelect value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">No company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Type">
          <TextSelect value={kind} onChange={(e) => setKind(e.target.value as DocumentKind)}>
            {DOCUMENT_KINDS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </TextSelect>
        </Field>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (!name.trim()) return;
            addServiceDocument({ name, companyId, kind });
            setName("");
            setOpen(false);
          }}
        >
          Save document
        </button>
      </Modal>
    </div>
  );
}
