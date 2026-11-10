"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { Avatar } from "@/components/ui";
import type { TeamMember } from "@/lib/types";

export const WORK_TYPES = [
  { id: "logged", label: "Logged" },
  { id: "no-time", label: "No time yet" },
  { id: "client", label: "Client" },
  { id: "internal", label: "Internal" },
  { id: "scheduled", label: "Scheduled" },
  { id: "committed", label: "Committed" },
] as const;

export const OBJECT_TYPES = [
  { id: "project", label: "Projects" },
  { id: "phase", label: "Milestones" },
  { id: "task", label: "Tasks" },
  { id: "subtask", label: "Subtasks" },
] as const;

export type WorkTypeId = (typeof WORK_TYPES)[number]["id"];
export type ObjectTypeId = (typeof OBJECT_TYPES)[number]["id"];

type MenuId = "person" | "work" | "object" | null;

export function TimesheetToolbar({
  people,
  team,
  person,
  onPerson,
  workTypes,
  onToggleWorkType,
  objectTypes,
  onToggleObjectType,
  onRefresh,
  onAddTime,
  rangeLabel,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  jumpLabel,
  onJump,
}: {
  people: string[];
  team: TeamMember[];
  person: string;
  onPerson: (name: string) => void;
  workTypes: Set<WorkTypeId>;
  onToggleWorkType: (id: WorkTypeId) => void;
  objectTypes: Set<ObjectTypeId>;
  onToggleObjectType: (id: ObjectTypeId) => void;
  onRefresh: () => void;
  onAddTime: () => void;
  rangeLabel: string;
  onPrev: () => void;
  onNext: () => void;
  prevLabel: string;
  nextLabel: string;
  jumpLabel?: string;
  onJump?: () => void;
}) {
  const [menu, setMenu] = useState<MenuId>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!menu) return;
    function onClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest("[data-ts-picker]")) setMenu(null);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menu]);

  const roster = useMemo(() => {
    const byName = new Map(team.filter((member) => member.active).map((member) => [member.name, member]));
    return people.map((name) => ({
      name,
      initials: name === "All" ? "ALL" : byName.get(name)?.initials ?? name.slice(0, 2).toUpperCase(),
    }));
  }, [people, team]);

  const selected = roster.find((row) => row.name === person) ?? roster[0];
  const hits = roster.filter((row) => !query.trim() || row.name.toLowerCase().includes(query.trim().toLowerCase()));

  function toggle(id: MenuId) {
    setMenu((current) => (current === id ? null : id));
    if (id !== "person") setQuery("");
  }

  return (
    <div className="ts-toolbar">
      <div className="ts-toolbar-group">
        <div className="ts-picker" data-ts-picker>
          <button
            type="button"
            className="ts-picker-btn ts-person-btn"
            aria-label="Person"
            aria-expanded={menu === "person"}
            onClick={() => toggle("person")}
          >
            {selected ? <Avatar initials={selected.initials} name={selected.name} size={22} /> : null}
            <span>{person === "All" ? "All people" : person}</span>
            <ChevronDown size={14} />
          </button>
          {menu === "person" ? (
            <div className="ts-picker-menu">
              <input
                className="field-input"
                placeholder="Find a person"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Find a person"
              />
              {hits.map((row) => (
                <button
                  key={row.name}
                  type="button"
                  className={row.name === person ? "ts-picker-row is-active" : "ts-picker-row"}
                  onClick={() => {
                    onPerson(row.name);
                    setMenu(null);
                    setQuery("");
                  }}
                >
                  <Avatar initials={row.initials} name={row.name} size={22} />
                  <span>{row.name === "All" ? "All people" : row.name}</span>
                </button>
              ))}
              {!hits.length ? <p className="menu-empty">No one matches.</p> : null}
            </div>
          ) : null}
        </div>

        <CheckPicker
          label="Work type"
          open={menu === "work"}
          onToggle={() => toggle("work")}
          options={WORK_TYPES}
          selected={workTypes}
          onToggleOption={onToggleWorkType}
        />
        <CheckPicker
          label="Object type"
          open={menu === "object"}
          onToggle={() => toggle("object")}
          options={OBJECT_TYPES}
          selected={objectTypes}
          onToggleOption={onToggleObjectType}
        />

        <button type="button" className="icon-btn" aria-label="Refresh timesheet" title="Refresh" onClick={onRefresh}>
          <RefreshCw size={16} />
        </button>
        <button type="button" className="icon-btn ts-add-btn" aria-label="Add time" title="Add time" onClick={onAddTime}>
          <Plus size={16} />
        </button>
      </div>

      <div className="ts-toolbar-group">
        {jumpLabel && onJump ? (
          <button type="button" className="ts-toolbar-link" onClick={onJump}>
            {jumpLabel}
          </button>
        ) : null}
        <button type="button" className="icon-btn" aria-label={prevLabel} onClick={onPrev}>
          <ChevronLeft size={16} />
        </button>
        <strong className="ts-date-label">{rangeLabel}</strong>
        <button type="button" className="icon-btn" aria-label={nextLabel} onClick={onNext}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function CheckPicker<T extends string>({
  label,
  open,
  onToggle,
  options,
  selected,
  onToggleOption,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  options: readonly { id: T; label: string }[];
  selected: Set<T>;
  onToggleOption: (id: T) => void;
}) {
  const summary = selected.size ? `${selected.size} selected` : "All";
  return (
    <div className="ts-picker" data-ts-picker>
      <button
        type="button"
        className="ts-picker-btn"
        aria-label={label}
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="ts-filter-label">{label}:</span>
        <span>{summary}</span>
        <ChevronDown size={14} />
      </button>
      {open ? (
        <div className="ts-picker-menu" role="group" aria-label={label}>
          {options.map((option) => (
            <label key={option.id} className="ts-picker-row">
              <input
                type="checkbox"
                checked={selected.has(option.id)}
                onChange={() => onToggleOption(option.id)}
              />
              {option.label}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
