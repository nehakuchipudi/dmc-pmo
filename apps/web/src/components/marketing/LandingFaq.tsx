"use client";

const QUESTIONS = [
  {
    q: "What is DMC PMO?",
    a: "DMC PMO is one workspace for companies, projects, plans, teams, and outcomes. Leadership sees the book. Delivery runs the job on the same record.",
  },
  {
    q: "What happens on a product walkthrough?",
    a: "We open the live workspace and walk the boards you care about: portfolio home, projects, plans, capacity, and the weekly brief. It is the same product, not a slide deck.",
  },
  {
    q: "Who should join the session?",
    a: "PMO leads, delivery managers, and a finance or operations partner if you want cost and invoices in view. One hour is enough for a first pass.",
  },
  {
    q: "Do we need to load our own data first?",
    a: "No. The demo uses the live sample book so you can see health, risk, and decisions immediately. We can talk through how your companies and projects would land.",
  },
  {
    q: "Can we start with one portfolio?",
    a: "Yes. Most teams start with one book, then add companies and projects as the operating rhythm settles.",
  },
  {
    q: "How do we follow up after the form?",
    a: "Submit a request below with the company and the boards you want to see. We save it here and use that note to prepare the walkthrough.",
  },
] as const;

export function LandingFaq() {
  return (
    <section className="mkt-band mkt-band-faq" id="faq">
      <div className="mkt-band-inner mkt-band-inner-wide">
        <p className="mkt-kicker">FAQ</p>
        <h2>Answers before you book time.</h2>
        <p className="mkt-lead">A short read on the workspace, the walkthrough, and what to send with a demo request.</p>
        <div className="mkt-faq-list">
          {QUESTIONS.map((item) => (
            <details key={item.q} className="mkt-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
