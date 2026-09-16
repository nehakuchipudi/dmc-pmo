import Link from "next/link";
import { Eye, Mail, Phone } from "lucide-react";
import type { Contact } from "@/lib/types";

export function ContactActions({
  contact,
  compact,
}: {
  contact: Contact;
  compact?: boolean;
}) {
  return (
    <div className={`contact-actions ${compact ? "is-compact" : ""}`}>
      <a className="icon-btn" href={`mailto:${contact.email}`} aria-label={`Email ${contact.name}`}>
        <Mail size={15} />
      </a>
      {contact.phone ? (
        <a className="icon-btn" href={`tel:${contact.phone.replace(/\s+/g, "")}`} aria-label={`Call ${contact.name}`}>
          <Phone size={15} />
        </a>
      ) : null}
      <Link className="icon-btn" href={`/app/contacts/view/?id=${contact.id}`} aria-label={`View ${contact.name}`}>
        <Eye size={15} />
      </Link>
    </div>
  );
}
