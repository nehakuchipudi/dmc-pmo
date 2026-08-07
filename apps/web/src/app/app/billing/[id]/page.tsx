import { seedInvoices } from "@/lib/seed";
import { InvoiceDetail } from "./invoice-detail";

export function generateStaticParams() {
  return seedInvoices.map((i) => ({ id: i.id }));
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InvoiceDetail id={id} />;
}
