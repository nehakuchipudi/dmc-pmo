"use client";

import { useMemo, useState } from "react";
import { Field, Modal, TextInput, TextSelect } from "@/components/ui";
import {
  PLAN_SERVICE_ITEMS,
  formatHours,
  laborBudget,
  materialsTotal,
  staffRateOptions,
  taskHours,
} from "@/lib/plan-allocation";
import { moneyExact, uid } from "@/lib/seed";
import type { MaterialLine, Project, Task, TeamMember } from "@/lib/types";

export function ScheduleAllocationModal({
  task,
  project,
  team,
  fallbackRate,
  onSave,
  onClose,
}: {
  task: Task;
  project: Project;
  team: TeamMember[];
  fallbackRate: number;
  onSave: (patch: Partial<Task>) => void;
  onClose: () => void;
}) {
  const rates = useMemo(() => staffRateOptions(project, team), [project, team]);
  const initialRate = task.hourlyRate ?? fallbackRate;
  const [serviceItem, setServiceItem] = useState(task.serviceItem ?? "No service item");
  const [rateName, setRateName] = useState(
    task.rateName ?? rates.find((row) => row.rate === initialRate && row.name !== "No Rate")?.name ?? "No Rate",
  );
  const [hourlyRate, setHourlyRate] = useState(initialRate);
  const [hours, setHours] = useState(Math.floor(task.estimateHours || 0));
  const [minutes, setMinutes] = useState(task.estimateMinutes ?? 0);
  const [timeMode, setTimeMode] = useState(task.timeMode ?? "fixed");
  const [budgetMode, setBudgetMode] = useState(task.budgetMode ?? (task.budgetAmount != null ? "fixed" : "calculated"));
  const [fixedBudget, setFixedBudget] = useState(task.budgetAmount ?? 0);
  const [materials, setMaterials] = useState<MaterialLine[]>(task.materials ?? []);

  const estimateHours = hours + minutes / 60;
  const draft: Task = {
    ...task,
    estimateHours: hours,
    estimateMinutes: minutes,
    hourlyRate,
    rateName,
    serviceItem,
    budgetMode,
    timeMode,
    budgetAmount: fixedBudget,
    materials,
  };
  const labor = laborBudget(taskHours(draft), hourlyRate);
  const extras = materialsTotal(materials);
  const calculated = labor + extras;
  const budget = budgetMode === "fixed" ? Number(fixedBudget) || 0 : calculated;

  function applyRate(name: string) {
    const row = rates.find((item) => item.name === name);
    setRateName(name);
    setHourlyRate(row?.rate ?? 0);
    if (name !== "No Rate") setBudgetMode("calculated");
  }

  function addMaterial() {
    setMaterials((prev) => [
      ...prev,
      { id: uid("mat"), item: "", title: "", qty: 1, purchasePrice: 0, salePrice: 0 },
    ]);
  }

  return (
    <Modal open title={`${task.name} budget and time`} onClose={onClose} wide>
      <div className="plan-alloc-grid">
        <section>
          <h3 className="section-title">Budget</h3>
          <Field label="Service item">
            <TextSelect value={serviceItem} onChange={(e) => setServiceItem(e.target.value)}>
              {PLAN_SERVICE_ITEMS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Applied rate">
            <TextSelect value={rateName} onChange={(e) => applyRate(e.target.value)}>
              {rates.map((row) => (
                <option key={row.name} value={row.name}>
                  {row.name} {row.rate ? moneyExact(row.rate) : ""}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Hourly rate">
            <TextInput
              type="number"
              min={0}
              step="0.01"
              value={hourlyRate}
              onChange={(e) => {
                setHourlyRate(Number(e.target.value) || 0);
                setBudgetMode("calculated");
              }}
            />
          </Field>
          <Field label="Budget mode">
            <TextSelect value={budgetMode} onChange={(e) => setBudgetMode(e.target.value as "calculated" | "fixed")}>
              <option value="calculated">Calculated from rate</option>
              <option value="fixed">Fixed price</option>
            </TextSelect>
          </Field>
          {budgetMode === "fixed" ? (
            <Field label="Budget amount">
              <TextInput
                type="number"
                min={0}
                step="0.01"
                value={fixedBudget}
                onChange={(e) => setFixedBudget(Number(e.target.value) || 0)}
              />
            </Field>
          ) : null}
          <p className="plan-alloc-calc">
            Labor {moneyExact(labor)} + materials {moneyExact(extras)} = calculated {moneyExact(calculated)}
          </p>
        </section>
        <section>
          <h3 className="section-title">Time</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estimated hours">
              <TextInput type="number" min={0} step="0.25" value={hours} onChange={(e) => setHours(Number(e.target.value) || 0)} />
            </Field>
            <Field label="Estimated minutes">
              <TextInput
                type="number"
                min={0}
                max={59}
                step="1"
                value={minutes}
                onChange={(e) => setMinutes(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
              />
            </Field>
          </div>
          <Field label="Time allocation">
            <TextSelect value={timeMode} onChange={(e) => setTimeMode(e.target.value as "calculated" | "fixed")}>
              <option value="fixed">Fixed</option>
              <option value="calculated">Calculated</option>
            </TextSelect>
          </Field>
          <p className="plan-alloc-calc">
            {formatHours(estimateHours)} at {moneyExact(hourlyRate)}/hr = {moneyExact(labor)}
          </p>
        </section>
      </div>

      <div className="mt-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="section-title" style={{ margin: 0 }}>
            Materials
          </h3>
          <button type="button" className="btn btn-ghost" onClick={addMaterial}>
            Add material
          </button>
        </div>
        {materials.map((row, index) => (
          <div key={row.id} className="plan-alloc-material">
            <TextInput
              placeholder="Item"
              value={row.item}
              onChange={(e) =>
                setMaterials((prev) => prev.map((item, i) => (i === index ? { ...item, item: e.target.value } : item)))
              }
            />
            <TextInput
              placeholder="Title"
              value={row.title}
              onChange={(e) =>
                setMaterials((prev) => prev.map((item, i) => (i === index ? { ...item, title: e.target.value } : item)))
              }
            />
            <TextInput
              type="number"
              min={0}
              value={row.qty}
              aria-label="Quantity"
              onChange={(e) =>
                setMaterials((prev) =>
                  prev.map((item, i) => (i === index ? { ...item, qty: Number(e.target.value) || 0 } : item)),
                )
              }
            />
            <TextInput
              type="number"
              min={0}
              step="0.01"
              value={row.salePrice}
              aria-label="Sale price"
              onChange={(e) =>
                setMaterials((prev) =>
                  prev.map((item, i) => (i === index ? { ...item, salePrice: Number(e.target.value) || 0 } : item)),
                )
              }
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setMaterials((prev) => prev.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="plan-alloc-foot">
        <div>
          <div className="text-sm text-[var(--color-muted)]">Task budget</div>
          <div className="text-lg font-semibold">{moneyExact(budget)}</div>
        </div>
        <div className="confirm-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onSave({
                estimateHours: hours,
                estimateMinutes: minutes,
                hourlyRate,
                rateName,
                serviceItem: serviceItem === "No service item" ? undefined : serviceItem,
                budgetMode,
                timeMode,
                budgetAmount: budget,
                materials,
              });
              onClose();
            }}
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function ScheduleProjectModal({
  projectName,
  budget,
  hours,
  onSave,
  onClose,
}: {
  projectName: string;
  budget: number;
  hours: number;
  onSave: (patch: { budgetAmount: number; budgetHours: number }) => boolean | void;
  onClose: () => void;
}) {
  const [budgetAmount, setBudgetAmount] = useState(budget);
  const [budgetHours, setBudgetHours] = useState(hours);
  return (
    <Modal open title={`${projectName} budget and time`} onClose={onClose}>
      <div className="plan-alloc-grid">
        <Field label="Approved budget">
          <TextInput
            type="number"
            min={0}
            step="0.01"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="Approved time (hours)">
          <TextInput
            type="number"
            min={0}
            step="0.25"
            value={budgetHours}
            onChange={(e) => setBudgetHours(Number(e.target.value) || 0)}
          />
        </Field>
      </div>
      <div className="plan-alloc-foot">
        <div>
          <div className="text-sm text-[var(--color-muted)]">Project budget</div>
          <div className="text-lg font-semibold">{moneyExact(budgetAmount)}</div>
        </div>
        <div className="confirm-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (budgetAmount === budget && budgetHours === hours) {
                onClose();
                return;
              }
              const saved = onSave({ budgetAmount, budgetHours });
              if (saved !== false) onClose();
            }}
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function ScheduleGroupModal({
  name,
  rows,
  onOpenTask,
  onClose,
}: {
  name: string;
  rows: { id: string; name: string; assignee: string; budget: number; hours: number }[];
  onOpenTask: (id: string) => void;
  onClose: () => void;
}) {
  const totalBudget = rows.reduce((sum, row) => sum + row.budget, 0);
  const totalHours = rows.reduce((sum, row) => sum + row.hours, 0);
  return (
    <Modal open title={`${name} budget and time`} onClose={onClose} wide>
      {rows.length ? (
        <div className="table-wrap plan-group-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Assignee</th>
                <th>Budget</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <button type="button" className="plan-alloc-value" onClick={() => onOpenTask(row.id)}>
                      {row.name}
                    </button>
                  </td>
                  <td>{row.assignee || "Unassigned"}</td>
                  <td>
                    <button type="button" className="plan-alloc-value" onClick={() => onOpenTask(row.id)}>
                      {moneyExact(row.budget)}
                    </button>
                  </td>
                  <td>
                    <button type="button" className="plan-alloc-value" onClick={() => onOpenTask(row.id)}>
                      {formatHours(row.hours)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">No tasks to allocate yet.</p>
      )}
      <div className="plan-alloc-foot">
        <div>
          <div className="text-sm text-[var(--color-muted)]">Allocated total</div>
          <div className="text-lg font-semibold">
            {moneyExact(totalBudget)} / {formatHours(totalHours)}
          </div>
        </div>
        <div className="confirm-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
