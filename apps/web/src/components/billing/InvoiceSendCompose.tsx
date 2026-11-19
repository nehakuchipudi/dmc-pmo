"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Paperclip, X } from "lucide-react";
import { Field, TextInput, TextSelect, TextTextarea } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { invoiceAttachedDeliverables, invoicePdfName, invoiceSendDraft } from "@/lib/invoice";
import { mailAttachmentsForInvoice } from "@/lib/pdf";
import { parseMailAddresses } from "@/lib/deliver-mail";
import { useAppStore } from "@/lib/store";
import type { Invoice } from "@/lib/types";

export function InvoiceSendCompose({
  invoice,
  open,
  onClose,
  onSent,
}: {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
  onSent?: (id: string) => void;
}) {
  const { user } = useAuth();
  const companies = useAppStore((s) => s.companies);
  const contacts = useAppStore((s) => s.contacts);
  const projects = useAppStore((s) => s.projects);
  const emailDomains = useAppStore((s) => s.emailDomains);
  const queueEmail = useAppStore((s) => s.queueEmail);
  const sendInvoice = useAppStore((s) => s.sendInvoice);
  const pushToast = useAppStore((s) => s.pushToast);
  const [contactId, setContactId] = useState("");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [subjectDirty, setSubjectDirty] = useState(false);
  const [bodyDirty, setBodyDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  const record = invoice;
  const company = companies.find((row) => row.id === record?.companyId);
  const project = projects.find((row) => row.id === record?.projectId);
  const companyContacts = useMemo(
    () => contacts.filter((row) => row.companyId === record?.companyId && row.email),
    [contacts, record?.companyId],
  );
  const sender = emailDomains.find((row) => row.primary);
  const generated = useMemo(() => {
    if (!record) return { subject: "", body: "" };
    const contact = companyContacts.find((row) => row.id === contactId);
    return invoiceSendDraft({
      invoice: record,
      project,
      company,
      contact,
      sender: { name: user?.name || record.owner || "Dillon Morgan Consulting" },
    });
  }, [record, project, company, companyContacts, contactId, user?.name]);
  const docs = record ? invoiceAttachedDeliverables(record) : [];
  const pdfName = record ? invoicePdfName(record) : "invoice.pdf";

  useEffect(() => {
    if (!open || !record) return;
    const preferred =
      companyContacts.find((row) => row.id === record.billToContactId) ??
      companyContacts.find((row) => row.email) ??
      companyContacts[0];
    setContactId(preferred?.id ?? "");
    setTo(preferred?.email || company?.email || "");
    setCc("");
    setSubjectDirty(false);
    setBodyDirty(false);
    setSubject(generated.subject);
    setBody(generated.body);
    setBusy(false);
  }, [open, record?.id]);

  useEffect(() => {
    if (!open) return;
    if (!subjectDirty) setSubject(generated.subject);
    if (!bodyDirty) setBody(generated.body);
  }, [generated, open, subjectDirty, bodyDirty]);

  function applyContact(id: string) {
    setContactId(id);
    const contact = companyContacts.find((row) => row.id === id);
    if (contact?.email) setTo(contact.email);
  }

  async function send() {
    if (!record || busy) return;
    const recipients = parseMailAddresses(to);
    if (!recipients.length) {
      pushToast("Add an email address for where to send this invoice.", "danger");
      return;
    }
    setBusy(true);
    try {
      const attachments = await mailAttachmentsForInvoice(record, company?.address);
      queueEmail(recipients.join(", "), subject.trim() || generated.subject, body.trim() || generated.body, undefined, {
        cc: cc.trim() || undefined,
        attachments,
      });
      sendInvoice(record.id, { skipMail: true, to: recipients.join(", ") });
      onSent?.(record.id);
      onClose();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not attach the invoice PDF.", "danger");
    } finally {
      setBusy(false);
    }
  }

  if (!open || !record || typeof document === "undefined") return null;

  return createPortal(
    <div className="invoice-send-backdrop" onClick={onClose}>
      <div
        className="invoice-send-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Send ${record.number}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="invoice-send-head">
          <h2>Send {record.number}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <form
          className="invoice-send-compose"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <p className="invoice-empty-note">
            Choose whom to send this invoice to and where it should arrive. The draft updates from the project, and the
            PDF{docs.length ? " plus deliverable proof" : ""} is attached.
          </p>
          <Field label="From">
            <TextInput
              value={sender ? `${sender.fromName} <${sender.fromEmail}>` : "Your Outlook mailbox"}
              readOnly
            />
          </Field>
          <div className="invoice-send-grid">
            <Field label="Whom to send">
              <TextSelect value={contactId} onChange={(event) => applyContact(event.target.value)}>
                <option value="">{company?.name ?? "Company"}</option>
                {companyContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                    {contact.title ? ` (${contact.title})` : ""}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field label="Where to send">
              <TextInput
                type="email"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                placeholder="client@example.com"
                required
              />
            </Field>
          </div>
          <Field label="CC">
            <TextInput
              value={cc}
              onChange={(event) => setCc(event.target.value)}
              placeholder="Optional copy, comma separated"
            />
          </Field>
          <Field label="Subject">
            <TextInput
              value={subject}
              onChange={(event) => {
                setSubjectDirty(true);
                setSubject(event.target.value);
              }}
              required
            />
          </Field>
          <Field label="Email draft">
            <TextTextarea
              rows={12}
              value={body}
              onChange={(event) => {
                setBodyDirty(true);
                setBody(event.target.value);
              }}
              required
            />
          </Field>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setSubjectDirty(false);
              setBodyDirty(false);
              setSubject(generated.subject);
              setBody(generated.body);
            }}
          >
            Refresh from project
          </button>
          <div className="invoice-send-files">
            <strong>
              <Paperclip size={14} /> Attachments
            </strong>
            <ul>
              <li>
                <FileText size={14} /> {pdfName}
              </li>
              {docs.map((doc) => (
                <li key={doc.id}>
                  <FileText size={14} /> {doc.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="invoice-send-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
              Back
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Attaching PDF..." : "Send invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
