"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { projects } from "@/lib/data";
import { FilterChips, PageHeader, ProgressBar, SideRail, StatusPill, statusTone } from "@/components/ui";

const FILTERS = [
  "All Open Projects",
  "Recently Created",
  "Managed By Me",
  "Projects Overdue",
  "Classic Lists",
];

export default function ProjectsPage() {
  const [filter, setFilter] = useState(FILTERS[0]);
  const rows = useMemo(() => {
    if (filter === "Projects Overdue") return projects.filter((p) => p.status === "Overdue");
    if (filter === "Managed By Me") return projects.filter((p) => p.manager === "M. Doyle");
    return projects;
  }, [filter]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Projects"
        subtitle="Every active and completed engagement."
        actions={
          <button type="button" className="btn btn-primary">
            <Plus size={16} /> New Project
          </button>
        }
      />
      <div className="mb-3 flex gap-4 text-sm">
        {["Projects", "Milestones", "Quick Links"].map((tab, i) => (
          <span key={tab} className={i === 0 ? "font-semibold text-[var(--color-navy)] border-b-2 border-[var(--color-navy)] pb-1" : "text-[var(--color-muted)]"}>
            {tab}
          </span>
        ))}
      </div>
      <FilterChips items={FILTERS} active={filter} onChange={setFilter} />
      <div className="grid gap-4 lg:grid-cols-[1fr_250px]">
        <div className="panel overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Company</th>
                <th>Manager</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/app/projects/${p.id}`} className="font-medium text-[var(--color-navy)]">
                      {p.name}
                    </Link>
                  </td>
                  <td>{p.companyName}</td>
                  <td>{p.manager}</td>
                  <td><ProgressBar value={p.progress} /></td>
                  <td><StatusPill tone={statusTone(p.status)}>{p.status}</StatusPill></td>
                  <td>{p.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SideRail title="Shortcuts & Signoffs">
          <ul className="space-y-2 text-sm">
            {[
              "Projects Dashboard",
              "Project Stream",
              "Project Timesheet Overview",
              "Reports",
              "Project Signoffs",
              "Managed By Me",
              "Recently Created",
            ].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </SideRail>
      </div>
    </div>
  );
}
