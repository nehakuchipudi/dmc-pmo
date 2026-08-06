import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dillon Morgan PMO",
  description:
    "Professional Services Automation platform for Dillon Morgan Consulting.",
};

const navItems = [
  "Companies",
  "Sales",
  "Projects",
  "Tickets",
  "Retainers",
  "Work",
  "Billing",
  "Reports",
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand">
              <span className="brand-name">Dillon Morgan</span>
              <span className="brand-mark">PMO</span>
            </div>
            <nav className="nav">
              {navItems.map((item) => (
                <Link
                  key={item}
                  href={item === "Companies" ? "/app/companies" : "/app/companies"}
                  className={item === "Companies" ? "active" : ""}
                >
                  {item}
                </Link>
              ))}
            </nav>
            <div className="sidebar-footer">
              Collapse · Help · Feedback · Settings
            </div>
          </aside>
          <div className="main">
            <header className="topbar">
              <div className="search">
                <input placeholder="Search companies, projects, tickets" />
              </div>
              <div className="actions">
                <span>Create (+)</span>
                <span>Tasks</span>
                <span>Time</span>
                <span className="avatar">DW</span>
              </div>
            </header>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
