# Projects + Retainers Redesign Plan

**Status:** Approved to execute  
**Date:** August 6, 2026  
**Inputs:** Accelo retainer/project screenshots (current pain), Monday.com Gantt + board references, user feedback (slow clicks, confusing layout, weak CRUD, basic Gantt)

---

## 1. Problems with current UX

| Pain | Cause |
| --- | --- |
| Slow clicks | Heavy shell re-renders; too many tabs; full-page navigation for every micro-action |
| Confusing Projects | 9 tabs with overlapping content; no clear "how do I edit/delete?" |
| Basic Gantt | Read-only bars; navy→gold gradient; not Monday-like |
| Weak Retainers | Flat allocate-only list; no detail, periods, invoice, email, contact link |
| Files/Notes | Placeholder copy only |

**Principle:** Fewer tabs, inline edit, obvious primary actions, Monday-lively flat colors (no gradients on schedule/Gantt).

---

## 2. Information architecture

### Projects list
- Saved view chips: All open / My projects / At risk / Recently created  
- Primary: **New project**  
- Row click → detail (fast)  
- Row menu: Edit · Duplicate · Delete · Generate invoice · Email PM  
- Columns: Project, Company, Manager, Status (color pill), Progress bar, Due, Budget hrs  

### Project detail (6 tabs, not 9)
1. **Overview** – health, budget, next milestone, quick actions  
2. **Schedule** – List | Gantt toggle (editable plan)  
3. **Files & Notes** – folders + upload + notes stream  
4. **Billing** – materials, generate invoice, send email  
5. **Tickets** – linked tickets  
6. **Signoffs** – request / approve  

Remove redundant Milestones/Tasks/Time as separate tabs; fold into Schedule + Overview.

### Schedule (Monday-inspired)
- Groups = milestones (collapsible)  
- Rows = tasks with inline: name, assignee, start, due, priority, status, progress  
- + Add milestone / + Add task under group  
- Gantt: flat status colors (red/orange/green/blue), diamond milestones, day scale, no gradients  
- Edit dates in list or via Gantt bar click → date popover  

### Retainers list
- New retainer  
- Click row → retainer detail  
- Columns: Title, Company, Type, Manager, Status, Period expiry, Open periods, Usage  

### Retainer detail
- Sidebar: company, contact, manager, type, auto-renew, key dates  
- Tabs: Overview | Periods | Billing | Tickets | Files & Notes  
- Periods table: range, status, usage bar (green/amber/red), Create invoice  
- Actions: Edit, Email contact, Generate invoice, Allocate time  

---

## 3. Feature matrix (this build)

| Feature | Projects | Retainers |
| --- | --- | --- |
| Create / Edit / Delete | Yes | Yes |
| Inline field edit | Schedule tasks | Overview fields |
| Link contact | Company contacts | Primary contact |
| Files + folders | Yes (session mock) | Yes |
| Notes | Yes | Yes |
| Editable schedule + Gantt | Yes | N/A (periods) |
| Generate invoice | Yes | Yes (per period) |
| Send email (outbox) | Yes | Yes |
| Materials lines | Yes | Optional on invoice |

---

## 4. Visual system (schedule / Gantt)

| Token | Hex | Use |
| --- | --- | --- |
| Status Done | `#00C875` | flat green |
| Status Working | `#FDAB3D` | flat orange |
| Status Stuck / At risk | `#E2445C` | flat red |
| Status Todo | `#579BFC` | flat blue |
| Milestone diamond | `#A25DDC` | flat purple |
| Track bg | `#F5F6F8` | neutral |
| No gradients on bars | - | solid fills only |

Keep Dillon Morgan navy/gold for shell chrome; schedule board uses Monday-lively accents.

---

## 5. Performance fixes

1. Narrow Zustand selectors on list/detail pages  
2. `startTransition` for tab switches and view toggles  
3. Prefetch project/retainer detail routes on hover  
4. Avoid remounting CreateForms on every shell render  
5. Local edit buffers for inline cells (commit on blur/Enter)  

---

## 6. Delivery order

1. Expand types + store mutations (CRUD project/retainer, files, notes, periods, materials, task fields)  
2. Redesign Projects list + detail shell  
3. Schedule List + Gantt rewrite  
4. Files & Notes  
5. Retainers list + detail  
6. Invoice/email actions wired  
7. Build, browser verify, redeploy  

---

## 7. Acceptance

1. Add/edit/delete project from list or detail in under one click path  
2. Schedule: add milestone/task, edit dates/status inline, Gantt reflects changes with flat colors  
3. Upload file into folder; add note; both persist in session  
4. Add/edit retainer; open detail; create period; generate invoice; email contact  
5. No gradient bars on Gantt  
6. Tab switch feels instant (no blank freeze)
