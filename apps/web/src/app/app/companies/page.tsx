import { CompanyStatus, type Company } from "@dmc/shared";
import { getCompanies } from "@/lib/api";
import { CreateCompanyForm } from "./CreateCompanyForm";

export const dynamic = "force-dynamic";

const statusLabels: Record<CompanyStatus, string> = {
  [CompanyStatus.Active]: "Active",
  [CompanyStatus.Prospect]: "Prospect",
  [CompanyStatus.OnHold]: "On hold",
  [CompanyStatus.Archived]: "Archived",
};

function StatusPill({ status }: { status: CompanyStatus }) {
  return (
    <span className={`pill ${status.toLowerCase()}`}>{statusLabels[status]}</span>
  );
}

export default async function CompaniesPage() {
  let companies: Company[] = [];
  let loadError: string | null = null;

  try {
    companies = await getCompanies();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load companies";
  }

  const active = companies.filter((c) => c.status === CompanyStatus.Active).length;
  const openProjects = companies.reduce((sum, c) => sum + c.openProjects, 0);
  const openTickets = companies.reduce((sum, c) => sum + c.openTickets, 0);

  return (
    <main className="content">
      <div className="page-head">
        <div>
          <h1>Companies</h1>
          <p>All active companies across Dillon Morgan Consulting delivery.</p>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi">
          <div className="label">Total companies</div>
          <div className="value">{companies.length}</div>
        </div>
        <div className="kpi">
          <div className="label">Active</div>
          <div className="value">{active}</div>
        </div>
        <div className="kpi">
          <div className="label">Open projects</div>
          <div className="value">{openProjects}</div>
        </div>
        <div className="kpi">
          <div className="label">Open tickets</div>
          <div className="value">{openTickets}</div>
        </div>
      </div>

      <CreateCompanyForm />

      {loadError ? (
        <div className="notice error">
          Could not reach the API: {loadError}
        </div>
      ) : (
        <div className="card">
          <div className="card-head">All companies</div>
          <table className="grid">
            <thead>
              <tr>
                <th>Company</th>
                <th>Status</th>
                <th>Account manager</th>
                <th>Open projects</th>
                <th>Open tickets</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>
                    <div className="company-name">{company.name}</div>
                    {company.website ? (
                      <div className="company-am">{company.website}</div>
                    ) : null}
                  </td>
                  <td>
                    <StatusPill status={company.status} />
                  </td>
                  <td className="company-am">{company.accountManager ?? "Unassigned"}</td>
                  <td>{company.openProjects}</td>
                  <td>{company.openTickets}</td>
                </tr>
              ))}
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="company-am">
                    No companies yet. Create your first company above.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
