import { PageHeader } from "@/components/ui";

export default function SalesPage() {
  return (
    <div className="fade-in">
      <PageHeader
        title="Sales"
        subtitle="Pipeline and opportunities. Full module lands in Phase 5; schema and navigation are ready."
      />
      <div className="panel p-6 text-sm text-[var(--color-muted)]">
        Planned capabilities: stages, probability, expected close, quotes, and won-sale conversion into Projects or Retainers.
      </div>
    </div>
  );
}
