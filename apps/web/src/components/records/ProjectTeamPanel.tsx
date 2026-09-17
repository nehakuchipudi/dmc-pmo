"use client";

import { useMemo, useState } from "react";
import { TonePill } from "@/components/records/RecordChrome";
import { Avatar, ConfirmModal, Field, Modal, TextInput, TextSelect } from "@/components/ui";
import {
  PROJECT_ROLES,
  availableProjectMembers,
  projectTeamCards,
  projectTeamContributors,
  utilizationLabel,
  weeklyHoursFromAllocation,
} from "@/lib/project-team";
import { useAppStore } from "@/lib/store";

type Draft = {
  memberId: string;
  projectRole: string;
  responsibility: string;
  allocationPct: number;
};

const emptyDraft: Draft = {
  memberId: "",
  projectRole: "Specialist",
  responsibility: "",
  allocationPct: 25,
};

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export function ProjectTeamPanel({
  projectId,
  managerName,
}: {
  projectId: string;
  managerName?: string;
}) {
  const team = useAppStore((s) => s.team);
  const allocations = useAppStore((s) => s.allocations);
  const tasks = useAppStore((s) => s.tasks);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const addProjectMember = useAppStore((s) => s.addProjectMember);
  const updateProjectMember = useAppStore((s) => s.updateProjectMember);
  const removeProjectMember = useAppStore((s) => s.removeProjectMember);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [openTasksFor, setOpenTasksFor] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const projectTasks = useMemo(() => tasks.filter((task) => task.projectId === projectId), [tasks, projectId]);
  const projectTime = useMemo(
    () => timeEntries.filter((entry) => entry.projectId === projectId),
    [timeEntries, projectId],
  );
  const cards = useMemo(
    () =>
      projectTeamCards({
        projectId,
        allocations,
        team,
        tasks: projectTasks,
        timeEntries: projectTime,
      }),
    [allocations, projectId, projectTasks, projectTime, team],
  );
  const contributors = useMemo(
    () =>
      projectTeamContributors({
        projectId,
        allocations,
        team,
        tasks: projectTasks,
        timeEntries: projectTime,
        extraNames: managerName ? [managerName] : [],
      }),
    [allocations, managerName, projectId, projectTasks, projectTime, team],
  );
  const available = useMemo(
    () => availableProjectMembers(team, allocations, projectId),
    [allocations, projectId, team],
  );
  const removeTarget = cards.find((card) => card.allocation.id === removeId);
  const totalAlloc = cards.reduce((sum, card) => sum + card.allocationPct, 0);
  const totalHours = cards.reduce((sum, card) => sum + card.loggedHours, 0);
  const totalOpen = cards.reduce((sum, card) => sum + card.openTasks, 0);
  const overloaded = cards.filter((card) => card.utilizationLevel === "over").length;

  function openAdd(memberId = "") {
    setEditId(null);
    setDraft({ ...emptyDraft, memberId });
    setFormOpen(true);
  }

  function openEdit(allocationId: string) {
    const card = cards.find((item) => item.allocation.id === allocationId);
    if (!card) return;
    setEditId(allocationId);
    setDraft({
      memberId: card.allocation.memberId,
      projectRole: card.projectRole,
      responsibility: card.allocation.responsibility || "",
      allocationPct: card.allocationPct,
    });
    setFormOpen(true);
  }

  function saveMember() {
    if (editId) {
      updateProjectMember(editId, {
        projectRole: draft.projectRole,
        responsibility: draft.responsibility.trim(),
        allocationPct: Number(draft.allocationPct) || 0,
      });
    } else if (draft.memberId) {
      addProjectMember({
        projectId,
        memberId: draft.memberId,
        projectRole: draft.projectRole,
        responsibility: draft.responsibility.trim(),
        allocationPct: Number(draft.allocationPct) || 0,
      });
    }
    setFormOpen(false);
    setEditId(null);
    setDraft(emptyDraft);
  }

  return (
    <div className="space-y-4">
      <div className="team-summary">
        <div className="team-summary-card">
          <div className="team-stat-value">{cards.length}</div>
          <div className="team-stat-label">On the team</div>
        </div>
        <div className="team-summary-card">
          <div className="team-stat-value">{totalAlloc}%</div>
          <div className="team-stat-label">Allocated here</div>
        </div>
        <div className="team-summary-card">
          <div className="team-stat-value">{totalOpen}</div>
          <div className="team-stat-label">Open tasks</div>
        </div>
        <div className="team-summary-card">
          <div className="team-stat-value">{totalHours}h</div>
          <div className="team-stat-label">Logged hours</div>
        </div>
        <div className={`team-summary-card ${overloaded ? "is-over" : ""}`}>
          <div className="team-stat-value">{overloaded}</div>
          <div className="team-stat-label">Over capacity</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--color-muted)]">
          Allocation is this project. Capacity is the person across every project.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => openAdd()}>
          Add team member
        </button>
      </div>

      <div className="team-grid">
        {cards.map((card) => {
          const name = card.member?.name ?? card.allocation.memberName;
          const showTasks = openTasksFor === card.allocation.id;
          return (
            <article
              key={card.allocation.id}
              className={`team-card is-${card.utilizationLevel}`}
              data-member={name}
            >
              <div className="team-card-head">
                <div className="team-card-who">
                  <Avatar
                    initials={card.member?.initials ?? initialsFor(name)}
                    src={card.member?.avatarUrl}
                    name={name}
                    size={40}
                  />
                  <div className="min-w-0">
                    <div className="team-card-name">{name}</div>
                    <div className="team-card-role">{card.projectRole}</div>
                  </div>
                </div>
                <div className="team-card-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(card.allocation.id)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-[var(--color-danger)]"
                    onClick={() => setRemoveId(card.allocation.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="team-card-duty">{card.responsibility}</p>
              <div className="team-card-stats">
                <div>
                  <div className="team-stat-label">Allocation</div>
                  <div className="team-stat-value">
                    {card.allocationPct}% · {card.hoursPerWeek}h / week
                  </div>
                </div>
                <div>
                  <div className="team-stat-label">Capacity</div>
                  <div className="team-stat-value">
                    {card.utilization}% · {card.capacityHours}h / week
                  </div>
                </div>
                <div>
                  <div className="team-stat-label">Workload</div>
                  <div className="team-stat-value">
                    {card.openTasks} open / {card.taskCount} tasks
                  </div>
                </div>
                <div>
                  <div className="team-stat-label">Logged hours</div>
                  <div className="team-stat-value">{card.loggedHours}h on this project</div>
                </div>
              </div>
              <div className="team-util">
                <div className="team-util-meta">
                  <span>{utilizationLabel(card.utilizationLevel)}</span>
                  <span>
                    {card.otherProjects
                      ? `${card.otherProjects} other project${card.otherProjects === 1 ? "" : "s"}`
                      : "This project only"}
                  </span>
                </div>
                <div className={`team-util-bar is-${card.utilizationLevel}`} aria-label={`${name} capacity`}>
                  <span style={{ width: `${Math.min(100, card.utilization)}%` }} />
                </div>
              </div>
              <button
                type="button"
                className="team-task-toggle"
                onClick={() => setOpenTasksFor(showTasks ? null : card.allocation.id)}
              >
                {showTasks ? "Hide assigned tasks" : "View assigned tasks"}
              </button>
              {showTasks ? (
                <ul className="team-task-list">
                  {card.assignedTasks.map((task) => (
                    <li key={task.id}>
                      <span>{task.name}</span>
                      <TonePill value={task.status} />
                    </li>
                  ))}
                  {!card.assignedTasks.length ? <li className="text-[var(--color-muted)]">No assigned tasks.</li> : null}
                </ul>
              ) : null}
            </article>
          );
        })}
      </div>

      {!cards.length ? (
        <div className="panel p-4 text-sm text-[var(--color-muted)]">
          No team members yet. Add someone to set a role, responsibility, and allocation.
        </div>
      ) : null}

      {contributors.length ? (
        <div className="panel p-4">
          <h2 className="section-title">Contributors not on the team</h2>
          <p className="mb-3 text-sm text-[var(--color-muted)]">
            These people already have tasks or time here. Add them to assign a role and allocation.
          </p>
          <div className="team-contributor-list">
            {contributors.map((member) => (
              <div key={member.id} className="team-contributor">
                <div className="team-card-who">
                  <Avatar initials={member.initials} src={member.avatarUrl} name={member.name} size={32} />
                  <div>
                    <div className="team-card-name">{member.name}</div>
                    <div className="team-card-role">{member.role}</div>
                  </div>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => openAdd(member.id)}>
                  Add to team
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Modal open={formOpen} title={editId ? "Edit team member" : "Add team member"} onClose={() => setFormOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMember();
          }}
        >
          <Field label="Person">
            {editId ? (
              <p className="text-sm font-medium">{cards.find((card) => card.allocation.id === editId)?.allocation.memberName}</p>
            ) : (
              <TextSelect
                name="memberId"
                value={draft.memberId}
                onChange={(e) => setDraft((prev) => ({ ...prev, memberId: e.target.value }))}
                required
              >
                <option value="">Select a person</option>
                {available.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </TextSelect>
            )}
          </Field>
          <Field label="Project role">
            <TextSelect
              name="projectRole"
              value={draft.projectRole}
              onChange={(e) => setDraft((prev) => ({ ...prev, projectRole: e.target.value }))}
            >
              {PROJECT_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Responsibility">
            <TextInput
              name="responsibility"
              value={draft.responsibility}
              placeholder="Delivery, reviews, or a workstream"
              onChange={(e) => setDraft((prev) => ({ ...prev, responsibility: e.target.value }))}
            />
          </Field>
          <Field label="Resource allocation %">
            <TextInput
              name="allocationPct"
              type="number"
              min={0}
              max={150}
              value={draft.allocationPct}
              onChange={(e) => setDraft((prev) => ({ ...prev, allocationPct: Number(e.target.value) }))}
            />
          </Field>
          <p className="mb-3 text-sm text-[var(--color-muted)]">
            {weeklyHoursFromAllocation(draft.allocationPct)} hours per week on this project.
          </p>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={!editId && !draft.memberId}>
              {editId ? "Save assignment" : "Add to team"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!removeId}
        title="Remove team member"
        body={`${removeTarget?.allocation.memberName ?? "This person"} stays on assigned tasks. Only the project allocation is removed.`}
        confirmLabel="Remove from team"
        danger
        onConfirm={() => {
          if (removeId) removeProjectMember(removeId);
          setRemoveId(null);
        }}
        onClose={() => setRemoveId(null)}
      />
    </div>
  );
}

export function ProjectTeamPreview({
  projectId,
  onManage,
}: {
  projectId: string;
  onManage: () => void;
}) {
  const team = useAppStore((s) => s.team);
  const allocations = useAppStore((s) => s.allocations);
  const tasks = useAppStore((s) => s.tasks);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const projectTasks = useMemo(() => tasks.filter((task) => task.projectId === projectId), [tasks, projectId]);
  const projectTime = useMemo(
    () => timeEntries.filter((entry) => entry.projectId === projectId),
    [timeEntries, projectId],
  );
  const cards = useMemo(
    () =>
      projectTeamCards({
        projectId,
        allocations,
        team,
        tasks: projectTasks,
        timeEntries: projectTime,
      }),
    [allocations, projectId, projectTasks, projectTime, team],
  );

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="section-title">Team</h2>
        <button type="button" className="text-sm font-semibold text-[var(--color-navy)]" onClick={onManage}>
          Manage team
        </button>
      </div>
      <div className="team-preview-grid">
        {cards.slice(0, 4).map((card) => {
          const name = card.member?.name ?? card.allocation.memberName;
          return (
            <div key={card.allocation.id} className={`team-preview-card is-${card.utilizationLevel}`}>
              <Avatar
                initials={card.member?.initials ?? initialsFor(name)}
                src={card.member?.avatarUrl}
                name={name}
                size={28}
              />
              <div className="min-w-0">
                <div className="team-card-name">{name}</div>
                <div className="team-card-role">
                  {card.projectRole} · {card.allocationPct}% · {card.openTasks} tasks · {card.loggedHours}h
                </div>
              </div>
            </div>
          );
        })}
        {!cards.length ? <p className="text-sm text-[var(--color-muted)]">No team members yet.</p> : null}
      </div>
    </div>
  );
}

export function ProjectTeamRail({
  projectId,
  onManage,
}: {
  projectId: string;
  onManage: () => void;
}) {
  const team = useAppStore((s) => s.team);
  const allocations = useAppStore((s) => s.allocations);
  const tasks = useAppStore((s) => s.tasks);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const projectTasks = useMemo(() => tasks.filter((task) => task.projectId === projectId), [tasks, projectId]);
  const projectTime = useMemo(
    () => timeEntries.filter((entry) => entry.projectId === projectId),
    [timeEntries, projectId],
  );
  const cards = useMemo(
    () =>
      projectTeamCards({
        projectId,
        allocations,
        team,
        tasks: projectTasks,
        timeEntries: projectTime,
      }),
    [allocations, projectId, projectTasks, projectTime, team],
  );

  return (
    <div className="team-rail">
      {cards.map((card) => {
        const name = card.member?.name ?? card.allocation.memberName;
        return (
          <div key={card.allocation.id} className="team-rail-row">
            <span className={`team-dot is-${card.utilizationLevel}`} aria-hidden />
            <Avatar
              initials={card.member?.initials ?? initialsFor(name)}
              src={card.member?.avatarUrl}
              name={name}
              size={26}
            />
            <div className="min-w-0">
              <div className="team-rail-name">{name}</div>
              <div className="team-rail-meta">
                {card.projectRole} · {card.allocationPct}% · cap {card.utilization}%
              </div>
            </div>
          </div>
        );
      })}
      {!cards.length ? <p className="text-sm text-[var(--color-muted)]">No team assigned.</p> : null}
      <button type="button" className="btn btn-ghost mt-2 w-full" onClick={onManage}>
        Manage team
      </button>
    </div>
  );
}
