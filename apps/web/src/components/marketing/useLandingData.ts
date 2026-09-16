"use client";

import { useMemo } from "react";
import { allocationByMember, blockedDependencies, openHighRisks, portfolioMetrics } from "@/lib/ppm";
import { money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";

export function useLandingData() {
  const projects = useAppStore((s) => s.projects);
  const portfolios = useAppStore((s) => s.portfolios);
  const programs = useAppStore((s) => s.programs);
  const objectives = useAppStore((s) => s.objectives);
  const risks = useAppStore((s) => s.risks);
  const issues = useAppStore((s) => s.issues);
  const gates = useAppStore((s) => s.gates);
  const allocations = useAppStore((s) => s.allocations);
  const benefits = useAppStore((s) => s.benefits);
  const dependencies = useAppStore((s) => s.dependencies);
  const invoices = useAppStore((s) => s.invoices);
  const milestones = useAppStore((s) => s.milestones);

  return useMemo(() => {
    const delivery = portfolios.find((p) => p.id === "pf-delivery");
    const metrics = delivery ? portfolioMetrics(delivery, projects) : null;
    const mapped = new Set(programs.flatMap((p) => p.projectIds));
    const aligned = projects.filter((p) => mapped.has(p.id)).length;
    const capacity = allocationByMember(allocations);
    const overloaded = capacity.filter((c) => c.pct > 100);
    const highRisks = openHighRisks(risks);
    const benefitAvg = benefits.length
      ? Math.round(benefits.reduce((sum, b) => sum + b.progress, 0) / benefits.length)
      : 0;
    const overdueCash = invoices.filter((i) => i.status === "Overdue").reduce((sum, i) => sum + i.amount, 0);
    const phaseMilestones = milestones.filter((m) => m.kind === "phase");
    return {
      projects,
      portfolios,
      programs,
      objectives,
      risks,
      issues,
      gates,
      allocations,
      benefits,
      dependencies,
      invoices,
      milestones: phaseMilestones,
      delivery,
      metrics,
      alignedPct: projects.length ? Math.round((aligned / projects.length) * 100) : 0,
      capacity,
      overloaded,
      highRisks,
      benefitAvg,
      overdueCash,
      blocked: blockedDependencies(dependencies),
      pendingGates: gates.filter((g) => g.status === "In Review" || g.status === "Upcoming"),
      statusCounts: {
        onTrack: projects.filter((p) => p.status === "On Track").length,
        atRisk: projects.filter((p) => p.status === "At Risk").length,
        overdue: projects.filter((p) => p.status === "Overdue").length,
        planned: projects.filter((p) => p.status === "Planned").length,
        completed: projects.filter((p) => p.status === "Completed").length,
      },
      money,
    };
  }, [
    projects,
    portfolios,
    programs,
    objectives,
    risks,
    issues,
    gates,
    allocations,
    benefits,
    dependencies,
    invoices,
    milestones,
  ]);
}

export type LandingData = ReturnType<typeof useLandingData>;
