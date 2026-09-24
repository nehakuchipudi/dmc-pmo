"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, CircleHelp, MessageSquare, Send, Sparkles, X } from "lucide-react";
import { clsx } from "clsx";
import { roleLabel, useAuth } from "@/lib/auth";
import { answerHelpQuestion, helpStarters, type HelpChatMessage } from "@/lib/help-assistant";
import { HELP_GROUPS, articlesForAudience, type HelpAudience } from "@/lib/help-guide";
import { useAppStore } from "@/lib/store";
import { looksLikeWorkspaceAction, runWorkspaceAgent, workspaceStarters, type AgentProject } from "@/lib/workspace-agent";

function uid() {
  return `h-${Math.random().toString(36).slice(2, 10)}`;
}

export function HelpSupport({
  open,
  onClose,
  audience = "internal",
  startTab = "guide",
}: {
  open: boolean;
  onClose: () => void;
  audience?: HelpAudience;
  startTab?: "guide" | "chat";
}) {
  const { user, can: canDo } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"guide" | "chat">(startTab);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>("home");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<HelpChatMessage[]>([]);
  const threadRef = useRef<HTMLDivElement>(null);

  const articles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articlesForAudience(audience).filter((article) => {
      if (!q) return true;
      return `${article.title} ${article.summary} ${article.keywords.join(" ")} ${article.steps.join(" ")}`
        .toLowerCase()
        .includes(q);
    });
  }, [audience, query]);

  const groups = HELP_GROUPS.filter((group) => articles.some((article) => article.group === group));

  useEffect(() => {
    if (!open) return;
    setTab(startTab);
  }, [open, startTab]);

  useEffect(() => {
    if (!open) return;
    setMessages((prev) => {
      if (prev.length) return prev;
      const welcome = answerHelpQuestion("hello", [], { role: user?.role, audience });
      const starters = audience === "internal" ? workspaceStarters(user?.role) : welcome.starters;
      return [{ id: uid(), role: "assistant", text: welcome.text, hrefs: welcome.hrefs, starters }];
    });
  }, [open, audience, user?.role]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (audience === "portal") setOpenId("portal");
  }, [open, audience]);

  function ask(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next: HelpChatMessage[] = [...messages, { id: uid(), role: "user", text: question }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    window.setTimeout(() => {
      const pending = [...next].reverse().find((message) => message.pending)?.pending;
      if (audience === "internal" && looksLikeWorkspaceAction(question, pending)) {
        const store = useAppStore.getState();
        const companies = store.companies;
        const snapshot: AgentProject[] = store.projects.map((project) => ({
          id: project.id,
          name: project.name,
          status: project.status,
          companyId: project.companyId,
          companyName: companies.find((company) => company.id === project.companyId)?.name ?? project.companyId,
        }));
        const routeId = pathname.includes("/projects/view") ? searchParams.get("id") : null;
        const lastProjectId =
          pending?.intents.find((intent) => intent.projectId)?.projectId ??
          snapshot.find((project) => question.toLowerCase().includes(project.name.toLowerCase()))?.id ??
          null;
        const answer = runWorkspaceAgent(
          question,
          {
            role: user?.role,
            actorName: user?.name ?? "Staff",
            projects: snapshot,
            focusCompanyId: store.focusCompanyId,
            routeProjectId: routeId,
            lastProjectId,
            pending,
            workflow: store.projectWorkflow,
          },
          {
            setProjectStatus: store.setProjectStatus,
            createMilestone: store.createMilestone,
            createTask: (input) => store.createTask(input),
            addProjectNote: store.addProjectNote,
            createTimeEntry: store.createTimeEntry,
            createTicket: store.createTicket,
          },
        );
        if (answer.handled) {
          setMessages([
            ...next,
            {
              id: uid(),
              role: "assistant",
              text: answer.text,
              hrefs: answer.hrefs,
              starters: answer.starters,
              pending: answer.pending,
              actions: answer.actions,
            },
          ]);
          setBusy(false);
          return;
        }
      }
      const answer = answerHelpQuestion(question, next, { role: user?.role, audience });
      setMessages([
        ...next,
        {
          id: uid(),
          role: "assistant",
          text: answer.text,
          hrefs: answer.hrefs,
          articleId: answer.articleId,
          starters: answer.starters,
        },
      ]);
      setBusy(false);
    }, 280);
  }

  if (!open) return null;

  const lastStarters = [...messages].reverse().find((message) => message.role === "assistant" && message.starters?.length)?.starters;
  const starters = lastStarters?.length ? lastStarters : audience === "internal" ? workspaceStarters(user?.role) : helpStarters(user?.role);

  return (
    <div className="help-backdrop" onClick={onClose}>
      <aside className="help-panel fade-in" role="dialog" aria-modal="true" aria-label="Help and Support" onClick={(e) => e.stopPropagation()}>
        <div className="help-head">
          <div>
            <div className="help-kicker">
              <Sparkles size={16} /> Help, Support & AI
            </div>
            <h2>DMC PMO guide</h2>
            <p>{user ? `${roleLabel(user.role)} · ${user.name}` : "Workspace guide"}</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close help">
            <X size={16} />
          </button>
        </div>

        <div className="help-tabs">
          <button type="button" className={clsx("help-tab", tab === "guide" && "is-active")} onClick={() => setTab("guide")}>
            <BookOpen size={15} /> Guide
          </button>
          <button type="button" className={clsx("help-tab", tab === "chat" && "is-active")} onClick={() => setTab("chat")}>
            <MessageSquare size={15} /> Ask AI
          </button>
        </div>

        {tab === "guide" ? (
          <div className="help-guide">
            <input
              className="field-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search every module..."
            />
            <div className="help-guide-list">
              {groups.length === 0 ? (
                <p className="help-empty">No matching topics. Try Projects, Timesheets, Billing, or a role name.</p>
              ) : null}
              {groups.map((group) => (
                <div key={group}>
                  <div className="help-group">{group}</div>
                  {articles
                    .filter((article) => article.group === group)
                    .map((article) => {
                      const locked = Boolean(article.viewCap && user && !canDo(article.viewCap));
                      return (
                        <article key={article.id} className={clsx("help-article", locked && "is-locked")}>
                          <button type="button" className="help-article-title" onClick={() => setOpenId(openId === article.id ? null : article.id)}>
                            <span>{article.title}</span>
                            {locked ? <span className="help-lock">Role limited</span> : null}
                          </button>
                          {openId === article.id ? (
                            <div className="help-article-body">
                              <p>{article.summary}</p>
                              <ol>
                                {article.steps.map((step) => (
                                  <li key={step}>{step}</li>
                                ))}
                              </ol>
                              {article.tips.map((tip) => (
                                <p key={tip} className="help-tip">
                                  {tip}
                                </p>
                              ))}
                              <div className="help-article-actions">
                                {article.href && !locked ? (
                                  <Link href={article.href} className="btn btn-primary text-sm" onClick={onClose}>
                                    Open {article.title}
                                  </Link>
                                ) : null}
                                <button
                                  type="button"
                                  className="btn btn-ghost text-sm"
                                  onClick={() => {
                                    setTab("chat");
                                    ask(`Explain ${article.title}`);
                                  }}
                                >
                                  Ask about this
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="help-chat">
            <div className="help-thread" ref={threadRef}>
              {messages.map((message) => (
                <div key={message.id} className={clsx("help-bubble", message.role === "user" ? "is-user" : "is-bot")}>
                  <div className="help-bubble-text">{message.text}</div>
                  {message.actions?.length ? (
                    <div className="help-actions">
                      {message.actions.map((action) => (
                        <span key={action.label} className={clsx("help-action", action.ok ? "is-ok" : "is-fail")}>
                          {action.ok ? "Done" : "Blocked"} · {action.label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {message.hrefs?.length ? (
                    <div className="help-links">
                      {message.hrefs.map((link) => (
                        <Link key={link.href} href={link.href} className="help-link" onClick={onClose}>
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {busy ? (
                <div className="help-bubble is-bot is-typing">
                  {audience === "internal" ? "Working in the workspace..." : "Looking through the workspace guide..."}
                </div>
              ) : null}
            </div>
            <div className="help-starters">
              {starters.map((item) => (
                <button key={item} type="button" className="help-chip" onClick={() => ask(item)}>
                  {item}
                </button>
              ))}
            </div>
            <form
              className="help-composer"
              onSubmit={(e) => {
                e.preventDefault();
                ask(draft);
              }}
            >
              <input
                className="field-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask a question or tell me to update a record..."
              />
              <button type="submit" className="btn btn-primary" disabled={busy || !draft.trim()} aria-label="Send">
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </aside>
    </div>
  );
}

export function HelpTrigger({ onClick, collapsed }: { onClick: () => void; collapsed?: boolean }) {
  return (
    <button type="button" className="nav-link w-full" onClick={onClick} aria-label="Help and Support">
      <CircleHelp size={18} />
      {!collapsed ? <span>Help & Support</span> : null}
    </button>
  );
}
