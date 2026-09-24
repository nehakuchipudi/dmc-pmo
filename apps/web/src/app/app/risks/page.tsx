"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Field, Modal, PageHeader, TextInput, TextSelect, TextTextarea } from "@/components/ui";
import { DataTable, MetricCard, MetricGrid, Pill } from "@/components/ppm/PpmWidgets";
import { riskScore } from "@/lib/ppm";
import { useAppStore } from "@/lib/store";
import { IfCan } from "@/components/auth/IfCan";
import { useAuth } from "@/lib/auth";
import type { RiskItem } from "@/lib/types";

export default function RisksPage() {
  const { user } = useAuth();
  const risks = useAppStore((s) => s.risks);
  const issues = useAppStore((s) => s.issues);
  const projects = useAppStore((s) => s.projects);
  const createRisk = useAppStore((s) => s.createRisk);
  const updateRiskStatus = useAppStore((s) => s.updateRiskStatus);
  const updateIssueStatus = useAppStore((s) => s.updateIssueStatus);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [probability, setProbability] = useState<RiskItem["probability"]>("Medium");
  const [impact, setImpact] = useState<RiskItem["impact"]>("High");
  const [mitigation, setMitigation] = useState("");
  const [due, setDue] = useState("2026-08-20");

  return (
    <div className="fade-in">
      <PageHeader
        title="Risks and issues"
        subtitle="Project status pills stay on the project. This register is the formal log: likelihood, impact, owner, and next action."
        actions={
          <IfCan cap="create_risk">
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              <Plus size={16} /> Log risk
            </button>
          </IfCan>
        }
      />
      <MetricGrid>
        <MetricCard label="Open risks" value={risks.filter((r) => r.status !== "Closed").length} />
        <MetricCard
          label="High / critical"
          value={risks.filter((r) => r.status !== "Closed" && (r.impact === "High" || r.impact === "Critical")).length}
          tone="warn"
        />
        <MetricCard label="Open issues" value={issues.filter((i) => i.status !== "Resolved").length} />
        <MetricCard label="Mitigating" value={risks.filter((r) => r.status === "Mitigating").length} />
        <MetricCard label="Closed" value={risks.filter((r) => r.status === "Closed").length} tone="good" />
      </MetricGrid>
      <div className="panel p-5 mb-4">
        <h2 className="section-title">Risk register</h2>
        <DataTable
          columns={["Risk", "Project", "Owner", "P x I", "Status", "Action"]}
          rows={risks.map((risk) => [
            <div key={risk.id}>
              <div className="font-semibold">{risk.title}</div>
              <div className="text-xs text-[var(--color-muted)]">{risk.mitigation}</div>
            </div>,
            risk.projectId ? (
              <Link href={`/app/projects/view/?id=${risk.projectId}`} className="text-[var(--color-navy)]">
                {projects.find((p) => p.id === risk.projectId)?.name ?? risk.projectId}
              </Link>
            ) : (
              "Portfolio"
            ),
            risk.owner,
            `${risk.probability} / ${risk.impact} (${riskScore(risk.probability, risk.impact)})`,
            <Pill key={`${risk.id}-s`} value={risk.status} />,
            <div key={`${risk.id}-a`} className="flex gap-2">
              {risk.status === "Open" ? (
                <button type="button" className="btn btn-ghost text-sm" onClick={() => updateRiskStatus(risk.id, "Mitigating")}>
                  Mitigate
                </button>
              ) : null}
              {risk.status !== "Closed" ? (
                <button type="button" className="btn btn-ghost text-sm" onClick={() => updateRiskStatus(risk.id, "Closed")}>
                  Close
                </button>
              ) : null}
            </div>,
          ])}
        />
      </div>
      <div className="panel p-5">
        <h2 className="section-title">Issues</h2>
        <DataTable
          columns={["Issue", "Project", "Owner", "Severity", "Status", "Action"]}
          rows={issues.map((issue) => [
            issue.title,
            <Link key={issue.id} href={`/app/projects/view/?id=${issue.projectId}`} className="text-[var(--color-navy)]">
              {projects.find((p) => p.id === issue.projectId)?.name ?? issue.projectId}
            </Link>,
            issue.owner,
            <Pill key={`${issue.id}-sv`} value={issue.severity} />,
            <Pill key={`${issue.id}-st`} value={issue.status} />,
            issue.status !== "Resolved" ? (
              <button type="button" className="btn btn-ghost text-sm" onClick={() => updateIssueStatus(issue.id, issue.status === "Open" ? "In Progress" : "Resolved")}>
                {issue.status === "Open" ? "Start" : "Resolve"}
              </button>
            ) : (
              "Done"
            ),
          ])}
        />
      </div>
      <Modal open={open} title="Log a risk" onClose={() => setOpen(false)}>
        <Field label="Title">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Project">
          <TextSelect value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Probability">
          <TextSelect value={probability} onChange={(e) => setProbability(e.target.value as RiskItem["probability"])}>
            {["Low", "Medium", "High", "Critical"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Impact">
          <TextSelect value={impact} onChange={(e) => setImpact(e.target.value as RiskItem["impact"])}>
            {["Low", "Medium", "High", "Critical"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Due">
          <TextInput type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <Field label="Mitigation">
          <TextTextarea value={mitigation} onChange={(e) => setMitigation(e.target.value)} />
        </Field>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (!title.trim()) return;
            createRisk({
              title: title.trim(),
              owner: user?.name ?? "PMO",
              projectId,
              probability,
              impact,
              mitigation: mitigation.trim(),
              due,
            });
            setOpen(false);
            setTitle("");
            setMitigation("");
          }}
        >
          Save risk
        </button>
      </Modal>
    </div>
  );
}
