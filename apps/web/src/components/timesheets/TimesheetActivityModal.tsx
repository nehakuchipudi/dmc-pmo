"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { ConfirmModal, Field, Modal, StatusPill, TextInput, TextSelect, TextTextarea, statusTone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/lib/store";
import type { TimeEntry } from "@/lib/types";
import { formatClockHours, formatLongDay, parseHoursInput } from "@/lib/timesheet";
import { type TimesheetWork } from "@/lib/timesheet-work";

export function TimesheetActivityModal({
  work,
  date,
  entries,
  startOnAdd,
  onClose,
}: {
  work: TimesheetWork;
  date: string;
  entries: TimeEntry[];
  startOnAdd?: boolean;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const editing = entries.find((item) => item.id === editingId) ?? null;
  const canApprove = can("approve_time");

  function canChange(entry: TimeEntry) {
    if (!user) return false;
    const own = entry.userName === user.name || entry.userName === "J. Kim";
    if (user.role === "staff" && !own) return false;
    if (entry.status === "Approved" && !canApprove) return false;
    return true;
  }

  return (
    <>
      <Modal open title={work.label} onClose={onClose} wide>
        <p className="ts-activity-sub">
          {work.detail} · {formatLongDay(date)}
        </p>
        <div className="ts-activity-tabs">
          <button type="button" className={tab === "add" ? "is-on" : ""} onClick={() => { setTab("add"); setEditingId(null); }}>
            Add activity
          </button>
          <button type="button" className={tab === "logged" ? "is-on" : ""} onClick={() => setTab("logged")}>
            {entries.length} logged
          </button>
        </div>

        {tab === "add" && !editing ? (
          <ActivityFields
            key="add"
            work={work}
            date={date}
            submitLabel="Save"
            onSubmit={(values) => {
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
                setMenuId(null);
              }
            }}
          />
        ) : null}

        {tab === "logged" ? (
          <ul className="ts-activity-list">
            {entries.map((entry) =>
              editing?.id === entry.id ? (
                <li key={entry.id} className="ts-activity-edit">
                  <ActivityFields
                    work={work}
                    date={entry.date}
                    entry={entry}
                    submitLabel="Save changes"
                    onSubmit={(values) => {
                      updateTimeEntry(entry.id, {
                        hours: values.hours,
                        note: values.note,
                        billable: values.billable,
                        start: values.start,
                        milestoneId: values.milestoneId || undefined,
                        taskId: values.taskId || undefined,
                        workKind: values.taskId ? (values.subtask ? "subtask" : "task") : values.milestoneId ? "phase" : "project",
                      });
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </li>
              ) : (
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
              ),
            )}
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
  submitLabel,
  onSubmit,
  onCancel,
}: {
  work: TimesheetWork;
  date: string;
  entry?: TimeEntry;
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
  const [hours, setHours] = useState(entry ? formatClockHours(entry.hours) || "1:00" : "1:00");
  const [note, setNote] = useState(entry?.note ?? "");
  const [billable, setBillable] = useState(entry?.billable ?? true);
  const [start, setStart] = useState(entry?.start ?? "09:00");
  const [milestoneId, setMilestoneId] = useState(entry?.milestoneId ?? work.milestoneId ?? "");
  const seededTask = tasks.find((item) => item.id === (entry?.taskId ?? work.taskId));
  const [taskId, setTaskId] = useState(seededTask?.parentTaskId ?? seededTask?.id ?? "");
  const [subtaskId, setSubtaskId] = useState(seededTask?.parentTaskId ? seededTask.id : "");
  const phases = useMemo(
    () => milestones.filter((item) => item.projectId === work.projectId && item.kind === "phase"),
    [milestones, work.projectId],
  );
  const parentTasks = useMemo(
    () => tasks.filter((item) => item.projectId === work.projectId && !item.parentTaskId && (!milestoneId || item.milestoneId === milestoneId)),
    [tasks, work.projectId, milestoneId],
  );
  const subtasks = useMemo(() => tasks.filter((item) => item.parentTaskId === taskId), [tasks, taskId]);

  return (
    <form
      className="ts-activity-form"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = parseHoursInput(hours);
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
      <div className="ts-activity-grid">
        <Field label="Hours">
          <TextInput value={hours} onChange={(e) => setHours(e.target.value)} placeholder="1:00" aria-label="Hours" />
        </Field>
        <Field label="Start">
          <TextInput type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Class">
          <TextSelect value={billable ? "client" : "internal"} onChange={(e) => setBillable(e.target.value === "client")}>
            <option value="client">Client work</option>
            <option value="internal">Internal</option>
          </TextSelect>
        </Field>
      </div>
      <Field label="Phase (optional)">
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
      <Field label="Task (optional)">
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
        <Field label="Subtask (optional)">
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
      <Field label="Note">
        <TextTextarea value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className="ts-activity-save">
        {onCancel ? (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
      <p className="sr-only">{date}</p>
    </form>
  );
}
