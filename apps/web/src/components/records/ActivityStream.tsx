"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { TonePill } from "@/components/records/RecordChrome";
import { Avatar } from "@/components/ui";
import {
  ACTIVITY_TYPES,
  DATE_FILTERS,
  filterActivities,
  type DateFilter,
} from "@/lib/activity";
import {
  insertMention,
  matchMentionPeople,
  mentionQueryAt,
  splitMentions,
  type MentionPerson,
} from "@/lib/mentions";
import type { ActivityItem, ActivityType } from "@/lib/types";

function MentionText({ text, people }: { text?: string; people: MentionPerson[] }) {
  return (
    <>
      {splitMentions(text ?? "", people).map((part, index) =>
        part.mention ? (
          <span key={`${part.text}-${index}`} className="activity-mention">
            {part.text}
          </span>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </>
  );
}

export function ActivityStream({
  items,
  onPost,
  placeholder = "Write a comment",
  mentionPeople = [],
}: {
  items: ActivityItem[];
  onPost?: (text: string) => void;
  placeholder?: string;
  mentionPeople?: MentionPerson[];
}) {
  const [type, setType] = useState<ActivityType | "all">("all");
  const [date, setDate] = useState<DateFilter>("all");
  const [draft, setDraft] = useState("");
  const [cursor, setCursor] = useState(0);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [showMentions, setShowMentions] = useState(true);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const rows = useMemo(() => filterActivities(items, type, date), [items, type, date]);
  const mention = mentionQueryAt(draft, cursor);
  const matches =
    showMentions && mention && mentionPeople.length ? matchMentionPeople(mention.query, mentionPeople) : [];

  function applyMention(person: MentionPerson) {
    const next = insertMention(draft, cursor, person.name);
    setDraft(next.text);
    setCursor(next.cursor);
    setMentionIndex(0);
    requestAnimationFrame(() => {
      const node = areaRef.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(next.cursor, next.cursor);
    });
  }

  return (
    <div className="activity-stream">
      {onPost ? (
        <div className="activity-composer">
          <div className="activity-composer-field">
            <textarea
              ref={areaRef}
              className="field-input min-h-16"
              placeholder={mentionPeople.length ? `${placeholder}. Type @ to tag a teammate.` : placeholder}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setCursor(e.target.selectionStart);
                setMentionIndex(0);
                setShowMentions(true);
              }}
              onKeyDown={(e) => {
                if (!matches.length) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setMentionIndex((prev) => (prev + 1) % matches.length);
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setMentionIndex((prev) => (prev - 1 + matches.length) % matches.length);
                }
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  applyMention(matches[mentionIndex] ?? matches[0]);
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setShowMentions(false);
                }
              }}
              onClick={(e) => setCursor(e.currentTarget.selectionStart)}
              onKeyUp={(e) => setCursor(e.currentTarget.selectionStart)}
            />
            {matches.length ? (
              <ul className="mention-menu" role="listbox" aria-label="Tag a teammate">
                {matches.slice(0, 6).map((person, index) => (
                  <li key={person.id ?? person.name}>
                    <button
                      type="button"
                      className={`mention-option ${index === mentionIndex ? "is-active" : ""}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyMention(person);
                      }}
                    >
                      <span className="font-semibold">{person.name}</span>
                      <span className="text-[var(--color-muted)]">@{person.name.replace(/\s+/g, "")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <button
            type="button"
            className="btn btn-primary self-end"
            disabled={!draft.trim()}
            onClick={() => {
              onPost(draft.trim());
              setDraft("");
              setCursor(0);
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
      <ActivityList items={rows} mentionPeople={mentionPeople} />
    </div>
  );
}

export function ActivityList({
  items,
  compact,
  mentionPeople = [],
}: {
  items: ActivityItem[];
  compact?: boolean;
  mentionPeople?: MentionPerson[];
}) {
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
            <div className="activity-action">
              <MentionText text={item.action} people={mentionPeople} />
            </div>
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
  return ACTIVITY_TYPES.find((item) => item.id === type)?.label ?? type;
}
