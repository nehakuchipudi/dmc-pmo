export type TourId = "hero" | "portfolio" | "companies" | "team" | "insights" | "plan";

export type ProductTour = {
  id: TourId;
  title: string;
  kicker: string;
  blurb: string;
  src: string;
  poster: string;
};

export const PRODUCT_TOURS: ProductTour[] = [
  {
    id: "hero",
    title: "The whole workspace",
    kicker: "20 second tour",
    blurb: "Home, company record, project team, insights, and the live plan in one walk.",
    src: "/tours/hero.mp4",
    poster: "/tours/hero.jpg",
  },
  {
    id: "portfolio",
    title: "Portfolio home",
    kicker: "Right work",
    blurb: "See which books are funded, who is overloaded, and what needs a decision this week.",
    src: "/tours/portfolio.mp4",
    poster: "/tours/portfolio.jpg",
  },
  {
    id: "companies",
    title: "Companies",
    kicker: "Client record",
    blurb: "Cascade Ventures in one place: overview, activity, and the people who own the work.",
    src: "/tours/companies.mp4",
    poster: "/tours/companies.jpg",
  },
  {
    id: "team",
    title: "Project team",
    kicker: "Who is on it",
    blurb: "Roles, allocation, capacity, and logged hours on the same project roster.",
    src: "/tours/team.mp4",
    poster: "/tours/team.jpg",
  },
  {
    id: "insights",
    title: "Project insights",
    kicker: "Health",
    blurb: "Schedule, budget, resources, and risk scored from the live warehouse project.",
    src: "/tours/insights.mp4",
    poster: "/tours/insights.jpg",
  },
  {
    id: "plan",
    title: "Project plan",
    kicker: "Schedule",
    blurb: "Milestones, tasks, and an aligned Gantt on Q3 Warehouse Rollout.",
    src: "/tours/plan.mp4",
    poster: "/tours/plan.jpg",
  },
];
