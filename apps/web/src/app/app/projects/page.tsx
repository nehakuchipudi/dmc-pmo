"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";
import { MoreVertical, Plus } from "lucide-react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { Avatar, Field, FilterChips, Modal, PageHeader, ProgressBar, StatusPill, TextInput, TextSelect, statusTone } from "@/components/ui";
import { initialsFromName } from "@/lib/seed";
import { formatDisplayDate, money } from "@/lib/seed";
import { exportCsv } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";
import { isOpenProjectStatus, isWatchLifecycle } from "@/lib/project-lifecycle";

const FILTERS = ["All open projects", "My projects", "At risk", "Recently created"];

export default function ProjectsPage() {
  const router = useRouter();
  const projects = useAppStore((s) => s.projects);
  const companies = useAppStore((s) => s.companies);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const duplicateProject = useAppStore((s) => s.duplicateProject);
  const updateProject = useAppStore((s) => s.updateProject);
  const generateProjectInvoice = useAppStore((s) => s.generateProjectInvoice);
  const queueEmail = useAppStore((s) => s.queueEmail);
  const pushToast = useAppStore((s) => s.pushToast);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (filter === "My projects") return projects.filter((p) => p.manager === "M. Doyle");
    if (filter === "At risk") return projects.filter((p) => isWatchLifecycle(p.status));
    if (filter === "Recently created") return [...projects];
    return projects.filter((p) => isOpenProjectStatus(p.status));
  }, [filter, projects]);

  const editing = projects.find((p) => p.id === editId);

  return (
    <div className="fade-in">
      <PageHeader
        title="Projects"
        subtitle="Plan delivery, edit schedules, bill clients, and keep files in one place."
        actions={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                exportCsv(
                  "projects.csv",
                  rows.map((p) => ({
                    name: p.name,
                    company: p.companyName,
                    manager: p.manager,
                    status: p.status,
                    progress: p.progress,
                    due: p.due,
                    budget: p.budgetAmount,
                  })),
                )
              }
            >
              Export
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setCreateKind("project")}>
              <Plus size={16} /> New project
            </button>
          </>
        }
      />
      <FilterChips
        items={FILTERS}
        active={filter}
        onChange={(v) => startTransition(() => setFilter(v))}
      />
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
              <th>Budget</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link
                    href={`/app/projects/view/?id=${p.id}`}
                    className="font-semibold text-[var(--color-navy)] hover:underline"
                    onMouseEnter={() => router.prefetch(`/app/projects/view/?id=${p.id}`)}
                  >
                    {p.name}
                  </Link>
                  <div className="text-xs text-[var(--color-muted)]">{p.projectType}</div>
                </td>
                <td>
                  <Link href={`/app/companies/view/?id=${p.companyId}`} className="hover:underline">
                    {p.companyName}
                  </Link>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Avatar initials={initialsFromName(p.manager)} name={p.manager} size={28} />
                    <span>{p.manager}</span>
                  </div>
                </td>
                <td className="min-w-[140px]">
                  <ProgressBar value={p.progress} />
                </td>
                <td>
                  <StatusPill tone={statusTone(p.status)}>{p.status}</StatusPill>
                </td>
                <td>{formatDisplayDate(p.due)}</td>
                <td className="tabular-nums">{money(p.budgetAmount)}</td>
                <td className="row-actions text-right">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    aria-label="Actions"
                    onClick={() => setMenuId(menuId === p.id ? null : p.id)}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuId === p.id ? (
                    <div className="row-menu">
                      <button type="button" onClick={() => { setEditId(p.id); setMenuId(null); }}>
                        Edit project
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const id = duplicateProject(p.id);
                          setMenuId(null);
                          if (id) router.push(`/app/projects/view/?id=${id}`);
                        }}
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const id = generateProjectInvoice(p.id);
                          setMenuId(null);
                          if (id) router.push(`/app/billing/view/?id=${id}`);
                        }}
                      >
                        Generate invoice
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          queueEmail(
                            "ops@dillonmorgan.com",
                            `Project update: ${p.name}`,
                            `Status ${p.status}, progress ${p.progress}%.`,
                          );
                          pushToast("Email queued");
                          setMenuId(null);
                        }}
                      >
                        Email update
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteProject(p.id);
                          setMenuId(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateForms kind={createKind} onClose={() => setCreateKind(null)} />

      <Modal open={!!editing} title="Edit project" onClose={() => setEditId(null)}>
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              updateProject(editing.id, {
                name: String(fd.get("name") || editing.name),
                manager: String(fd.get("manager") || editing.manager),
                due: String(fd.get("due") || editing.due),
                description: String(fd.get("description") || ""),
                companyId: String(fd.get("companyId") || editing.companyId),
                companyName:
                  companies.find((c) => c.id === String(fd.get("companyId")))?.name ?? editing.companyName,
              });
              setEditId(null);
            }}
          >
            <Field label="Name">
              <TextInput name="name" defaultValue={editing.name} />
            </Field>
            <Field label="Company">
              <TextSelect name="companyId" defaultValue={editing.companyId}>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field label="Manager">
              <TextInput name="manager" defaultValue={editing.manager} />
            </Field>
            <Field label="Status">
              <p className="text-sm">
                {editing.status}. Open the project to change lifecycle status.
              </p>
            </Field>
            <Field label="Due">
              <TextInput type="date" name="due" defaultValue={editing.due} />
            </Field>
            <Field label="Description">
              <TextInput name="description" defaultValue={editing.description} />
            </Field>
            <button type="submit" className="btn btn-primary">
              Save changes
            </button>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
