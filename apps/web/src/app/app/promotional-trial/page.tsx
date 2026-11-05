"use client";

import { useState } from "react";
import { PageHeader, TextInput } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/lib/store";

export default function PromotionalTrialPage() {
  const { can } = useAuth();
  const canEdit = can("manage_users") || can("manage_service_ops");
  const promotionalTrial = useAppStore((s) => s.promotionalTrial);
  const enabledPacks = useAppStore((s) => s.enabledPacks);
  const saveTrial = useAppStore((s) => s.saveTrial);
  const startTrial = useAppStore((s) => s.startTrial);
  const [days, setDays] = useState(String(promotionalTrial.days));
  const [slots, setSlots] = useState(String(promotionalTrial.slots));
  const remaining = Math.max(0, promotionalTrial.slots - promotionalTrial.used);
  const serviceOn = enabledPacks.includes("service_operations");

  return (
    <div className="fade-in">
      <PageHeader
        title="Promotional Trial"
        subtitle="Offer field service operations for a limited window without turning the pack on forever."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Status</div>
          <div className="mt-1 text-lg font-semibold">{promotionalTrial.active ? "Trial live" : "Not started"}</div>
          {promotionalTrial.startedOn ? (
            <div className="mt-1 text-sm text-[var(--color-muted)]">Started {promotionalTrial.startedOn}</div>
          ) : null}
        </div>
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Slots used</div>
          <div className="mt-1 text-lg font-semibold">
            {promotionalTrial.used} / {promotionalTrial.slots}
          </div>
        </div>
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Service operations</div>
          <div className="mt-1 text-lg font-semibold">{serviceOn ? "Enabled" : "Off"}</div>
        </div>
      </div>
      <div className="panel space-y-4 p-4">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--color-muted)]">Trial days</span>
          <TextInput
            type="number"
            min={1}
            value={days}
            disabled={!canEdit}
            onChange={(e) => setDays(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--color-muted)]">Available slots</span>
          <TextInput
            type="number"
            min={1}
            value={slots}
            disabled={!canEdit}
            onChange={(e) => setSlots(e.target.value)}
          />
        </label>
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => saveTrial({ days: Number(days) || 30, slots: Number(slots) || 1 })}
            >
              Save trial
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={remaining < 1}
              onClick={() => {
                saveTrial({ days: Number(days) || 30, slots: Number(slots) || 1 });
                startTrial();
              }}
            >
              Start service operations trial
            </button>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">Only an admin can start or edit the trial.</p>
        )}
      </div>
    </div>
  );
}
