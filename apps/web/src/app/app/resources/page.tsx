"use client";

import Link from "next/link";
import { Avatar, PageHeader } from "@/components/ui";
import { DataTable, MetricCard, MetricGrid, Pill, ProgressLine } from "@/components/ppm/PpmWidgets";
import { allocationByMember } from "@/lib/ppm";
import { useAppStore } from "@/lib/store";

export default function ResourcesPage() {
  const team = useAppStore((s) => s.team);
  const allocations = useAppStore((s) => s.allocations);
  const byMember = allocationByMember(allocations);
  const overloaded = byMember.filter((m) => m.pct > 100);

  return (
    <div className="fade-in">
      <PageHeader
        title="Resources"
        subtitle="Capacity against the work already in Projects and Work. Allocations sit on the existing team, they do not replace assignees on tasks."
      />
      <MetricGrid>
        <MetricCard label="People" value={team.filter((t) => t.active).length} />
        <MetricCard label="Assignments" value={allocations.length} />
        <MetricCard
          label="Overloaded"
          value={overloaded.length}
          hint={overloaded.map((o) => o.name).join(", ") || "Everyone at or under 100%"}
          tone={overloaded.length ? "bad" : "good"}
        />
        <MetricCard
          label="Avg load"
          value={`${byMember.length ? Math.round(byMember.reduce((s, m) => s + m.pct, 0) / byMember.length) : 0}%`}
        />
        <MetricCard label="Hours / week" value={allocations.reduce((s, a) => s + a.hoursPerWeek, 0)} />
      </MetricGrid>
      <div className="split-2">
        <div className="panel p-5">
          <h2 className="section-title">Capacity</h2>
          <DataTable
            columns={["Person", "Role", "Load", "Hours", "Projects"]}
            rows={byMember.map((row) => {
              const member = team.find((t) => t.id === row.id);
              return [
                <div key={row.id} className="flex items-center gap-2">
                  <Avatar initials={member?.initials ?? row.name.slice(0, 2)} src={member?.avatarUrl} name={row.name} size={28} />
                  <span className="font-medium">{row.name}</span>
                </div>,
                member?.role ?? "",
                <div key={`${row.id}-l`} className="min-w-[140px]">
                  <ProgressLine value={Math.min(row.pct, 140)} label={`${row.pct}%`} />
                </div>,
                `${row.hours}h`,
                String(row.count),
              ];
            })}
          />
        </div>
        <div className="panel p-5">
          <h2 className="section-title">Assignments</h2>
          <DataTable
            columns={["Person", "Project", "Alloc", "Window"]}
            rows={allocations.map((a) => [
              a.memberName,
              <Link key={a.id} href={`/app/projects/view/?id=${a.projectId}`} className="text-[var(--color-navy)]">
                {a.projectName}
              </Link>,
              <Pill key={`${a.id}-p`} value={`${a.allocationPct}%`} />,
              `${a.start} → ${a.end}`,
            ])}
          />
        </div>
      </div>
    </div>
  );
}
