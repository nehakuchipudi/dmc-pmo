"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";
import { Lock, MoreVertical, Plus } from "lucide-react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { RowMenu } from "@/components/RowMenu";
import {
  AddActivityModal,
  ApproveProjectModal,
  AssignWorkModal,
  CreateInvoiceModal,
} from "@/components/projects/ProjectRowModals";
import { Avatar, Field, FilterChips, Modal, PageHeader, ProgressBar, StatusPill, TextInput, TextSelect, statusTone } from "@/components/ui";
import { initialsFromName } from "@/lib/seed";
import { formatDisplayDate, money } from "@/lib/seed";
import { exportCsv } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";
import { IfCan } from "@/components/auth/IfCan";
import { useAuth } from "@/lib/auth";
import { hiddenMoney } from "@/lib/rbac";
import {
  PROJECT_LIST_FILTERS,
  filterProjectList,
  lastProjectContactIso,
  projectDisplayId,
  projectEarnedValue,
} from "@/lib/ppm";
import { projectWorkspaceHref } from "@/lib/project-tabs";
import { todayIso } from "@/lib/timesheet";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const router = useRouter();
  const { user, can, canSeeFinancials } = useAuth();
  const projects = useAppStore((s) => s.projects);
  const companies = useAppStore((s) => s.companies);
  const activities = useAppStore((s) => s.activities);
  const tickets = useAppStore((s) => s.tickets);
  const ticketMessages = useAppStore((s) => s.ticketMessages);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const updateProject = useAppStore((s) => s.updateProject);
  const [filter, setFilter] = useState<(typeof PROJECT_LIST_FILTERS)[number]>(PROJECT_LIST_FILTERS[0]);
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [createDefaults, setCreateDefaults] = useState<{ projectId?: string; companyId?: string }>({});
  const [menu, setMenu] = useState<{ id: string; el: HTMLElement } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [activityProject, setActivityProject] = useState<Project | null>(null);
  const [assignProject, setAssignProject] = useState<Project | null>(null);
  const [approveProject, setApproveProject] = useState<Project | null>(null);
  const [invoiceProject, setInvoiceProject] = useState<Project | null>(null);

  const rows = useMemo(
    () =>
      filterProjectList(projects, filter, { userName: user?.name, today: todayIso() }).map((p) => {
        const contact = lastProjectContactIso(p.id, { activities, tickets, ticketMessages, timeEntries });
        return {
          ...p,
          displayId: projectDisplayId(p),
          earned: projectEarnedValue(p),
          lastContact: contact ? formatDisplayDate(contact) : "-",
          confidential: companies.find((c) => c.id === p.companyId)?.privacy === "Confidential",
        };
      }),
    [activities, companies, filter, projects, ticketMessages, tickets, timeEntries, user],
  );

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
                    id: p.displayId,
                    name: p.name,
                    company: p.companyName,
                    type: p.projectType,
                    manager: p.manager,
                    status: p.status,
                    progress: p.progress,
                    earned: p.earned,
                    due: p.due,
                    budget: p.budgetAmount,
                    lastContact: p.lastContact,
                  })),
                )
              }
            >
              Export
            </button>
            <IfCan cap="create_project">
              <button type="button" className="btn btn-primary" onClick={() => setCreateKind("project")}>
                <Plus size={16} /> New project
              </button>
            </IfCan>
          </>
        }
      />
      <FilterChips
        items={[...PROJECT_LIST_FILTERS]}
        active={filter}
        onChange={(v) => startTransition(() => setFilter(v as (typeof PROJECT_LIST_FILTERS)[number]))}
      />
      <div className="panel table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="whitespace-nowrap">Project</th>
              <th className="whitespace-nowrap">Id</th>
              <th className="whitespace-nowrap">Company</th>
              <th className="whitespace-nowrap">Type</th>
              <th className="whitespace-nowrap">Manager</th>
              <th className="whitespace-nowrap">Status</th>
              <th className="whitespace-nowrap">Earned</th>
              <th className="whitespace-nowrap">Budget</th>
              <th className="whitespace-nowrap">Due</th>
              <th className="whitespace-nowrap">Last contact</th>
              <th className="whitespace-nowrap">Progress</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {p.confidential ? <Lock size={14} aria-label="Confidential" className="shrink-0 text-[var(--color-muted)]" /> : null}
                    <Link
                      href={`/app/projects/view/?id=${p.id}`}
                      className="font-semibold text-[var(--color-navy)] hover:underline"
                      onMouseEnter={() => router.prefetch(`/app/projects/view/?id=${p.id}`)}
                    >
                      {p.name}
                    </Link>
                  </div>
                </td>
                <td className="tabular-nums whitespace-nowrap">{p.displayId}</td>
                <td>
                  {p.companyId ? (
                    <Link href={`/app/companies/view/?id=${p.companyId}`} className="hover:underline">
                      {p.companyName}
                    </Link>
                  ) : (
                    p.companyName
                  )}
                </td>
                <td className="whitespace-nowrap">{p.projectType}</td>
                <td className="whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Avatar initials={initialsFromName(p.manager)} name={p.manager} size={28} />
                    <span>{p.manager}</span>
                  </div>
                </td>
                <td>
                  <StatusPill tone={statusTone(p.status)}>{p.status}</StatusPill>
                </td>
                <td className="tabular-nums whitespace-nowrap">{hiddenMoney(canSeeFinancials, money(p.earned))}</td>
                <td className="tabular-nums whitespace-nowrap">{hiddenMoney(canSeeFinancials, money(p.budgetAmount))}</td>
                <td className="whitespace-nowrap">{formatDisplayDate(p.due)}</td>
                <td className="whitespace-nowrap">{p.lastContact}</td>
                <td className="min-w-[140px]">
                  <ProgressBar value={p.progress} />
                </td>
                <td className="row-actions text-right">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    aria-label={`Actions for ${p.name}`}
                    aria-haspopup="menu"
                    aria-expanded={menu?.id === p.id}
                    onClick={(e) => {
                      const el = e.currentTarget;
                      setMenu((cur) => (cur?.id === p.id ? null : { id: p.id, el }));
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>
                  <RowMenu
                    open={menu?.id === p.id}
                    anchor={menu?.id === p.id ? menu.el : null}
                    onClose={() => setMenu(null)}
                  >
                    {can("add_note") ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setActivityProject(p);
                          setMenu(null);
                        }}
                      >
                        Add activity
                      </button>
                    ) : null}
                    {can("log_time") ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setCreateDefaults({ projectId: p.id, companyId: p.companyId });
                          setCreateKind("time");
                          setMenu(null);
                        }}
                      >
                        Log time
                      </button>
                    ) : null}
                    {can("create_task") ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setCreateDefaults({ projectId: p.id, companyId: p.companyId });
                          setCreateKind("task");
                          setMenu(null);
                        }}
                      >
                        Add task
                      </button>
                    ) : null}
                    {can("edit_project") ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setEditId(p.id);
                          setMenu(null);
                        }}
                      >
                        Edit project
                      </button>
                    ) : null}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenu(null);
                        router.push(projectWorkspaceHref(p.id, "Schedule"));
                      }}
                    >
                      Edit plan
                    </button>
                    {can("manage_project_team") ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAssignProject(p);
                          setMenu(null);
                        }}
                      >
                        Assign work
                      </button>
                    ) : null}
                    {can("approve_time") || can("approve_expense") || can("approve_signoff") || can("edit_project") ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setApproveProject(p);
                          setMenu(null);
                        }}
                      >
                        Approve
                      </button>
                    ) : null}
                    {can("create_invoice") ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setInvoiceProject(p);
                          setMenu(null);
                        }}
                      >
                        Create invoice
                      </button>
                    ) : null}
                  </RowMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateForms
        kind={createKind}
        defaults={createDefaults}
        onClose={() => {
          setCreateKind(null);
          setCreateDefaults({});
        }}
      />
      <AddActivityModal project={activityProject} onClose={() => setActivityProject(null)} />
      <AssignWorkModal project={assignProject} onClose={() => setAssignProject(null)} />
      <ApproveProjectModal project={approveProject} onClose={() => setApproveProject(null)} />
      <CreateInvoiceModal project={invoiceProject} onClose={() => setInvoiceProject(null)} />

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
            <Field label="Owner">
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
