"use client";

import { useMemo, useState } from "react";
import { Field, Modal, TextInput, TextSelect, TextTextarea } from "@/components/primitives";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export type CreateKind =
  | "company"
  | "contact"
  | "project"
  | "ticket"
  | "task"
  | "expense"
  | "time"
  | "milestone"
  | null;

export function CreateForms({
  kind,
  onClose,
  defaults,
}: {
  kind: CreateKind;
  onClose: () => void;
  defaults?: { companyId?: string; projectId?: string };
}) {
  const { user } = useAuth();
  const companies = useAppStore((s) => s.companies);
  const projects = useAppStore((s) => s.projects);
  const tasks = useAppStore((s) => s.tasks);
  const createCompany = useAppStore((s) => s.createCompany);
  const createContact = useAppStore((s) => s.createContact);
  const createProject = useAppStore((s) => s.createProject);
  const createTicket = useAppStore((s) => s.createTicket);
  const createTask = useAppStore((s) => s.createTask);
  const createTimeEntry = useAppStore((s) => s.createTimeEntry);
  const createMilestone = useAppStore((s) => s.createMilestone);
  const pushToast = useAppStore((s) => s.pushToast);

  const title = useMemo(() => {
    switch (kind) {
      case "company":
        return "New company";
      case "contact":
        return "New contact";
      case "project":
        return "New project";
      case "ticket":
        return "New ticket";
      case "task":
        return "New task";
      case "expense":
        return "New expense";
      case "time":
        return "Log time";
      case "milestone":
        return "New milestone";
      default:
        return "";
    }
  }, [kind]);

  if (!kind) return null;

  return (
    <Modal open={!!kind} title={title} onClose={onClose}>
      {kind === "company" && (
        <CompanyForm
          onSubmit={(v) => {
            createCompany(v);
            onClose();
          }}
        />
      )}
      {kind === "contact" && (
        <ContactForm
          companies={companies}
          defaultCompanyId={defaults?.companyId}
          onSubmit={(v) => {
            createContact(v);
            onClose();
          }}
        />
      )}
      {kind === "project" && (
        <ProjectForm
          companies={companies}
          defaultCompanyId={defaults?.companyId}
          onSubmit={(v) => {
            createProject(v);
            onClose();
          }}
        />
      )}
      {kind === "ticket" && (
        <TicketForm
          companies={companies}
          projects={projects}
          defaultCompanyId={defaults?.companyId}
          onSubmit={(v) => {
            createTicket(v);
            onClose();
          }}
        />
      )}
      {kind === "task" && (
        <TaskForm
          projects={projects}
          defaultProjectId={defaults?.projectId}
          onSubmit={(v) => {
            createTask(v);
            onClose();
          }}
        />
      )}
      {kind === "milestone" && (
        <MilestoneForm
          projectId={defaults?.projectId ?? projects[0]?.id}
          onSubmit={(name, due) => {
            if (!defaults?.projectId && !projects[0]) return;
            createMilestone(defaults?.projectId ?? projects[0].id, name, due);
            onClose();
          }}
        />
      )}
      {kind === "time" && (
        <TimeForm
          projects={projects}
          tasks={tasks}
          userName={user?.name ?? "Staff"}
          defaultProjectId={defaults?.projectId}
          onSubmit={(v) => {
            createTimeEntry(v);
            onClose();
          }}
        />
      )}
      {kind === "expense" && (
        <div>
          <p className="mb-4 text-sm text-[var(--color-muted)]">
            Expense capture saves a draft notification for manager approval in this demo phase.
          </p>
          <Field label="Amount">
            <TextInput type="number" defaultValue={120} />
          </Field>
          <Field label="Project">
            <TextSelect defaultValue={defaults?.projectId ?? projects[0]?.id}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Note">
            <TextTextarea defaultValue="Client travel" />
          </Field>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              pushToast("Expense submitted for approval");
              onClose();
            }}
          >
            Submit expense
          </button>
        </div>
      )}
    </Modal>
  );
}

function CompanyForm({
  onSubmit,
}: {
  onSubmit: (v: {
    name: string;
    status: "Active" | "Prospect" | "Overdue Inv.";
    accountManager: string;
    industry: string;
    billingTerms: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({
          name: name.trim(),
          status: "Prospect",
          accountManager: "M. Doyle",
          industry: "Consulting",
          billingTerms: "Net 30",
        });
      }}
    >
      <Field label="Company name">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Industry">
        <TextInput name="industry" defaultValue="Professional Services" />
      </Field>
      <button type="submit" className="btn btn-primary">
        Create company
      </button>
    </form>
  );
}

function ContactForm({
  companies,
  defaultCompanyId,
  onSubmit,
}: {
  companies: { id: string; name: string }[];
  defaultCompanyId?: string;
  onSubmit: (v: {
    name: string;
    companyId: string;
    companyName: string;
    title: string;
    email: string;
    portal: "Enabled" | "Not Invited";
  }) => void;
}) {
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? companies[0]?.id ?? "");
  const [email, setEmail] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const company = companies.find((c) => c.id === companyId);
        if (!company || !name.trim()) return;
        onSubmit({
          name: name.trim(),
          companyId: company.id,
          companyName: company.name,
          title: "Stakeholder",
          email: email || `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          portal: "Not Invited",
        });
      }}
    >
      <Field label="Full name">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Company">
        <TextSelect value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label="Email">
        <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <button type="submit" className="btn btn-primary">
        Create contact
      </button>
    </form>
  );
}

function ProjectForm({
  companies,
  defaultCompanyId,
  onSubmit,
}: {
  companies: { id: string; name: string }[];
  defaultCompanyId?: string;
  onSubmit: (v: { name: string; companyId: string; manager: string; due: string; budgetHours: number }) => void;
}) {
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? companies[0]?.id ?? "");
  const [due, setDue] = useState("2026-09-30");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), companyId, manager: "M. Doyle", due, budgetHours: 120 });
      }}
    >
      <Field label="Project name">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Company">
        <TextSelect value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label="Due date">
        <TextInput type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </Field>
      <button type="submit" className="btn btn-primary">
        Create project
      </button>
    </form>
  );
}

function TicketForm({
  companies,
  projects,
  defaultCompanyId,
  onSubmit,
}: {
  companies: { id: string; name: string }[];
  projects: { id: string; name: string; companyId: string }[];
  defaultCompanyId?: string;
  onSubmit: (v: {
    subject: string;
    companyId: string;
    priority: "Urgent" | "High" | "Medium" | "Low";
    assignee: string;
    projectId?: string;
  }) => void;
}) {
  const [subject, setSubject] = useState("");
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? companies[0]?.id ?? "");
  const companyProjects = projects.filter((p) => p.companyId === companyId);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!subject.trim()) return;
        onSubmit({
          subject: subject.trim(),
          companyId,
          priority: "Medium",
          assignee: "Unassigned",
          projectId: companyProjects[0]?.id,
        });
      }}
    >
      <Field label="Subject">
        <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} required />
      </Field>
      <Field label="Company">
        <TextSelect value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <button type="submit" className="btn btn-primary">
        Create ticket
      </button>
    </form>
  );
}

function TaskForm({
  projects,
  defaultProjectId,
  onSubmit,
}: {
  projects: { id: string; name: string }[];
  defaultProjectId?: string;
  onSubmit: (v: { name: string; projectId: string; assignee: string; due: string }) => void;
}) {
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId ?? projects[0]?.id ?? "");
  const [due, setDue] = useState("2026-08-20");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), projectId, assignee: "J. Kim", due });
      }}
    >
      <Field label="Task name">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Project">
        <TextSelect value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label="Due date">
        <TextInput type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </Field>
      <button type="submit" className="btn btn-primary">
        Create task
      </button>
    </form>
  );
}

function MilestoneForm({
  projectId,
  onSubmit,
}: {
  projectId?: string;
  onSubmit: (name: string, due: string) => void;
}) {
  const [name, setName] = useState("");
  const [due, setDue] = useState("2026-08-30");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !projectId) return;
        onSubmit(name.trim(), due);
      }}
    >
      <Field label="Milestone name">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Due date">
        <TextInput type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </Field>
      <button type="submit" className="btn btn-primary">
        Add milestone
      </button>
    </form>
  );
}

function TimeForm({
  projects,
  tasks,
  userName,
  defaultProjectId,
  onSubmit,
}: {
  projects: { id: string; name: string }[];
  tasks: { id: string; name: string; projectId: string }[];
  userName: string;
  defaultProjectId?: string;
  onSubmit: (v: {
    userName: string;
    projectId: string;
    taskId?: string;
    date: string;
    hours: number;
    billable: boolean;
    note: string;
  }) => void;
}) {
  const [projectId, setProjectId] = useState(defaultProjectId ?? projects[0]?.id ?? "");
  const [taskId, setTaskId] = useState("");
  const [hours, setHours] = useState("1");
  const [note, setNote] = useState("");
  const [billable, setBillable] = useState(true);
  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          userName,
          projectId,
          taskId: taskId || undefined,
          date: new Date().toISOString().slice(0, 10),
          hours: Number(hours) || 0,
          billable,
          note,
        });
      }}
    >
      <Field label="Project">
        <TextSelect
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value);
            setTaskId("");
          }}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label="Task (optional)">
        <TextSelect value={taskId} onChange={(e) => setTaskId(e.target.value)}>
          <option value="">No task</option>
          {projectTasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label="Hours">
        <TextInput type="number" step="0.25" min="0.25" value={hours} onChange={(e) => setHours(e.target.value)} />
      </Field>
      <Field label="Note">
        <TextTextarea value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <label className="mb-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} />
        Billable
      </label>
      <button type="submit" className="btn btn-primary">
        Save time
      </button>
    </form>
  );
}
