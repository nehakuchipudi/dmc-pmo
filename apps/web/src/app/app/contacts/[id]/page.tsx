import { seedContacts } from "@/lib/seed";
import { ContactDetail } from "./contact-detail";

export function generateStaticParams() {
  return seedContacts.map((c) => ({ id: c.id }));
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContactDetail id={id} />;
}
