"use client";

import { Download, Eye, FileText, Paperclip } from "lucide-react";
import type { MailAttachment } from "@/lib/deliver-mail";
import { downloadMailAttachment, viewMailAttachment } from "@/lib/deliver-mail";

export function MailAttachmentCopies({
  files,
  loading,
}: {
  files: MailAttachment[];
  loading?: boolean;
}) {
  return (
    <div className="invoice-send-files">
      <strong>
        <Paperclip size={14} /> Attachments
      </strong>
      {loading ? (
        <p className="invoice-empty-note">Preparing attachment copies...</p>
      ) : (
        <ul>
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`}>
              <button
                type="button"
                className="invoice-send-file-name"
                onClick={() => viewMailAttachment(file)}
              >
                <FileText size={14} />
                {file.name}
              </button>
              <span className="invoice-send-file-actions">
                <button type="button" className="btn btn-ghost" onClick={() => viewMailAttachment(file)}>
                  <Eye size={14} /> View
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => downloadMailAttachment(file)}>
                  <Download size={14} /> Download
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
