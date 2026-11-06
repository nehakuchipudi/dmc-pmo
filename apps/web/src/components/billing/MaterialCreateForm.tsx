"use client";

import { useState } from "react";
import { Field, TextInput, TextSelect } from "@/components/primitives";
import { money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";

export type MaterialCreateValues = {
  title: string;
  qty: number;
  purchasePrice: number;
  salePrice: number;
  sku?: string;
  companyId?: string;
  projectId?: string;
};

export function MaterialCreateForm({
  defaultCompanyId,
  defaultProjectId,
  onSubmit,
}: {
  defaultCompanyId?: string;
  defaultProjectId?: string;
  onSubmit: (v: MaterialCreateValues) => void;
}) {
  const companies = useAppStore((s) => s.companies);
  const projects = useAppStore((s) => s.projects);
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState("1");
  const [purchasePrice, setPurchasePrice] = useState("0");
  const [salePrice, setSalePrice] = useState("0");
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? companies[0]?.id ?? "");
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const companyProjects = projects.filter((row) => !companyId || row.companyId === companyId);
  const qtyNum = Math.max(1, Number(qty) || 1);
  const sale = Number(salePrice) || 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({
          title: title.trim(),
          qty: qtyNum,
          purchasePrice: Number(purchasePrice) || 0,
          salePrice: sale,
          sku: sku.trim() || undefined,
          companyId: companyId || undefined,
          projectId: projectId || undefined,
        });
      }}
    >
      <Field label="Title" required>
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>
      <Field label="Item code">
        <TextInput value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Optional SKU" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Quantity" required>
          <TextInput type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label="Purchase price">
          <TextInput
            type="number"
            min={0}
            step="0.01"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
          />
        </Field>
        <Field label="Sale price" required>
          <TextInput type="number" min={0} step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
        </Field>
      </div>
      <Field label="Company">
        <TextSelect
          value={companyId}
          onChange={(e) => {
            setCompanyId(e.target.value);
            setProjectId("");
          }}
        >
          <option value="">No company</option>
          {companies.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label="Project">
        <TextSelect value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">No project</option>
          {companyProjects.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <button type="submit" className="btn btn-primary">
        Add material {money(qtyNum * sale)}
      </button>
    </form>
  );
}
