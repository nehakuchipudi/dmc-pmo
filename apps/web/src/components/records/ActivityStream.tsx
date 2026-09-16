"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TonePill } from "@/components/records/RecordChrome";
import { Avatar } from "@/components/ui";
import {
  ACTIVITY_TYPES,
  DATE_FILTERS,
  filterActivities,
  type DateFilter,
} from "@/lib/activity";
import type { ActivityItem, ActivityType } from "@/lib/types";

export function ActivityStream({
  items,
  onPost,
  placeholder = "Write a comment",
}: {
  items: ActivityItem[];
  onPost?: (text: string) => void;
  placeholder?: string;
}) {
  const [type, setType] = useState<ActivityType | "all">("all");
  const [date, setDate] = useState<DateFilter>("all");
  const [draft, setDraft] = useState("");
  const rows = useMemo(() => filterActivities(items, type, date), [items, type, date]);

  return (
    <div className="activity-stream">
      {onPost ? (
        <div className="activity-composer">
          <textarea
            className="field-input min-h-16"
            placeholder={placeholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary self-end"
            disabled={!draft.trim()}
            onClick={() => {
              onPost(draft.trim());
              setDraft("");
            }}
          >
            Post
          </button>
        </div>
      ) : null}
      <div className="activity-filters">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={`filter-chip ${type === "all" ? "active" : ""}`} onClick={() => setType("all")}>
            All types
          </button>
          {ACTIVITY_TYPES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`filter-chip ${type === item.id ? "active" : ""}`}
              onClick={() => setType(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <select className="field-input activity-date" value={date} onChange={(e) => setDate(e.target.value as DateFilter)}>
          {DATE_FILTERS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <p className="activity-count">
        {rows.length} {rows.length === 1 ? "event" : "events"}
      </p>
      <ActivityList items={rows} />
    </div>
  );
}

export function ActivityList({ items, compact }: { items: ActivityItem[]; compact?: boolean }) {
  if (!items.length) {
    return <p className="text-sm text-[var(--color-muted)]">No activity matches these filters.</p>;
  }
  return (
    <ol className={`activity-list ${compact ? "is-compact" : ""}`}>
      {items.map((item) => (
        <li key={item.id} className="activity-item">
          <Avatar
            initials={(item.actor ?? "S")
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)}
            name={item.actor}
            size={compact ? 26 : 32}
          />
          <div className="min-w-0">
            <div className="activity-meta">
              <span className="font-semibold">{item.actor}</span>
              <span>{item.when}</span>
              {item.type ? <TonePill value={labelFor(item.type)} /> : null}
            </div>
            <div className="activity-action">{item.action}</div>
            {item.entityLabel ? (
              item.href ? (
                <Link href={item.href} className="activity-entity">
                  {item.entityLabel}
                </Link>
              ) : (
                <div className="activity-entity">{item.entityLabel}</div>
              )
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function labelFor(type: ActivityType) {
  return ACTIVITY_TYPES.find((t) => t.id === type)?.label ?? type;
}
