"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CompanyDetail } from "../[id]/company-detail";

function Inner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "c-cascade";
  return <CompanyDetail id={id} />;
}

export default function CompanyViewPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[var(--color-muted)]">Loading company…</div>}>
      <Inner />
    </Suspense>
  );
}
