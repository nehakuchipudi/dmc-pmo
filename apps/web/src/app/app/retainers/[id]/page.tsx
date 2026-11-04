import { Suspense } from "react";
import { seedRetainers, staticRecordIds } from "@/lib/seed";
import { RetainerDetail } from "./retainer-detail";

export function generateStaticParams() {
  return staticRecordIds(seedRetainers);
}

export default async function RetainerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-6 text-[var(--color-muted)]">Loading retainer...</div>}>
      <RetainerDetail id={id} />
    </Suspense>
  );
}
