"use client";

import { useMemo, useState, startTransition } from "react";
import { Folder, MoreHorizontal, Plus, Upload } from "lucide-react";
import type { ProjectFile, ProjectNote, Task } from "@/lib/types";

const DEFAULT_FOLDERS = ["General", "Reports", "Presentations", "Images"];

export function FilesNotesPanel({
  files,
  notes,
  tasks = [],
  onUpload,
  onAddNote,
  onDeleteFile,
  onMoveFile,
  onLinkFileToTask,
  author,
}: {
  files: ProjectFile[];
  notes: ProjectNote[];
  tasks?: Task[];
  onUpload: (file: Omit<ProjectFile, "id">) => void;
  onAddNote: (body: string, visibility: "internal" | "client") => void;
  onDeleteFile?: (fileId: string) => void;
  onMoveFile?: (fileId: string, folder: string) => void;
  onLinkFileToTask?: (fileId: string, taskId: string) => void;
  author: string;
}) {
  const [tab, setTab] = useState<"Files" | "Notes">("Files");
  const [folder, setFolder] = useState("General");
  const [folders, setFolders] = useState<string[]>(() =>
    Array.from(new Set([...DEFAULT_FOLDERS, ...files.map((f) => f.folder)])),
  );
  const [search, setSearch] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [visibility, setVisibility] = useState<"internal" | "client">("internal");
  const [newFolder, setNewFolder] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);

  const allFolders = useMemo(() => {
    return Array.from(new Set([...folders, ...files.map((f) => f.folder)]));
  }, [files, folders]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files.filter(
      (f) =>
        f.folder === folder &&
        (!q || f.name.toLowerCase().includes(q) || f.folder.toLowerCase().includes(q)),
    );
  }, [files, folder, search]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    allFolders.forEach((f) => map.set(f, 0));
    files.forEach((f) => map.set(f.folder, (map.get(f.folder) ?? 0) + 1));
    return map;
  }, [files, allFolders]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-white p-1">
          {(["Files", "Notes"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                tab === t ? "bg-[var(--color-navy)] text-white" : "text-[var(--color-muted)]"
              }`}
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
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                onUpload({
                  folder,
                  name: `Upload_${files.length + 1}.pdf`,
                  kind: "pdf",
                  sizeKb: 120 + files.length * 8,
                  linkedTaskIds: [],
                })
              }
            >
              <Upload size={15} /> Upload
            </button>
          </div>
        ) : null}
      </div>

      {tab === "Files" ? (
        <div className="files-layout">
          <aside className="files-rail">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Folders
            </div>
            {allFolders.map((name) => (
              <button
                key={name}
                type="button"
                className={folder === name ? "active" : ""}
                onClick={() => setFolder(name)}
              >
                <span className="inline-flex items-center gap-2">
                  <Folder size={14} /> {name}
                </span>
                <span className="text-xs text-[var(--color-muted)]">{counts.get(name) ?? 0}</span>
              </button>
            ))}
            <div className="mt-3 border-t border-[var(--color-border)] pt-3">
              <input
                className="field-input mb-2 text-sm"
                placeholder="New folder"
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-ghost w-full justify-center text-sm"
                onClick={() => {
                  const name = newFolder.trim();
                  if (!name || allFolders.includes(name)) return;
                  setFolders((f) => [...f, name]);
                  setFolder(name);
                  setNewFolder("");
                }}
              >
                <Plus size={14} /> Add folder
              </button>
            </div>
          </aside>
          <div className="files-main">
            <div className="files-row text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              <span />
              <span>Name</span>
              <span>Type</span>
              <span>Linked tasks</span>
              <span>Size</span>
              <span />
            </div>
            {rows.map((f) => {
              const linked = (f.linkedTaskIds ?? [])
                .map((id) => tasks.find((t) => t.id === id)?.name)
                .filter(Boolean);
              return (
                <div key={f.id} className="files-row">
                  <span className={`file-kind file-kind-${f.kind}`}>{f.kind.slice(0, 3).toUpperCase()}</span>
                  <span className="truncate font-medium">{f.name}</span>
                  <span className="text-sm text-[var(--color-muted)]">{f.kind.toUpperCase()}</span>
                  <span className="truncate text-xs text-[var(--color-muted)]">
                    {linked.length ? linked.join(", ") : "-"}
                  </span>
                  <span className="text-sm tabular-nums text-[var(--color-muted)]">{f.sizeKb} KB</span>
                  <div className="relative justify-self-end">
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ width: 32, height: 32 }}
                      aria-label="File actions"
                      onClick={() => setMenuId(menuId === f.id ? null : f.id)}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {menuId === f.id ? (
                      <div className="row-menu">
                        {onMoveFile
                          ? allFolders
                              .filter((name) => name !== f.folder)
                              .map((name) => (
                                <button
                                  key={name}
                                  type="button"
                                  onClick={() => {
                                    onMoveFile(f.id, name);
                                    setMenuId(null);
                                  }}
                                >
                                  Move to {name}
                                </button>
                              ))
                          : null}
                        {onLinkFileToTask && tasks.length
                          ? tasks.slice(0, 6).map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  onLinkFileToTask(f.id, t.id);
                                  setMenuId(null);
                                }}
                              >
                                Link: {t.name}
                              </button>
                            ))
                          : null}
                        {onDeleteFile ? (
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteFile(f.id);
                              setMenuId(null);
                            }}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {!rows.length ? (
              <p className="p-6 text-sm text-[var(--color-muted)]">This folder is empty. Upload a file to get started.</p>
            ) : null}
          </div>
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
