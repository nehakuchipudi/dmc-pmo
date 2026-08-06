"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TicketDetail } from "../[id]/ticket-detail";

function Inner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "t-1042";
  return <TicketDetail id={id} />;
}

export default function TicketViewPage() {
  return (
    <Suspense fallback={<div className="text-[var(--color-muted)]">Loading ticket...</div>}>
      <Inner />
    </Suspense>
  );
}
