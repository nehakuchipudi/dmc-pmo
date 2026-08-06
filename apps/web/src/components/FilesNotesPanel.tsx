"use client";

import { useMemo, useState, startTransition } from "react";
import type { ProjectFile, ProjectNote } from "@/lib/types";

const DEFAULT_FOLDERS = ["General", "Reports", "Presentations", "Images"];

export function FilesNotesPanel({
  files,
  notes,
  onUpload,
  onAddNote,
  onDeleteFile,
  onMoveFile,
  author,
}: {
  files: ProjectFile[];
  notes: ProjectNote[];
  onUpload: (file: Omit<ProjectFile, "id">) => void;
  onAddNote: (body: string, visibility: "internal" | "client") => void;
  onDeleteFile?: (fileId: string) => void;
  onMoveFile?: (fileId: string, folder: string) => void;
  author: string;
}) {
  const [tab, setTab] = useState<"Files" | "Notes">("Files");
  const [folder, setFolder] = useState("General");
  const [folders, setFolders] = useState<string[]>(() => {
    const fromFiles = files.map((f) => f.folder);
    return Array.from(new Set([...DEFAULT_FOLDERS, ...fromFiles]));
  });
  const [search, setSearch] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [visibility, setVisibility] = useState<"internal" | "client">("internal");
  const [newFolder, setNewFolder] = useState("");

  const allFolders = useMemo(() => {
    const fromFiles = files.map((f) => f.folder);
    return Array.from(new Set([...folders, ...fromFiles]));
  }, [files, folders]);

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, ProjectFile[]>();
    allFolders.forEach((f) => map.set(f, []));
    files
      .filter((f) => !q || f.name.toLowerCase().includes(q) || f.folder.toLowerCase().includes(q))
      .forEach((f) => {
        const list = map.get(f.folder) ?? [];
        list.push(f);
        map.set(f.folder, list);
      });
    return map;
  }, [files, search, allFolders]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-white p-1">
          {(["Files", "Notes"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${tab === t ? "bg-[var(--color-ink)] text-white" : "text-[var(--color-muted)]"}`}
              onClick={() => startTransition(() => setTab(t))}
            >
              {t} ({t === "Files" ? files.length : notes.length})
            </button>
          ))}
        </div>
        {tab === "Files" ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="field-input w-48"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="field-input w-auto" value={folder} onChange={(e) => setFolder(e.target.value)}>
              {allFolders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                onUpload({
                  folder,
                  name: `Upload_${files.length + 1}.pdf`,
                  kind: "pdf",
                  sizeKb: 120 + files.length * 8,
                })
              }
            >
              Upload
            </button>
          </div>
        ) : null}
      </div>

      {tab === "Files" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-[var(--color-border)] bg-white p-3">
            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                New folder
              </label>
              <input
                className="field-input"
                placeholder="e.g. Contracts"
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                const name = newFolder.trim();
                if (!name || allFolders.includes(name)) return;
                setFolders((f) => [...f, name]);
                setFolder(name);
                setNewFolder("");
              }}
            >
              + Add folder
            </button>
          </div>

          {[...grouped.entries()].map(([name, items]) => (
            <div key={name}>
              <div className="mb-2 text-sm font-semibold text-[var(--color-ink)]">
                {name} <span className="text-[var(--color-muted)]">{items.length}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((f) => (
                  <div key={f.id} className="rounded-xl border border-[var(--color-border)] bg-white p-3">
                    <div className={`file-kind file-kind-${f.kind}`}>{f.kind.toUpperCase()}</div>
                    <div className="mt-2 font-medium">{f.name}</div>
                    <div className="mt-1 text-xs text-[var(--color-muted)]">
                      {f.folder} · {f.sizeKb} KB
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {onMoveFile ? (
                        <select
                          className="field-input w-auto text-xs"
                          value={f.folder}
                          onChange={(e) => onMoveFile(f.id, e.target.value)}
                          aria-label={`Move ${f.name}`}
                        >
                          {allFolders.map((folderName) => (
                            <option key={folderName} value={folderName}>
                              Move to {folderName}
                            </option>
                          ))}
                        </select>
                      ) : null}
                      {onDeleteFile ? (
                        <button
                          type="button"
                          className="btn btn-ghost text-xs text-[var(--color-danger)]"
                          onClick={() => onDeleteFile(f.id)}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
                {!items.length ? <p className="text-sm text-[var(--color-muted)]">Empty folder</p> : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-3">
            {notes.map((n) => (
              <div key={n.id} className="rounded-xl border border-[var(--color-border)] bg-white p-3">
                <div className="mb-1 flex justify-between gap-2 text-xs text-[var(--color-muted)]">
                  <span>
                    {n.author} · {n.visibility}
                  </span>
                  <span>{n.createdAt}</span>
                </div>
                <p className="text-sm">{n.body}</p>
              </div>
            ))}
            {!notes.length ? <p className="text-sm text-[var(--color-muted)]">No notes yet.</p> : null}
          </div>
          <div className="panel p-4">
            <div className="mb-2 text-sm font-semibold">Add note</div>
            <textarea
              className="field-input mb-2 min-h-28"
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Write a note..."
            />
            <select
              className="field-input mb-3"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as "internal" | "client")}
            >
              <option value="internal">Internal</option>
              <option value="client">Client-visible</option>
            </select>
            <button
              type="button"
              className="btn btn-primary w-full justify-center"
              onClick={() => {
                if (!noteBody.trim()) return;
                onAddNote(noteBody.trim(), visibility);
                setNoteBody("");
              }}
            >
              Save note as {author.split(" ")[0]}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
