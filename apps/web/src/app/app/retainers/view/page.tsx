"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RetainerDetail } from "../[id]/retainer-detail";

function Inner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "r1";
  return <RetainerDetail id={id} />;
}

export default function RetainerViewPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[var(--color-muted)]">Loading retainer…</div>}>
      <Inner />
    </Suspense>
  );
}
