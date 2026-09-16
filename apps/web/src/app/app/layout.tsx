import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-[var(--color-muted)]">Loading workspace...</div>}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
