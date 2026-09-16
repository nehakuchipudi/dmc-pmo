"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { InvoiceDetail } from "../[id]/invoice-detail";

function Inner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "inv-2291";
  return <InvoiceDetail id={id} />;
}

export default function BillingViewPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[var(--color-muted)]">Loading invoice…</div>}>
      <Inner />
    </Suspense>
  );
}
