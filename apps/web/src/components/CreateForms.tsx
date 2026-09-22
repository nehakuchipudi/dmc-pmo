"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyCreateForm } from "@/components/CompanyCreateForm";
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
  | "idea"
  | "risk"
  | null;

export function CreateForms({
  kind,
  onClose,
  defaults,
}: {
  kind: CreateKind;
  onClose: () => void;
  defaults?: { companyId?: string; projectId?: string; hours?: number; date?: string; start?: string };
}) {
  const { user } = useAuth();
  const companies = useAppStore((s) => s.companies);
  const projects = useAppStore((s) => s.projects);
  const tasks = useAppStore((s) => s.tasks);
  const router = useRouter();
  const createCompany = useAppStore((s) => s.createCompany);
  const createContact = useAppStore((s) => s.createContact);
  const updateContact = useAppStore((s) => s.updateContact);
  const createProject = useAppStore((s) => s.createProject);
  const createTicket = useAppStore((s) => s.createTicket);
  const createTask = useAppStore((s) => s.createTask);
  const createTimeEntry = useAppStore((s) => s.createTimeEntry);
  const createMilestone = useAppStore((s) => s.createMilestone);
  const createExpense = useAppStore((s) => s.createExpense);
  const createIdea = useAppStore((s) => s.createIdea);
  const createRisk = useAppStore((s) => s.createRisk);
  const objectives = useAppStore((s) => s.objectives);

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
      case "idea":
        return "New idea";
      case "risk":
        return "Log risk";
      default:
        return "";
    }
  }, [kind]);

  if (!kind) return null;

  return (
    <Modal open={!!kind} title={title} onClose={onClose} xl={kind === "company"}>
      {kind === "company" && (
        <CompanyCreateForm
          onCancel={onClose}
          onSubmit={(payload) => {
            const id = createCompany(payload.company);
            payload.newContacts.forEach((contact) => {
              createContact({
                ...contact,
                companyId: id,
                companyName: payload.company.name,
              });
            });
            payload.linkedContactIds.forEach((contactId) => {
              updateContact(contactId, { companyId: id, companyName: payload.company.name });
            });
            onClose();
            router.push(`/app/companies/view/?id=${id}`);
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
          defaultHours={defaults?.hours}
          defaultDate={defaults?.date}
          defaultStart={defaults?.start}
          onSubmit={(v) => {
            createTimeEntry(v);
            onClose();
          }}
        />
      )}
      {kind === "expense" && (
        <ExpenseForm
          projects={projects}
          defaultProjectId={defaults?.projectId}
          onSubmit={(v) => {
            createExpense(v);
            onClose();
          }}
        />
      )}
      {kind === "idea" && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            createIdea({
              name: String(data.get("name") ?? ""),
              summary: String(data.get("summary") ?? ""),
              submitter: user?.name ?? "Staff",
              requestedBudget: Number(data.get("budget") ?? 0),
              companyId: String(data.get("companyId") || "") || undefined,
              objectiveId: String(data.get("objectiveId") || "") || undefined,
            });
            onClose();
          }}
        >
          <Field label="Name">
            <TextInput name="name" required />
          </Field>
          <Field label="Company">
            <TextSelect name="companyId" defaultValue="">
              <option value="">Internal / unassigned</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Objective">
            <TextSelect name="objectiveId" defaultValue="">
              <option value="">None yet</option>
              {objectives.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} {o.name}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Requested budget">
            <TextInput name="budget" type="number" defaultValue={25000} />
          </Field>
          <Field label="Summary">
            <TextTextarea name="summary" />
          </Field>
          <button type="submit" className="btn btn-primary">
            Submit idea
          </button>
        </form>
      )}
      {kind === "risk" && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            createRisk({
              title: String(data.get("title") ?? ""),
              owner: user?.name ?? "PMO",
              projectId: String(data.get("projectId") || "") || undefined,
              probability: String(data.get("probability") ?? "Medium") as "Low" | "Medium" | "High" | "Critical",
              impact: String(data.get("impact") ?? "High") as "Low" | "Medium" | "High" | "Critical",
              mitigation: String(data.get("mitigation") ?? ""),
              due: String(data.get("due") ?? new Date().toISOString().slice(0, 10)),
            });
            onClose();
          }}
        >
          <Field label="Title">
            <TextInput name="title" required />
          </Field>
          <Field label="Project">
            <TextSelect name="projectId" defaultValue={projects[0]?.id}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Probability">
            <TextSelect name="probability" defaultValue="Medium">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </TextSelect>
          </Field>
          <Field label="Impact">
            <TextSelect name="impact" defaultValue="High">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </TextSelect>
          </Field>
          <Field label="Due">
            <TextInput name="due" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="Mitigation">
            <TextTextarea name="mitigation" />
          </Field>
          <button type="submit" className="btn btn-primary">
            Save risk
          </button>
        </form>
      )}
    </Modal>
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
    phone?: string;
    notes?: string;
    portal: "Enabled" | "Not Invited";
    primary?: boolean;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? companies[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [portal, setPortal] = useState<"Enabled" | "Not Invited">("Not Invited");
  const [primary, setPrimary] = useState(false);
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
          title: title.trim() || "Stakeholder",
          email: email || `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          phone: phone.trim(),
          notes: notes.trim(),
          portal,
          primary,
        });
      }}
    >
      <Field label="Full name">
        <TextInput name="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Company">
        <TextSelect name="companyId" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label="Role / title">
        <TextInput name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VP Operations" />
      </Field>
      <Field label="Email">
        <TextInput name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Phone">
        <TextInput name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 503 555 0100" />
      </Field>
      <Field label="Portal">
        <TextSelect value={portal} onChange={(e) => setPortal(e.target.value as "Enabled" | "Not Invited")}>
          <option value="Not Invited">Not Invited</option>
          <option value="Enabled">Enabled</option>
        </TextSelect>
      </Field>
      <Field label="Notes">
        <textarea className="field-input min-h-16" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} />
        Set as primary contact
      </label>
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

function ExpenseForm({
  projects,
  defaultProjectId,
  onSubmit,
}: {
  projects: { id: string; name: string }[];
  defaultProjectId?: string;
  onSubmit: (v: { vendor: string; projectId: string; amount: number; note: string }) => void;
}) {
  const [vendor, setVendor] = useState("Vendor");
  const [projectId, setProjectId] = useState(defaultProjectId ?? projects[0]?.id ?? "");
  const [amount, setAmount] = useState("120");
  const [note, setNote] = useState("Client travel");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          vendor: vendor.trim() || "Vendor",
          projectId,
          amount: Number(amount) || 0,
          note,
        });
      }}
    >
      <Field label="Vendor">
        <TextInput value={vendor} onChange={(e) => setVendor(e.target.value)} required />
      </Field>
      <Field label="Amount">
        <TextInput type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
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
      <Field label="Note">
        <TextTextarea value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <button type="submit" className="btn btn-primary">
        Submit expense
      </button>
    </form>
  );
}

function TimeForm({
  projects,
  tasks,
  userName,
  defaultProjectId,
  defaultHours,
  defaultDate,
  defaultStart,
  onSubmit,
}: {
  projects: { id: string; name: string }[];
  tasks: { id: string; name: string; projectId: string }[];
  userName: string;
  defaultProjectId?: string;
  defaultHours?: number;
  defaultDate?: string;
  defaultStart?: string;
  onSubmit: (v: {
    userName: string;
    projectId: string;
    taskId?: string;
    date: string;
    start?: string;
    hours: number;
    billable: boolean;
    note: string;
  }) => void;
}) {
  const [projectId, setProjectId] = useState(defaultProjectId ?? projects[0]?.id ?? "");
  const [taskId, setTaskId] = useState("");
  const [date, setDate] = useState(defaultDate || new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState(defaultStart || "09:00");
  const [hours, setHours] = useState(String(defaultHours && defaultHours > 0 ? defaultHours : 1));
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
          date,
          start,
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
      <Field label="Date">
        <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Start">
        <TextInput type="time" value={start} onChange={(e) => setStart(e.target.value)} />
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
