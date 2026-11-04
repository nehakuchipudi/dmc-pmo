"use client";

import { Field, Modal, TextInput, TextTextarea } from "@/components/ui";

export function AddPeriodModal({
  open,
  defaultHours,
  defaultStart,
  defaultEnd,
  onClose,
  onSubmit,
}: {
  open: boolean;
  defaultHours: number;
  defaultStart: string;
  defaultEnd: string;
  onClose: () => void;
  onSubmit: (start: string, end: string, hours: number) => void;
}) {
  return (
    <Modal open={open} title="Add period" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          onSubmit(
            String(fd.get("start") || defaultStart),
            String(fd.get("end") || defaultEnd),
            Number(fd.get("hours") || defaultHours),
          );
        }}
      >
        <Field label="Start">
          <TextInput name="start" type="date" defaultValue={defaultStart} required />
        </Field>
        <Field label="End">
          <TextInput name="end" type="date" defaultValue={defaultEnd} required />
        </Field>
        <Field label="Budget hours">
          <TextInput name="hours" type="number" min="1" step="0.5" defaultValue={defaultHours} required />
        </Field>
        <button type="submit" className="btn btn-primary">
          Add period
        </button>
      </form>
    </Modal>
  );
}

export function AddActivityModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: string) => void;
}) {
  return (
    <Modal open={open} title="Add activity" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const body = String(fd.get("body") || "").trim();
          if (!body) return;
          onSubmit(body);
        }}
      >
        <Field label="Note">
          <TextTextarea name="body" rows={4} placeholder="What happened on this retainer?" required />
        </Field>
        <button type="submit" className="btn btn-primary">
          Save note
        </button>
      </form>
    </Modal>
  );
}
