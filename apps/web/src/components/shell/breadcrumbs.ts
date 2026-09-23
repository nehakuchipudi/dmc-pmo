export type Crumb = { href?: string; label: string };

const SEGMENT_LABELS: Record<string, string> = {
  home: "Home",
  strategy: "Strategy",
  ideas: "Ideas",
  portfolios: "Portfolios",
  projects: "Projects",
  work: "Work",
  tickets: "Tickets",
  timesheets: "Timesheets",
  companies: "Companies",
  contacts: "Contacts",
  sales: "Sales",
  retainers: "Retainers",
  resources: "Resources",
  risks: "Risks",
  dependencies: "Dependencies",
  governance: "Governance",
  billing: "Billing",
  benefits: "Benefits",
  reports: "Reports",
  profitability: "Profitability",
  ai: "Insights",
  automations: "Automations",
  settings: "Settings",
};

function titleCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function looksLikeId(value: string) {
  return value.includes("-") || /^\d+$/.test(value);
}

export function buildAppBreadcrumbs({
  pathname,
  recordId,
  companies,
  contacts,
  projects,
  tickets,
  invoices,
  retainers,
  portfolios,
  ideas,
  objectives,
}: {
  pathname: string;
  recordId: string | null;
  companies: { id: string; name: string }[];
  contacts?: { id: string; name: string }[];
  projects: { id: string; name: string; companyId: string; companyName: string }[];
  tickets: { id: string; number: number; subject: string }[];
  invoices: { id: string; number: string }[];
  retainers: { id: string; name: string }[];
  portfolios: { id: string; name: string }[];
  ideas?: { id: string; name: string }[];
  objectives?: { id: string; name: string; code?: string }[];
}): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  const appIndex = parts[0] === "app" ? 1 : 0;
  const segs = parts.slice(appIndex).filter((seg) => seg !== "view");
  const last = segs[segs.length - 1];
  const id = recordId ?? (last && looksLikeId(last) ? last : null);
  const section = segs.find((seg) => SEGMENT_LABELS[seg]) ?? segs[0];

  const crumbs: Crumb[] = [{ href: "/app/home", label: "Home" }];
  if (!section || section === "home") return crumbs;

  const sectionHref = `/app/${section}`;
  crumbs.push({ href: sectionHref, label: SEGMENT_LABELS[section] ?? titleCase(section) });

  if (segs.includes("profitability")) {
    crumbs.push({ label: "Profitability" });
    return crumbs;
  }

  if (!id) return crumbs;

  if (section === "companies") {
    const company = companies.find((c) => c.id === id);
    if (company) crumbs.push({ label: company.name });
    return crumbs;
  }

  if (section === "contacts") {
    const contact = contacts?.find((c) => c.id === id);
    if (contact) crumbs.push({ label: contact.name });
    return crumbs;
  }

  if (section === "projects") {
    const project = projects.find((p) => p.id === id);
    if (project) {
      crumbs[crumbs.length - 1] = {
        href: `/app/companies/view/?id=${project.companyId}`,
        label: project.companyName,
      };
      crumbs.push({ label: project.name });
    }
    return crumbs;
  }

  if (section === "tickets") {
    const ticket = tickets.find((t) => t.id === id);
    if (ticket) crumbs.push({ label: `#${ticket.number} ${ticket.subject}` });
    return crumbs;
  }

  if (section === "billing") {
    const invoice = invoices.find((i) => i.id === id);
    if (invoice) crumbs.push({ label: invoice.number });
    return crumbs;
  }

  if (section === "retainers") {
    const retainer = retainers.find((r) => r.id === id);
    if (retainer) crumbs.push({ label: retainer.name });
    return crumbs;
  }

  if (section === "portfolios") {
    const portfolio = portfolios.find((p) => p.id === id);
    if (portfolio) crumbs.push({ label: portfolio.name });
    return crumbs;
  }

  if (section === "ideas") {
    const idea = ideas?.find((i) => i.id === id);
    if (idea) crumbs.push({ label: idea.name });
    return crumbs;
  }

  if (section === "strategy") {
    const objective = objectives?.find((o) => o.id === id);
    if (objective) crumbs.push({ label: objective.code ? `${objective.code} ${objective.name}` : objective.name });
    return crumbs;
  }

  return crumbs;
}
