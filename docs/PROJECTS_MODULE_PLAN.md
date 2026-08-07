# Projects Module Enhancement Plan

**Date:** August 7, 2026  
**Status:** Draft approved for implementation (this branch)  
**Inputs:** Current app screenshots, WBS hierarchy reference, DMC steel theme, PM productivity goals

---

## 1. What we see today (gap analysis)

| Area | Current state | Problem |
| --- | --- | --- |
| Schedule | 2 levels: Milestone → Task | Missing middle workstream/sub-phase; no duration rollup |
| Gantt | Flat list of milestones + tasks | Does not mirror WBS indent; no L2 groups |
| Overview | Summary metrics + next milestones | No Scope; no Edit project in header |
| Files & Notes | Bulky cards, dashed "new folder", Move dropdown on every card | Looks dated; hard to scan; no task linking |
| Billing / Tickets / Signoffs | Functional basics | Weak cross-links to schedule/tasks |
| Users / Roles | Login role picker only | No in-app team/role management |
| Task attachments | None | Cannot link files, images, or URLs to work |

---

## 2. Target information architecture

### Project detail tabs (4)

1. **Overview** – summary, scope, phases, tickets, signoffs, quick actions, **Edit project**
2. **Plan** – 3-level WBS List + Gantt (Phase → Workstream → Task)
3. **Files** – Drive-style browser (folders + compact rows); Notes as sub-panel
4. **Billing** – materials, totals, generate invoice

Scope, Tickets, and Signoffs fold into Overview. Users/Roles live under Settings.

---

## 3. Schedule: 3-level hierarchy (from your WBS image)

```
L1 Phase          (summary: bold, expandable)
  L2 Workstream   (summary: bold, indented)
    L3 Task       (work item: regular weight)
```

### Behavior (PM-grade)

| Field | L1 / L2 summary | L3 task |
| --- | --- | --- |
| Name | Editable | Editable |
| Duration (days) | Rolled up from children | Editable or derived from dates |
| Start | Min(child starts) | Editable |
| Due / End | Max(child dues) | Editable |
| Assignee | Optional owner | Required |
| Status / Progress | Rolled up (% done) | Editable |
| Links | Optional | Files / images / URLs |

### Actions

- **+ Add phase** (L1)
- **+ Add workstream** under phase (L2)
- **+ Add task** under workstream (L3)
- Collapse / expand at L1 and L2
- Delete with orphan rules (move children up or confirm cascade)
- Gantt mirrors indent: phase summary bar, group bar, task bars + diamonds for signoff milestones

### Data model change

- `Milestone.kind`: `"phase" | "group"`
- `Milestone.parentId?`: group → phase
- `Task.milestoneId`: prefer group id (L2); allow phase if ungrouped
- `Task.links[]`: `{ id, type: file|url|image, label, href, fileId? }`
- `Project.scope`: structured scope block

---

## 4. Tab-by-tab workflows (PM view)

### Overview
- View health, budget burn, margin, next L1/L2 due items
- **Edit project** (name, company, manager, status, dates, budget, description)
- Jump to Plan / Billing
- Delete / toggle at-risk

### Scope
- Edit objectives (rich text / textarea)
- Manage bullet lists: In scope, Out of scope, Deliverables, Assumptions
- Optional: link deliverables → schedule tasks
- Save persists in session store

### Schedule
- List WBS with Duration | Start | End | Assignee | Status | Progress | Links
- Inline edit L3; summary rows auto-rollup
- Gantt uses same tree order and soft flat colors
- Attach link/file to task from row action

### Files
- Left: folder list (compact)
- Right: dense table rows (name, type, size, linked tasks, actions menu)
- Upload into selected folder; create folder inline
- Notes as secondary toggle (not competing cards)
- From row: Open · Link to task · Move · Delete

### Billing
- Materials lines + totals
- Generate invoice from project
- Show hours vs materials split

### Tickets
- List linked tickets; create ticket with project prefilled
- Click through to ticket detail

### Signoffs
- Request / approve against L1 phases or marked L2 groups
- Status chips soft pastel

---

## 5. Users, roles, and permissions (Settings)

| Role | Projects | Schedule | Files | Billing | Users |
| --- | --- | --- | --- | --- | --- |
| Admin | Full | Full | Full | Full | Manage |
| PM | Full on assigned | Full | Full | Generate | View team |
| Staff | View + log time | Edit assigned tasks | Upload | View | — |
| Finance | View | View | View | Full invoices | — |
| Client (portal) | Shared only | Read milestones | Client files | Pay | — |

**In-app (this build):** `/app/settings` Users panel  
- List team with avatar, role, email  
- Add / edit / deactivate (session mock)  
- Role change updates permission hints in UI (disable Delete for Staff, etc.)

---

## 6. Files UX redesign principles

1. No bulky file cards as primary UI  
2. Folder rail + table (like Drive / Notion)  
3. Actions in a quiet `⋯` menu, not always-visible Move dropdown  
4. Soft steel accents, white canvas, thin scrollbars  
5. Show **Linked tasks** column when a file is attached to work  

---

## 7. Delivery order (this implementation)

1. Types + seed for 3-level plan + scope + task links + team users  
2. Schedule List + rollups + Gantt tree  
3. Files tab redesign + link file/URL to task  
4. Scope tab + Edit project on detail  
5. Settings → Users & roles panel  
6. Build, browser verify, redeploy  

---

## 8. Acceptance

1. WBS shows Phase → Workstream → Task with duration/start/end rollups  
2. Gantt order matches WBS indent; soft colors  
3. Scope tab editable; Edit project available on detail  
4. Files tab is compact table + folder rail; task can hold file/URL links  
5. Users list supports add/edit role in Settings  
6. White background preserved; no black buttons; no neon
