"use client";

import { FileText, Paperclip } from "lucide-react";
import type { MailAttachment } from "@/lib/deliver-mail";
import { downloadMailAttachment } from "@/lib/deliver-mail";

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
                onClick={() => downloadMailAttachment(file)}
                aria-label={`Download ${file.name}`}
                title={`Download ${file.name}`}
              >
                <FileText size={14} />
                <span>{file.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
