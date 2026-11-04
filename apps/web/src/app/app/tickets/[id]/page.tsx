import { seedTickets, staticRecordIds } from "@/lib/seed";
import { TicketDetail } from "./ticket-detail";

export function generateStaticParams() {
  return staticRecordIds(seedTickets);
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TicketDetail id={id} />;
}
