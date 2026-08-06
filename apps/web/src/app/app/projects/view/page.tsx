"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ProjectDetail } from "../[id]/project-detail";

function Inner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "p-warehouse";
  return <ProjectDetail id={id} />;
}

export default function ProjectViewPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[var(--color-muted)]">Loading project…</div>}>
      <Inner />
    </Suspense>
  );
}
