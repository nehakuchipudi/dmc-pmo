"use client";

import { useState } from "react";
import { PageHeader, StatusPill, statusTone } from "@/components/ui";
import { money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";

type Opp = {
  id: string;
  name: string;
  company: string;
  stage: "Qualify" | "Propose" | "Negotiate" | "Won" | "Lost";
  amount: number;
  close: string;
};

const SEED: Opp[] = [
  { id: "o1", name: "ERP readiness assessment", company: "Harlow & Pine Law", stage: "Qualify", amount: 18000, close: "2026-09-15" },
  { id: "o2", name: "Warehouse phase 2", company: "Cascade Ventures", stage: "Propose", amount: 62000, close: "2026-08-28" },
  { id: "o3", name: "Fleet expansion", company: "Bellweather Logistics", stage: "Negotiate", amount: 44000, close: "2026-09-05" },
];

export default function SalesPage() {
  const pushToast = useAppStore((s) => s.pushToast);
  const createProject = useAppStore((s) => s.createProject);
  const companies = useAppStore((s) => s.companies);
  const [opps, setOpps] = useState(SEED);

  function advance(id: string) {
    const order: Opp["stage"][] = ["Qualify", "Propose", "Negotiate", "Won"];
    setOpps((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const idx = order.indexOf(o.stage);
        if (idx < 0 || idx >= order.length - 1) return o;
        const next = order[idx + 1];
        if (next === "Won") {
          const company = companies.find((c) => c.name === o.company);
          if (company) {
            createProject({
              name: o.name,
              companyId: company.id,
              manager: "M. Doyle",
              due: o.close,
              budgetHours: 80,
            });
          }
          pushToast(`${o.name} won and converted to a project`);
        } else {
          pushToast(`Moved to ${next}`);
        }
        return { ...o, stage: next };
      }),
    );
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Sales"
        subtitle="Pipeline and opportunities. Won deals convert into projects."
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setOpps((prev) => [
                {
                  id: `o-${Date.now()}`,
                  name: "New opportunity",
                  company: companies[0]?.name ?? "Cascade Ventures",
                  stage: "Qualify",
                  amount: 10000,
                  close: "2026-10-01",
                },
                ...prev,
              ]);
              pushToast("Opportunity added");
            }}
          >
            New opportunity
          </button>
        }
      />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Opportunity</th>
              <th>Company</th>
              <th>Stage</th>
              <th>Amount</th>
              <th>Close</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {opps.map((o) => (
              <tr key={o.id}>
                <td className="font-medium text-[var(--color-navy)]">{o.name}</td>
                <td>{o.company}</td>
                <td>
                  <StatusPill tone={statusTone(o.stage)}>{o.stage}</StatusPill>
                </td>
                <td className="tabular-nums">{money(o.amount)}</td>
                <td>{o.close}</td>
                <td className="text-right">
                  {o.stage !== "Won" && o.stage !== "Lost" ? (
                    <button type="button" className="btn btn-primary text-sm" onClick={() => advance(o.id)}>
                      Advance
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
