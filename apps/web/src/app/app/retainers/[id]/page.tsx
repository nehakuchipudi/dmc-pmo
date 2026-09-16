import { seedRetainers } from "@/lib/seed";
import { RetainerDetail } from "./retainer-detail";

export function generateStaticParams() {
  return seedRetainers.map((r) => ({ id: r.id }));
}

export default async function RetainerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RetainerDetail id={id} />;
}
