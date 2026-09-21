"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, Star } from "lucide-react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { ActivityList, ActivityStream } from "@/components/records/ActivityStream";
import { RecordFact, RecordMetric, RecordRailBlock, RecordShell, TonePill } from "@/components/records/RecordChrome";
import { Avatar, Field, Modal, ProgressBar, Tabs, TextInput, TextSelect } from "@/components/ui";
import { composeContactFeed } from "@/lib/activity";
import { contactProjects, isPrimaryContact } from "@/lib/contacts";
import { formatDisplayDate } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import type { Contact } from "@/lib/types";
import { useAuth } from "@/lib/auth";

const TABS = ["Overview", "Projects", "Activity", "Notes"];

export function ContactDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const contacts = useAppStore((s) => s.contacts);
  const companies = useAppStore((s) => s.companies);
  const projects = useAppStore((s) => s.projects);
  const activities = useAppStore((s) => s.activities);
  const tasks = useAppStore((s) => s.tasks);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const milestones = useAppStore((s) => s.milestones);
  const trackView = useAppStore((s) => s.trackView);
  const updateContact = useAppStore((s) => s.updateContact);
  const addContactNote = useAppStore((s) => s.addContactNote);
  const setPrimaryContact = useAppStore((s) => s.setPrimaryContact);
  const linkContactProject = useAppStore((s) => s.linkContactProject);
  const unlinkContactProject = useAppStore((s) => s.unlinkContactProject);
  const [tab, setTab] = useState("Overview");
  const [editOpen, setEditOpen] = useState(false);
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [note, setNote] = useState("");
  const [linkId, setLinkId] = useState("");

  const contact = contacts.find((c) => c.id === id);
  const company = companies.find((c) => c.id === contact?.companyId);
  const primary = contact ? isPrimaryContact(contact, company) : false;
  const linked = useMemo(
    () => (contact ? contactProjects(contact, projects) : []),
    [contact, projects],
  );
  const companyProjects = useMemo(
    () => projects.filter((p) => p.companyId === contact?.companyId),
    [projects, contact?.companyId],
  );
  const availableProjects = companyProjects.filter((p) => !linked.some((l) => l.id === p.id));
  const feed = useMemo(
    () =>
      contact
        ? composeContactFeed({
            contact,
            activities,
            projects,
            tasks,
            timeEntries,
            milestones,
            company,
          })
        : [],
    [contact, activities, projects, tasks, timeEntries, milestones, company],
  );

  useEffect(() => {
    if (!contact) return;
    trackView("contact", contact.id, contact.name);
  }, [contact, trackView]);

  if (!contact) {
    return (
      <div className="fade-in panel p-6">
        <p className="font-semibold text-[var(--color-navy)]">Contact not found</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">This record is not in the current session.</p>
        <Link href="/app/contacts" className="btn btn-primary mt-4">
          Back to contacts
        </Link>
      </div>
    );
  }

  return (
    <>
      <RecordShell
        breadcrumb={
          <>
            <Link href="/app/contacts">Contacts</Link> / {contact.name}
          </>
        }
        title={contact.name}
        subtitle={
          <>
            {primary ? <TonePill value="Primary" /> : null}
            <TonePill value={contact.portal} />
            <span>{contact.title}</span>
            {company ? (
              <Link href={`/app/companies/view/?id=${company.id}`} className="font-semibold text-[var(--color-navy)]">
                {company.name}
              </Link>
            ) : (
              <span>{contact.companyName}</span>
            )}
          </>
        }
        actions={
          <>
            <a className="btn btn-ghost" href={`mailto:${contact.email}`}>
              <Mail size={16} /> Email
            </a>
            {contact.phone ? (
              <a className="btn btn-ghost" href={`tel:${contact.phone.replace(/\s+/g, "")}`}>
                <Phone size={16} /> Call
              </a>
            ) : null}
            <button type="button" className="btn btn-ghost" onClick={() => setEditOpen(true)}>
              Edit
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              aria-pressed={primary}
              onClick={() => setPrimaryContact(contact.id)}
            >
              <Star size={16} fill={primary ? "currentColor" : "none"} />
              {primary ? "Primary" : "Make primary"}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setCreateKind("project")}>
              New project
            </button>
          </>
        }
        rail={
          <>
            <RecordRailBlock title="Contact details">
              <dl className="space-y-2">
                <RecordFact label="Company">
                  {company ? (
                    <Link href={`/app/companies/view/?id=${company.id}`} className="font-semibold text-[var(--color-navy)]">
                      {company.name}
                    </Link>
                  ) : (
                    contact.companyName
                  )}
                </RecordFact>
                <RecordFact label="Role / title">{contact.title}</RecordFact>
                <RecordFact label="Email">
                  <a href={`mailto:${contact.email}`} className="text-[var(--color-navy)]">
                    {contact.email}
                  </a>
                </RecordFact>
                <RecordFact label="Phone">
                  {contact.phone ? (
                    <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="text-[var(--color-navy)]">
                      {contact.phone}
                    </a>
                  ) : (
                    "None"
                  )}
                </RecordFact>
                {contact.mobile ? (
                  <RecordFact label="Mobile">
                    <a href={`tel:${contact.mobile.replace(/\s+/g, "")}`} className="text-[var(--color-navy)]">
                      {contact.mobile}
                    </a>
                  </RecordFact>
                ) : null}
                {contact.category ? <RecordFact label="Category">{contact.category}</RecordFact> : null}
                {contact.pronouns ? <RecordFact label="Pronouns">{contact.pronouns}</RecordFact> : null}
                <RecordFact label="Portal">{contact.portal}</RecordFact>
                <RecordFact label="Last interaction">{contact.lastInteraction}</RecordFact>
              </dl>
            </RecordRailBlock>
            <RecordRailBlock title="Notes">
              <textarea
                className="field-input min-h-16"
                placeholder="Add a contact note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary mt-2 w-full"
                disabled={!note.trim()}
                onClick={() => {
                  addContactNote(contact.id, note.trim(), user?.name);
                  setNote("");
                }}
              >
                Save note
              </button>
            </RecordRailBlock>
          </>
        }
      >
        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "Overview" ? (
          <div className="contact-overview">
            <div className="panel p-4">
              <h2 className="section-title">Summary</h2>
              <p className="text-sm text-[var(--color-muted)]">
                {contact.notes || "Add a summary from Edit to describe this contact's role."}
              </p>
            </div>
            <div className="company-stat-grid">
              <RecordMetric label="Projects" value={String(linked.length)} hint={company ? company.name : "Company work"} />
              <RecordMetric label="Activity" value={String(feed.length)} hint="Comments, time, and delivery" />
              <RecordMetric label="Portal" value={contact.portal} hint={primary ? "Primary contact" : "Company contact"} />
              <RecordMetric label="Notes" value={String(contact.noteItems?.length ?? 0)} hint="Saved on this record" />
            </div>
            <div className="company-split">
              <div className="panel p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="section-title">Associated projects</h2>
                  <button type="button" className="text-sm font-semibold text-[var(--color-navy)]" onClick={() => setTab("Projects")}>
                    See all
                  </button>
                </div>
                <ul className="space-y-2 text-sm">
                  {linked.slice(0, 4).map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3">
                      <Link href={`/app/projects/view/?id=${p.id}`} className="font-medium text-[var(--color-navy)]">
                        {p.name}
                      </Link>
                      <TonePill value={p.status} />
                    </li>
                  ))}
                  {!linked.length ? <li className="text-[var(--color-muted)]">No projects linked yet.</li> : null}
                </ul>
              </div>
              <div className="panel p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="section-title">Recent activity</h2>
                  <button type="button" className="text-sm font-semibold text-[var(--color-navy)]" onClick={() => setTab("Activity")}>
                    Open stream
                  </button>
                </div>
                <ActivityList items={feed.slice(0, 5)} compact />
              </div>
            </div>
          </div>
        ) : null}

        {tab === "Projects" ? (
          <div className="panel overflow-hidden">
            <div className="flex flex-wrap justify-end gap-2 p-3">
              {availableProjects.length ? (
                <>
                  <select className="field-input max-w-64" value={linkId} onChange={(e) => setLinkId(e.target.value)}>
                    <option value="">Link a company project</option>
                    {availableProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={!linkId}
                    onClick={() => {
                      linkContactProject(contact.id, linkId);
                      setLinkId("");
                    }}
                  >
                    Link
                  </button>
                </>
              ) : null}
              <button type="button" className="btn btn-primary" onClick={() => setCreateKind("project")}>
                New project
              </button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Due</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {linked.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/app/projects/view/?id=${p.id}`} className="font-medium text-[var(--color-navy)]">
                        {p.name}
                      </Link>
                      <div className="text-xs text-[var(--color-muted)]">{p.projectType}</div>
                    </td>
                    <td>
                      <TonePill value={p.status} />
                    </td>
                    <td>
                      <ProgressBar value={p.progress} />
                    </td>
                    <td>{formatDisplayDate(p.due)}</td>
                    <td className="text-right">
                      <button type="button" className="btn btn-ghost text-sm" onClick={() => unlinkContactProject(contact.id, p.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {!linked.length ? (
                  <tr>
                    <td colSpan={5} className="text-[var(--color-muted)]">
                      No projects associated with this contact.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === "Activity" ? (
          <div className="panel p-4">
            <ActivityStream
              items={feed}
              placeholder="Comment on this contact"
              onPost={(text) => addContactNote(contact.id, text, user?.name)}
            />
          </div>
        ) : null}

        {tab === "Notes" ? (
          <div className="panel p-4 space-y-3">
            <div className="flex gap-2">
              <textarea
                className="field-input min-h-16"
                placeholder="Add a contact note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary self-end"
                disabled={!note.trim()}
                onClick={() => {
                  addContactNote(contact.id, note.trim(), user?.name);
                  setNote("");
                }}
              >
                Save
              </button>
            </div>
            {(contact.noteItems ?? []).map((item) => (
              <div key={item.id} className="border-b border-[var(--color-border)] pb-3 text-sm">
                <div className="text-xs text-[var(--color-muted)]">
                  {item.author} · {item.createdAt}
                </div>
                <div>{item.body}</div>
              </div>
            ))}
            {!contact.noteItems?.length ? <p className="text-sm text-[var(--color-muted)]">No notes yet.</p> : null}
          </div>
        ) : null}
      </RecordShell>

      <CreateForms
        kind={createKind}
        defaults={{ companyId: contact.companyId, projectId: linked[0]?.id }}
        onClose={() => setCreateKind(null)}
      />

      <Modal open={editOpen} title="Edit contact" onClose={() => setEditOpen(false)}>
        <ContactEditForm
          contact={contact}
          companies={companies}
          primary={primary}
          onSubmit={(patch) => {
            updateContact(contact.id, patch);
            setEditOpen(false);
          }}
        />
      </Modal>
    </>
  );
}

function ContactEditForm({
  contact,
  companies,
  primary: initialPrimary,
  onSubmit,
}: {
  contact: Contact;
  companies: { id: string; name: string }[];
  primary: boolean;
  onSubmit: (patch: Partial<Contact> & { primary?: boolean }) => void;
}) {
  const [name, setName] = useState(contact.name);
  const [companyId, setCompanyId] = useState(contact.companyId);
  const [title, setTitle] = useState(contact.title);
  const [email, setEmail] = useState(contact.email);
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [portal, setPortal] = useState(contact.portal);
  const [primary, setPrimary] = useState(initialPrimary);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const nextCompany = companies.find((c) => c.id === companyId);
        onSubmit({
          name: name.trim() || contact.name,
          companyId,
          companyName: nextCompany?.name ?? contact.companyName,
          title: title.trim() || contact.title,
          email: email.trim() || contact.email,
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
        <TextInput name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Email">
        <TextInput name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Phone">
        <TextInput name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <Field label="Portal">
        <TextSelect value={portal} onChange={(e) => setPortal(e.target.value as Contact["portal"])}>
          <option value="Enabled">Enabled</option>
          <option value="Not Invited">Not Invited</option>
        </TextSelect>
      </Field>
      <Field label="Summary">
        <textarea className="field-input min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} />
        Primary contact
      </label>
      <button type="submit" className="btn btn-primary">
        Save changes
      </button>
    </form>
  );
}
