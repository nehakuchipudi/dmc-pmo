"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ContactDetail } from "../[id]/contact-detail";

function Inner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "ct-dana";
  return <ContactDetail id={id} />;
}

export default function ContactViewPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[var(--color-muted)]">Loading contact…</div>}>
      <Inner />
    </Suspense>
  );
}
