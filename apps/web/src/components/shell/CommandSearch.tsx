"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { clsx } from "clsx";
import { Modal } from "@/components/ui";

export type SearchHit = { href: string; label: string; type: string };

export function CommandSearch({
  open,
  query,
  hits,
  recent,
  onQuery,
  onClose,
  onOpen,
}: {
  open: boolean;
  query: string;
  hits: SearchHit[];
  recent: SearchHit[];
  onQuery: (value: string) => void;
  onClose: () => void;
  onOpen: (href: string) => void;
}) {
  const rows = query.trim() ? hits : recent;
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  const bounded = useMemo(() => Math.min(active, Math.max(rows.length - 1, 0)), [active, rows.length]);

  return (
    <Modal open={open} title="Search" onClose={onClose} wide>
      <div className="command-search">
        <label className="command-search-field">
          <Search size={16} />
          <input
            className="command-search-input"
            autoFocus
            placeholder="Search companies, projects, tickets, people..."
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, rows.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              }
              if (e.key === "Enter" && rows[bounded]) {
                e.preventDefault();
                onOpen(rows[bounded].href);
              }
            }}
          />
          <kbd>esc</kbd>
        </label>
        <div className="command-search-hint">
          {query.trim() ? `${hits.length} matches` : "Recent records"}
        </div>
        <div className="command-search-list">
          {rows.map((hit, i) => (
            <button
              key={`${hit.type}-${hit.href}-${hit.label}`}
              type="button"
              className={clsx("command-search-row", i === bounded && "is-active")}
              onMouseEnter={() => setActive(i)}
              onClick={() => onOpen(hit.href)}
            >
              <span className="command-search-type">{hit.type}</span>
              <span className="command-search-label">{hit.label}</span>
            </button>
          ))}
          {query.trim() && !hits.length ? <p className="empty-row">No matches for that search.</p> : null}
          {!query.trim() && !recent.length ? <p className="empty-row">Start typing to search the workspace.</p> : null}
        </div>
      </div>
    </Modal>
  );
}
