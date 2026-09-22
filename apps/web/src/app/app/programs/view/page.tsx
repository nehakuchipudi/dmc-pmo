"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProgramViewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/portfolios");
  }, [router]);
  return <p className="text-[var(--color-muted)]">Opening portfolios...</p>;
}
