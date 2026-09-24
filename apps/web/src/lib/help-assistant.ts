import { can, type Capability } from "./rbac";
import type { Role } from "./types";
import { HELP_ARTICLES, ROLE_HELP, type HelpArticle, type HelpAudience } from "./help-guide";
import { roleLabel } from "./help-labels";

export type HelpChatRole = "user" | "assistant";

export interface HelpChatMessage {
  id: string;
  role: HelpChatRole;
  text: string;
  hrefs?: { href: string; label: string }[];
  articleId?: string;
  starters?: string[];
}

export interface HelpAnswer {
  text: string;
  hrefs: { href: string; label: string }[];
  articleId?: string;
  starters?: string[];
}

const STOP = new Set([
  "the",
  "and",
  "for",
  "you",
  "your",
  "how",
  "what",
  "where",
  "when",
  "why",
  "can",
  "do",
  "i",
  "a",
  "an",
  "to",
  "of",
  "in",
  "on",
  "is",
  "it",
  "this",
  "that",
  "with",
  "from",
  "please",
  "tell",
  "me",
  "about",
  "show",
]);

function tokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP.has(word));
}

function visibleArticles(audience: HelpAudience, role?: Role | null) {
  return HELP_ARTICLES.filter((article) => {
    if (article.audience !== audience && article.audience !== "both") return false;
    if (role && article.viewCap && !can(role, article.viewCap)) return false;
    return true;
  });
}

function scoreArticle(article: HelpArticle, queryTokens: string[], raw: string) {
  let score = 0;
  const title = article.title.toLowerCase();
  const hay = `${article.title} ${article.summary} ${article.keywords.join(" ")} ${article.steps.join(" ")}`.toLowerCase();
  if (raw.includes(title)) score += 12;
  for (const word of queryTokens) {
    if (title === word || title.includes(word)) score += 8;
    if (article.keywords.some((key) => key === word || key.includes(word) || word.includes(key))) score += 6;
    if (hay.includes(word)) score += 2;
  }
  return score;
}

function hrefsFor(article: HelpArticle): { href: string; label: string }[] {
  if (!article.href) return [];
  return [{ href: article.href, label: `Open ${article.title}` }];
}

function articleAnswer(article: HelpArticle, role?: Role | null): HelpAnswer {
  const lines = [
    `${article.title}: ${article.summary}`,
    article.steps.length ? `How to use it:\n${article.steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}` : "",
    article.tips[0] ? article.tips[0] : "",
  ].filter(Boolean);
  if (role && article.viewCap && !can(role, article.viewCap)) {
    lines.push(`Your ${roleLabel(role)} role cannot open this module. Ask an Admin if you need access.`);
  }
  return {
    text: lines.join("\n\n"),
    hrefs: role && article.viewCap && !can(role, article.viewCap) ? [] : hrefsFor(article),
    articleId: article.id,
    starters: followUps(article),
  };
}

function followUps(article: HelpArticle) {
  if (article.id === "billing" || article.id === "portal-billing") return ["How do I create an invoice?", "Who can record a payment?"];
  if (article.id === "timesheets") return ["How do I log time?", "Who can approve timesheets?"];
  if (article.id === "projects" || article.id === "portal-projects") return ["How do I add a project plan?", "Who can change project status?"];
  if (article.id === "users") return ["What can Staff do?", "How do I add a user?"];
  if (article.id === "ideas") return ["How do I convert an idea?"];
  if (article.id === "portal-tickets") return ["How do I raise a ticket?", "Where are my invoices?"];
  if (article.id === "portal-retainers") return ["Where are my invoices?", "How do I approve a signoff?"];
  return [`What else should I know about ${article.title}?`];
}

function roleAnswer(role: Role | undefined | null, query: string): HelpAnswer | null {
  const wantsRole = /role|permission|access|allowed|cannot|can't|restricted|rights|admin|staff|finance|leadership|pm|client/.test(
    query,
  );
  if (!wantsRole) return null;
  const mentioned =
    (/admin/.test(query) && "admin") ||
    (/leadership|director/.test(query) && "leadership") ||
    (/\bpm\b|project manager/.test(query) && "pm") ||
    (/finance/.test(query) && "finance") ||
    (/staff|consultant/.test(query) && "staff") ||
    (/client|portal/.test(query) && "client") ||
    role ||
    null;
  if (!mentioned) return null;
  const text = [
    ROLE_HELP[mentioned],
    role ? `You are signed in as ${roleLabel(role)}.` : "",
    "An Admin assigns roles on Users & roles. Sign up cannot create an Admin.",
  ]
    .filter(Boolean)
    .join("\n\n");
  return {
    text,
    hrefs: mentioned === "client" ? [{ href: "/portal", label: "Open portal" }] : [{ href: "/app/settings", label: "Open Users and roles" }],
    articleId: "users",
    starters: ["What can Staff do?", "What can Finance do?", "How do I add a user?"],
  };
}

function greeting(role?: Role | null): HelpAnswer {
  const who = role ? ` You are signed in as ${roleLabel(role)}.` : "";
  return {
    text: `I am the DMC PMO guide. Ask about any module, how to create a record, or what your role can do.${who}`,
    hrefs: [],
    starters: ["How do I create an invoice?", "How do I log time?", "What can my role do?", "Explain the project workspace"],
  };
}

export function answerHelpQuestion(
  rawQuestion: string,
  history: HelpChatMessage[],
  options: { role?: Role | null; audience?: HelpAudience },
): HelpAnswer {
  const audience = options.audience ?? "internal";
  const role = options.role;
  const raw = rawQuestion.trim().toLowerCase();
  if (!raw) return greeting(role);
  if (/^(hi|hello|hey|help|thanks|thank you)\b/.test(raw) && raw.split(/\s+/).length < 4) return greeting(role);

  const roleHit = roleAnswer(role, raw);
  if (roleHit && /role|permission|access|allowed|cannot|can't|restricted|rights|what can/.test(raw)) {
    return roleHit;
  }

  const queryTokens = tokens(rawQuestion);
  const lastArticleId = [...history].reverse().find((m) => m.articleId)?.articleId;
  const catalog = HELP_ARTICLES.filter((article) => article.audience === audience || article.audience === "both");
  const ranked = catalog
    .map((article) => ({
      article,
      score: scoreArticle(article, queryTokens, raw) + (lastArticleId === article.id && queryTokens.length <= 4 ? 5 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 4) {
    if (roleHit) return roleHit;
    const open = visibleArticles(audience, role)
      .slice(0, 6)
      .map((article) => article.title)
      .join(", ");
    return {
      text: `I did not find that exact topic. Try naming a module such as Projects, Timesheets, Billing, Ideas, or Users and roles. You can open ${open || "Home"} from the left nav.`,
      hrefs: [{ href: audience === "portal" ? "/portal" : "/app/home", label: audience === "portal" ? "Open portal" : "Open Home" }],
      starters: ["Explain Home", "How do I create a project?", "What can my role do?"],
    };
  }

  const extras = ranked
    .slice(1, 3)
    .filter((row) => row.score >= 6 && row.article.id !== best.article.id)
    .map((row) => row.article);

  const primary = articleAnswer(best.article, role);
  if (extras.length) {
    primary.text += `\n\nRelated: ${extras.map((article) => article.title).join(", ")}.`;
    extras.forEach((article) => {
      if (article.href && (!role || !article.viewCap || can(role, article.viewCap))) {
        primary.hrefs.push({ href: article.href, label: `Open ${article.title}` });
      }
    });
  }
  if (roleHit && /cannot|can't|restricted/.test(raw)) {
    primary.text += `\n\n${roleHit.text}`;
  }
  return primary;
}

export function helpStarters(role?: Role | null): string[] {
  if (role === "staff") return ["How do I log time?", "How do I update my task?", "What can Staff do?", "How do I submit an idea?"];
  if (role === "finance") return ["How do I create an invoice?", "How do I approve time?", "Where are retainers?", "What can Finance do?"];
  if (role === "pm") return ["How do I create a project?", "How do I add someone to a project team?", "How do I generate an invoice?"];
  if (role === "leadership") return ["How do I add a strategy objective?", "How do I convert an idea?", "How do gates work?"];
  if (role === "client") return ["How do I raise a ticket?", "Where are my invoices?", "How do I approve a signoff?"];
  return ["How do I add a user?", "How do I create an invoice?", "Explain the project workspace", "What can each role do?"];
}

export function canSeeHelpHref(role: Role | undefined | null, href: string) {
  const article = HELP_ARTICLES.find((item) => item.href === href);
  if (!article?.viewCap) return true;
  if (!role) return true;
  return can(role, article.viewCap as Capability);
}
