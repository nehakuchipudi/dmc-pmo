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

export function phaseContractorLabel(phase: Milestone) {
  if (!phase.contractorName) return "";
  const bits = [phase.contractorName];
  if (phase.phaseRole) bits.push(phase.phaseRole);
  if (phase.contractNumber) bits.push(phase.contractNumber);
  return bits.join(" · ");
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
