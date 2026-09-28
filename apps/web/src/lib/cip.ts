import type { Company, CompanyKind, Milestone, PhaseRole } from "./types";

export const COMPANY_KINDS: CompanyKind[] = ["Client", "Agency", "Consultant", "Contractor"];
export const PHASE_ROLES: PhaseRole[] = ["Design", "Bid support", "Construction", "Inspection", "CM", "Utility"];

export function companyKindOf(company?: Pick<Company, "companyKind"> | null): CompanyKind {
  return company?.companyKind ?? "Client";
}

export function isVendorKind(kind?: CompanyKind) {
  return kind === "Consultant" || kind === "Contractor";
}

export function vendorCompanies(companies: Company[]) {
  return companies.filter((row) => isVendorKind(companyKindOf(row)));
}

export function phaseContractorMeta(phase: Milestone) {
  return [phase.phaseRole, phase.contractNumber].filter(Boolean).join(" · ");
}

export function phaseContractorLabel(phase: Milestone) {
  if (!phase.contractorName) return "";
  const meta = phaseContractorMeta(phase);
  return meta ? `${phase.contractorName} · ${meta}` : phase.contractorName;
}

export function assignPhaseContractor(
  phase: Milestone,
  company: Company | undefined,
  extras?: { contractNumber?: string; phaseRole?: PhaseRole; awardAmount?: number },
): Partial<Milestone> {
  if (!company) {
    return {
      contractorCompanyId: undefined,
      contractorName: undefined,
      contractNumber: extras?.contractNumber,
      phaseRole: extras?.phaseRole,
      awardAmount: extras?.awardAmount,
    };
  }
  return {
    contractorCompanyId: company.id,
    contractorName: company.name,
    contractNumber: extras?.contractNumber ?? phase.contractNumber,
    phaseRole: extras?.phaseRole ?? phase.phaseRole,
    awardAmount: extras?.awardAmount ?? phase.awardAmount,
  };
}
