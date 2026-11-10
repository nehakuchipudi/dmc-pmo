"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Check, ChevronDown, Flag, ListChecks, MoreHorizontal, Pause, Play, X } from "lucide-react";
import { ConfirmModal, Field, Modal, StatusPill, TextInput, TextSelect, TextTextarea, statusTone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/lib/store";
import type { TimeEntry } from "@/lib/types";
import { formatClockHours, formatHms, formatLongDay, parseDurationInput } from "@/lib/timesheet";
import { type TimesheetWork } from "@/lib/timesheet-work";

function WorkGlyph({ kind }: { kind: TimesheetWork["kind"] }) {
  if (kind === "phase") return <Flag size={18} />;
  if (kind === "task" || kind === "subtask") return <ListChecks size={18} />;
  return <Briefcase size={18} />;
}

function workTitle(work: TimesheetWork) {
  if (work.kind === "phase") return `Milestone: ${work.label}`;
  if (work.kind === "task") return `Task: ${work.label}`;
  if (work.kind === "subtask") return `Task: ${work.label}`;
  return work.projectName;
}

function formatStamp(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TimesheetActivityModal({
  work,
  date,
  entries,
  startOnAdd,
  personName,
  onClose,
}: {
  work: TimesheetWork;
  date: string;
  entries: TimeEntry[];
  startOnAdd?: boolean;
  personName: string;
  onClose: () => void;
}) {
  const { user, can } = useAuth();
  const createTimeEntry = useAppStore((s) => s.createTimeEntry);
  const updateTimeEntry = useAppStore((s) => s.updateTimeEntry);
  const deleteTimeEntry = useAppStore((s) => s.deleteTimeEntry);
  const submitTimeEntry = useAppStore((s) => s.submitTimeEntry);
  const approveTimeEntry = useAppStore((s) => s.approveTimeEntry);
  const rejectTimeEntry = useAppStore((s) => s.rejectTimeEntry);
  const [tab, setTab] = useState<"add" | "logged">(startOnAdd || !entries.length ? "add" : "logged");
  const [editingId, setEditingId] = useState<string | null>(
    startOnAdd ? null : entries.length === 1 ? entries[0].id : null,
  );
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const canApprove = can("approve_time");
  const editing = entries.find((item) => item.id === editingId) ?? null;

  function canChange(entry: TimeEntry) {
    if (!user) return false;
    const own = entry.userName === user.name || entry.userName === "J. Kim";
    if (user.role === "staff" && !own) return false;
    if (entry.status === "Approved" && !canApprove) return false;
    return true;
  }

  return (
    <>
      <Modal open title={workTitle(work)} onClose={onClose} wide>
        <p className="ts-activity-crumbs">
          {work.companyName ? <span>Company: {work.companyName}</span> : null}
          <span>Project: {work.projectName}</span>
          {work.milestoneName ? <span>Milestone: {work.milestoneName}</span> : null}
          {work.taskName ? <span>Task: {work.taskName}</span> : null}
        </p>
        <div className="ts-activity-tabs">
          <button
            type="button"
            className={tab === "add" ? "is-on" : ""}
            onClick={() => {
              setTab("add");
              setEditingId(null);
            }}
          >
            Add new activity
          </button>
          <button type="button" className={tab === "logged" ? "is-on" : ""} onClick={() => setTab("logged")}>
            {entries.length ? `${entries.length} logged` : "Logged"}
          </button>
          <span className="ts-activity-day">{formatLongDay(date)}</span>
        </div>

        {tab === "add" || editing ? (
          <ActivityFields
            key={editing?.id ?? "add"}
            work={work}
            date={date}
            entry={tab === "add" ? undefined : editing ?? undefined}
            personName={personName}
            submitLabel={editing && tab !== "add" ? "Save changes" : "Save Log"}
            onSubmit={(values) => {
              if (editing && tab !== "add") {
                updateTimeEntry(editing.id, {
                  hours: values.hours,
                  note: values.note,
                  billable: values.billable,
                  start: values.start,
                  milestoneId: values.milestoneId || undefined,
                  taskId: values.taskId || undefined,
                  workKind: values.taskId ? (values.subtask ? "subtask" : "task") : values.milestoneId ? "phase" : work.kind,
                });
                setEditingId(null);
                setTab("logged");
                return;
              }
              const id = createTimeEntry({
                userName: user?.name ?? "Staff",
                projectId: work.projectId,
                milestoneId: values.milestoneId || work.milestoneId,
                taskId: values.taskId || work.taskId,
                workKind: values.taskId ? (values.subtask ? "subtask" : "task") : values.milestoneId ? "phase" : work.kind,
                date,
                start: values.start,
                hours: values.hours,
                billable: values.billable,
                note: values.note,
              });
              if (id) {
                setTab("logged");
                setEditingId(null);
              }
            }}
            onCancel={editing && tab !== "add" ? () => setEditingId(null) : undefined}
          />
        ) : null}

        {tab === "logged" && !editing ? (
          <ul className="ts-activity-list">
            {entries.map((entry) => (
              <li key={entry.id} className="ts-activity-row">
                <div>
                  <strong>{entry.note || entry.taskName || entry.milestoneName || entry.projectName}</strong>
                  <p>
                    {entry.start ?? "9:00"} · {entry.billable ? "Client work" : "Internal"}
                    {entry.userName !== user?.name ? ` · ${entry.userName}` : ""}
                  </p>
                </div>
                <span className="tabular-nums font-semibold">{formatClockHours(entry.hours) || "0:00"}</span>
                <StatusPill tone={statusTone(entry.status)}>{entry.status}</StatusPill>
                <div
                  className="ts-more"
                  onMouseEnter={() => setMenuId(entry.id)}
                  onMouseLeave={() => setMenuId((id) => (id === entry.id ? null : id))}
                >
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`More actions for ${entry.note || entry.projectName}`}
                    aria-expanded={menuId === entry.id}
                    onClick={() => setMenuId((id) => (id === entry.id ? null : entry.id))}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {menuId === entry.id ? (
                    <div className="menu-popover ts-more-popover fade-in">
                      {canChange(entry) ? (
                        <button
                          type="button"
                          className="menu-row"
                          onClick={() => {
                            setEditingId(entry.id);
                            setMenuId(null);
                          }}
                        >
                          Edit
                        </button>
                      ) : null}
                      {entry.status === "Draft" && canChange(entry) ? (
                        <button type="button" className="menu-row" onClick={() => { submitTimeEntry(entry.id); setMenuId(null); }}>
                          Submit
                        </button>
                      ) : null}
                      {entry.status === "Submitted" && canApprove ? (
                        <>
                          <button type="button" className="menu-row" onClick={() => { approveTimeEntry(entry.id); setMenuId(null); }}>
                            Approve
                          </button>
                          <button type="button" className="menu-row" onClick={() => { rejectTimeEntry(entry.id); setMenuId(null); }}>
                            Reject
                          </button>
                        </>
                      ) : null}
                      {canChange(entry) ? (
                        <button
                          type="button"
                          className="menu-row is-danger"
                          onClick={() => {
                            setDeleteId(entry.id);
                            setMenuId(null);
                          }}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
            {!entries.length ? <li className="text-sm text-[var(--color-muted)]">No activity on this day yet.</li> : null}
          </ul>
        ) : null}
      </Modal>
      <ConfirmModal
        open={!!deleteId}
        title="Delete time entry"
        body="This removes the activity from the timesheet."
        confirmLabel="Delete"
        danger
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteTimeEntry(deleteId);
          setDeleteId(null);
          setEditingId(null);
          if (entries.length <= 1) setTab("add");
        }}
      />
    </>
  );
}

function ActivityFields({
  work,
  date,
  entry,
  personName,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  work: TimesheetWork;
  date: string;
  entry?: TimeEntry;
  personName: string;
  submitLabel: string;
  onSubmit: (values: {
    hours: number;
    note: string;
    billable: boolean;
    start: string;
    milestoneId: string;
    taskId: string;
    subtask: boolean;
  }) => void;
  onCancel?: () => void;
}) {
  const milestones = useAppStore((s) => s.milestones);
  const tasks = useAppStore((s) => s.tasks);
  const [hours, setHours] = useState(entry ? formatHms(entry.hours) : "01:00:00");
  const [note, setNote] = useState(entry?.note ?? `Time Entry - ${work.projectName}`);
  const [billable, setBillable] = useState(entry?.billable ?? true);
  const [start, setStart] = useState(entry?.start ?? "09:00");
  const [milestoneId, setMilestoneId] = useState(entry?.milestoneId ?? work.milestoneId ?? "");
  const seededTask = tasks.find((item) => item.id === (entry?.taskId ?? work.taskId));
  const [taskId, setTaskId] = useState(seededTask?.parentTaskId ?? seededTask?.id ?? "");
  const [subtaskId, setSubtaskId] = useState(seededTask?.parentTaskId ? seededTask.id : "");
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loggedAt] = useState(() => new Date());
  const phases = useMemo(
    () => milestones.filter((item) => item.projectId === work.projectId && (item.kind === "phase" || !item.parentId)),
    [milestones, work.projectId],
  );
  const parentTasks = useMemo(
    () => tasks.filter((item) => item.projectId === work.projectId && !item.parentTaskId && (!milestoneId || item.milestoneId === milestoneId)),
    [tasks, work.projectId, milestoneId],
  );
  const subtasks = useMemo(() => tasks.filter((item) => item.parentTaskId === taskId), [tasks, taskId]);

  useEffect(() => {
    if (!running || startedAt == null) return;
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [running, startedAt]);

  function applyTimer() {
    const seconds = running && startedAt ? Math.floor((Date.now() - startedAt) / 1000) : elapsed;
    setHours(formatHms(seconds / 3600));
    setRunning(false);
    setStartedAt(null);
  }

  return (
    <form
      className="ts-activity-form"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = parseDurationInput(hours);
        if (parsed <= 0) return;
        onSubmit({
          hours: parsed,
          note,
          billable,
          start,
          milestoneId,
          taskId: subtaskId || taskId,
          subtask: Boolean(subtaskId),
        });
      }}
    >
      <button
        type="button"
        className="ts-worklog-toggle"
        aria-expanded={detailsOpen}
        onClick={() => setDetailsOpen((open) => !open)}
      >
        <ChevronDown size={16} className={detailsOpen ? "" : "ts-rotate"} />
        More worklog details
      </button>
      {detailsOpen ? (
        <div className="ts-activity-grid">
          <Field label="Start">
            <TextInput type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="Class">
            <TextSelect value={billable ? "client" : "internal"} onChange={(e) => setBillable(e.target.value === "client")}>
              <option value="client">Client work</option>
              <option value="internal">Internal</option>
            </TextSelect>
          </Field>
          <Field label="Milestone">
            <TextSelect
              value={milestoneId}
              onChange={(e) => {
                setMilestoneId(e.target.value);
                setTaskId("");
                setSubtaskId("");
              }}
            >
              <option value="">Whole project</option>
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Task">
            <TextSelect
              value={taskId}
              onChange={(e) => {
                setTaskId(e.target.value);
                setSubtaskId("");
              }}
            >
              <option value="">No task</option>
              {parentTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </TextSelect>
          </Field>
          {subtasks.length ? (
            <Field label="Subtask">
              <TextSelect value={subtaskId} onChange={(e) => setSubtaskId(e.target.value)}>
                <option value="">No subtask</option>
                {subtasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
          ) : null}
        </div>
      ) : null}

      <div className="ts-worklog-entry">
        <WorkGlyph kind={work.kind} />
        <div>
          <h3>{note || `Time Entry - ${work.projectName}`}</h3>
          <p>
            Time entry by {personName} on {formatStamp(loggedAt)}
          </p>
        </div>
      </div>
      <Field label="Note">
        <TextTextarea value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>

      <div className="ts-worklog-foot">
        <label className="ts-rounded-time">
          Rounded time
          <input
            className="field-input"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            aria-label="Rounded time"
          />
          <button
            type="button"
            className="ts-rounded-clear"
            aria-label="Clear rounded time"
            onClick={() => setHours("00:00:00")}
          >
            <X size={12} />
          </button>
        </label>
        <div className="ts-worklog-actions">
          {onCancel ? (
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          ) : null}
          <button type="submit" className="btn btn-primary">
            {submitLabel}
          </button>
          <div className="ts-inline-timer">
            <span className="tabular-nums">{formatHms(elapsed / 3600)}</span>
            <button
              type="button"
              className="icon-btn"
              aria-label={running ? "Pause timer" : "Start timer"}
              onClick={() => {
                if (running) {
                  setElapsed(startedAt ? Math.floor((Date.now() - startedAt) / 1000) : elapsed);
                  setRunning(false);
                  setStartedAt(null);
                  return;
                }
                setStartedAt(Date.now() - elapsed * 1000);
                setRunning(true);
              }}
            >
              {running ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button type="button" className="icon-btn" aria-label="Use timer duration" onClick={applyTimer}>
              <Check size={14} />
            </button>
          </div>
        </div>
      </div>
      <p className="sr-only">{date}</p>
    </form>
  );
}
