"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { InvoiceCreateForm } from "@/components/InvoiceCreateForm";
import { Field, Modal, TextInput, TextSelect, TextTextarea } from "@/components/ui";
import { PROJECT_ROLES, availableProjectMembers, weeklyHoursFromAllocation } from "@/lib/project-team";
import { allowedProjectTransitions, canChangeProjectStatus } from "@/lib/project-lifecycle";
import { projectWorkspaceHref } from "@/lib/project-tabs";
import { formatDisplayDate, money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { Project } from "@/lib/types";

export function AddActivityModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const addProjectNote = useAppStore((s) => s.addProjectNote);

  return (
    <Modal open={!!project} title="Add activity" onClose={onClose}>
      {project ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const body = String(fd.get("body") || "").trim();
            if (!body) return;
            addProjectNote(project.id, {
              author: user?.name ?? "Staff",
              body,
              visibility: "internal",
            });
            onClose();
          }}
        >
          <Field label="Note">
            <TextTextarea name="body" rows={4} placeholder={`What happened on ${project.name}?`} required />
          </Field>
          <button type="submit" className="btn btn-primary">
            Save note
          </button>
        </form>
      ) : null}
    </Modal>
  );
}

export function AssignWorkModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const team = useAppStore((s) => s.team);
  const allocations = useAppStore((s) => s.allocations);
  const addProjectMember = useAppStore((s) => s.addProjectMember);
  const [memberId, setMemberId] = useState("");
  const [projectRole, setProjectRole] = useState<string>(PROJECT_ROLES[1]);
  const [responsibility, setResponsibility] = useState("");
  const [allocationPct, setAllocationPct] = useState(25);

  useEffect(() => {
    setMemberId("");
    setProjectRole(PROJECT_ROLES[1]);
    setResponsibility("");
    setAllocationPct(25);
  }, [project?.id]);

  const available = useMemo(
    () => (project ? availableProjectMembers(team, allocations, project.id) : []),
    [allocations, project, team],
  );

  return (
    <Modal open={!!project} title="Assign work" onClose={onClose}>
      {project ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!memberId) return;
            addProjectMember({
              projectId: project.id,
              memberId,
              projectRole,
              responsibility: responsibility.trim(),
              allocationPct,
            });
            onClose();
          }}
        >
          <Field label="Person">
            <TextSelect value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
              <option value="">Select a person</option>
              {available.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Project role">
            <TextSelect value={projectRole} onChange={(e) => setProjectRole(e.target.value)}>
              {PROJECT_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Responsibility">
            <TextInput
              value={responsibility}
              onChange={(e) => setResponsibility(e.target.value)}
              placeholder="Delivery, reviews, or a workstream"
            />
          </Field>
          <Field label="Resource allocation %">
            <TextInput
              type="number"
              min={0}
              max={150}
              value={allocationPct}
              onChange={(e) => setAllocationPct(Number(e.target.value))}
            />
          </Field>
          <p className="mb-3 text-sm text-[var(--color-muted)]">
            {weeklyHoursFromAllocation(allocationPct)} hours per week on this project.
          </p>
          {!available.length ? (
            <p className="mb-3 text-sm text-[var(--color-muted)]">Everyone is already on this team.</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn btn-primary" disabled={!memberId}>
              Add to team
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                onClose();
                router.push(projectWorkspaceHref(project.id, "Team"));
              }}
            >
              Open team
            </button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}

export function ApproveProjectModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { user, can } = useAuth();
  const expenses = useAppStore((s) => s.expenses);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const milestones = useAppStore((s) => s.milestones);
  const workflow = useAppStore((s) => s.projectWorkflow);
  const approveExpense = useAppStore((s) => s.approveExpense);
  const approveTimeEntry = useAppStore((s) => s.approveTimeEntry);
  const approveSignoff = useAppStore((s) => s.approveSignoff);
  const setProjectStatus = useAppStore((s) => s.setProjectStatus);

  const pendingExpenses = useMemo(
    () => (project ? expenses.filter((row) => row.projectId === project.id && row.status === "Pending") : []),
    [expenses, project],
  );
  const pendingTime = useMemo(
    () => (project ? timeEntries.filter((row) => row.projectId === project.id && row.status === "Submitted") : []),
    [project, timeEntries],
  );
  const pendingSignoffs = useMemo(
    () =>
      project
        ? milestones.filter((row) => row.projectId === project.id && row.status === "Awaiting Signoff")
        : [],
    [milestones, project],
  );
  const nextStatuses = project && canChangeProjectStatus(user?.role, workflow)
    ? allowedProjectTransitions(project.status, workflow)
    : [];
  const empty =
    !pendingExpenses.length && !pendingTime.length && !pendingSignoffs.length && !nextStatuses.length;

  return (
    <Modal open={!!project} title="Approve" onClose={onClose}>
      {project ? (
        <div className="space-y-4">
          {nextStatuses.length ? (
            <div>
              <h2 className="section-title">Project status</h2>
              <p className="mb-2 text-sm text-[var(--color-muted)]">Current status is {project.status}.</p>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setProjectStatus(project.id, status);
                      onClose();
                    }}
                  >
                    Move to {status}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {can("approve_expense") && pendingExpenses.length ? (
            <div>
              <h2 className="section-title">Expenses</h2>
              {pendingExpenses.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-2 py-1 text-sm">
                  <span>
                    {row.vendor} · {money(row.amount)}
                  </span>
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => approveExpense(row.id)}>
                    Approve
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {can("approve_time") && pendingTime.length ? (
            <div>
              <h2 className="section-title">Time</h2>
              {pendingTime.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-2 py-1 text-sm">
                  <span>
                    {row.userName} · {row.hours}h · {formatDisplayDate(row.date)}
                  </span>
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => approveTimeEntry(row.id)}>
                    Approve
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {can("approve_signoff") && pendingSignoffs.length ? (
            <div>
              <h2 className="section-title">Signoff</h2>
              {pendingSignoffs.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-2 py-1 text-sm">
                  <span>{row.name}</span>
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => approveSignoff(row.id)}>
                    Approve
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {empty ? (
            <p className="text-sm text-[var(--color-muted)]">Nothing is waiting for approval on this project.</p>
          ) : null}

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              onClose();
              router.push(projectWorkspaceHref(project.id));
            }}
          >
            Open project
          </button>
        </div>
      ) : null}
    </Modal>
  );
}

export function CreateInvoiceModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const router = useRouter();
  return (
    <Modal open={!!project} title="Create invoice" onClose={onClose} xl>
      {project ? (
        <InvoiceCreateForm
          defaultCompanyId={project.companyId}
          defaultProjectId={project.id}
          onCancel={onClose}
          onCreated={(id) => {
            onClose();
            router.push(`/app/billing/view/?id=${id}`);
          }}
        />
      ) : null}
    </Modal>
  );
}
