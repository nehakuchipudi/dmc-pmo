"use client";

import { FileText, Paperclip, Upload } from "lucide-react";
import { deliverableFromProjectFile, invoiceFileKind } from "@/lib/invoice";
import { uid } from "@/lib/seed";
import type { InvoiceDeliverable, ProjectFile } from "@/lib/types";

const MAX_UPLOAD_BYTES = 1_200_000;

function formatSize(sizeKb: number) {
  return sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
}

async function readUpload(file: File): Promise<InvoiceDeliverable> {
  const kind = invoiceFileKind(file.name, file.type);
  const sizeKb = Math.max(1, Math.round(file.size / 1024));
  let dataUrl: string | undefined;
  if (file.size <= MAX_UPLOAD_BYTES) {
    dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
  return {
    id: uid("idoc"),
    name: file.name,
    kind,
    sizeKb,
    folder: "Deliverables",
    source: "upload",
    dataUrl,
  };
}

export function InvoiceDeliverablePicker({
  projectName,
  files,
  docs,
  onChange,
  attachToInvoice,
  onAttachToInvoiceChange,
  onUploadToProject,
}: {
  projectName?: string;
  files: ProjectFile[];
  docs: InvoiceDeliverable[];
  onChange: (docs: InvoiceDeliverable[]) => void;
  attachToInvoice: boolean;
  onAttachToInvoiceChange: (value: boolean) => void;
  onUploadToProject?: (file: Omit<ProjectFile, "id">) => void;
}) {
  const selectedIds = new Set(docs.map((doc) => doc.fileId ?? doc.id));
  const extraDocs = docs.filter((doc) => doc.source === "upload" || !files.some((file) => file.id === doc.fileId));

  function toggleFile(file: ProjectFile) {
    if (selectedIds.has(file.id)) {
      onChange(docs.filter((doc) => doc.fileId !== file.id && doc.id !== file.id));
      return;
    }
    onChange([...docs, deliverableFromProjectFile(file)]);
  }

  async function addFiles(list: FileList | null) {
    const uploads = Array.from(list ?? []);
    if (!uploads.length) return;
    const next = [...docs];
    for (const file of uploads) {
      const doc = await readUpload(file);
      next.push(doc);
      onUploadToProject?.({
        folder: "Deliverables",
        name: doc.name,
        kind: doc.kind,
        sizeKb: doc.sizeKb,
        linkedTaskIds: [],
      });
    }
    onChange(next);
  }

  return (
    <section className="invoice-block">
      <header className="invoice-block-head">
        <h3>Attach delivery documents</h3>
      </header>
      <p className="invoice-empty-note">
        Payment is issued against proof of deliverable. Attach files uploaded on
        {projectName ? ` ${projectName}` : " this project"} so the invoice PDF includes them.
      </p>
      <label className="invoice-filter-check invoice-deliverable-attach">
        <input
          type="checkbox"
          checked={attachToInvoice}
          onChange={(event) => onAttachToInvoiceChange(event.target.checked)}
        />
        Attach deliverable docs to invoice
      </label>
      {files.length ? (
        <div className="invoice-milestone-list">
          {files.map((file) => (
            <label key={file.id}>
              <input type="checkbox" checked={selectedIds.has(file.id)} onChange={() => toggleFile(file)} />
              <span>
                <strong>{file.name}</strong>
                <em>
                  {file.folder} · {file.kind.toUpperCase()} · {formatSize(file.sizeKb)}
                </em>
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className="invoice-empty-note">
          {projectName
            ? "No project documents yet. Upload a deliverable below."
            : "Select a project to pick uploaded documents, or upload a deliverable now."}
        </p>
      )}
      {extraDocs.length ? (
        <ul className="invoice-deliverable-selected">
          {extraDocs.map((doc) => (
            <li key={doc.id}>
              <FileText size={14} />
              <span>
                {doc.name}
                <em>{formatSize(doc.sizeKb)}</em>
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => onChange(docs.filter((row) => row.id !== doc.id))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <label className="invoice-deliverable-upload">
        <Upload size={15} />
        Upload deliverable
        <input
          type="file"
          multiple
          className="sr-only"
          onChange={(event) => {
            void addFiles(event.target.files);
            event.currentTarget.value = "";
          }}
        />
      </label>
      {docs.length ? (
        <p className="invoice-empty-note">
          <Paperclip size={14} /> {docs.length} deliverable{docs.length === 1 ? "" : "s"} selected
          {attachToInvoice ? " and will be attached to the invoice PDF." : ". Turn on attach to include them on the invoice."}
        </p>
      ) : null}
    </section>
  );
}
