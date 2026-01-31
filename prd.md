# Entries MVP — Product Requirements Document

**Version:** 1.3
**Last Updated:** January 2025
**Status:** Ready for Engineering Review

---

## 1. Executive Summary

Entries is an AI-powered bookkeeping assistant that helps accountants close monthly books faster without sacrificing accuracy. The MVP focuses on three interconnected jobs: **reconciliation** (matching transactions across sources), **categorization** (mapping transactions to the chart of accounts), and **anomaly detection** (surfacing variances and unusual transactions proactively).

The core insight is that 10-20% of transactions consume 80% of an accountant's time—typically due to timing differences, duplicates, amount mismatches, and ambiguous categorization. Entries acts as a "smart associate with data chops" that handles the routine work, surfaces problems early, and learns from accountant corrections.

**MVP Success Criteria:**
- Match human accuracy on reconciliation and categorization
- Reduce time-to-close by 50%
- Pilot accountants say they "can't go back" to their old workflow

---

## 2. Product Philosophy

### 2.1 Entries is Infrastructure for Agentic Work

Entries is building the **infrastructure layer for agentic work**—a knowledge graph and intelligence platform that enables AI agents to perform complex, multi-step business tasks reliably and transparently.

**Month-end close is the wedge.** It's a painful, recurring, high-value problem that requires ingesting data from multiple sources, reconciling discrepancies, applying judgment, and producing accurate outputs. Solving it well forces us to build the foundational capabilities—data ingestion, entity resolution, context capture, explainability, human-in-the-loop controls—that generalize to any agentic workflow.

### 2.2 Entries is the Data Team, Not the System of Record

Entries does not replicate functionality that existing tools (QuickBooks, Xero, banks) have already mastered.

| Entries Does | Entries Does NOT |
|--------------|------------------|
| Ingest and unify data from multiple sources | Store authoritative financial records |
| Match transactions across sources | Replace QuickBooks as the ledger |
| Suggest categorizations with explainability | Auto-commit changes without approval |
| Surface anomalies proactively | Own the chart of accounts |
| Learn from accountant corrections | Manage invoicing or payments |
| Answer questions about data in natural language | Replace bank feeds or statement sources |

**Analogy:** Entries is to financial data what a data team is to a business—it connects, cleans, analyzes, and surfaces insights, but it doesn't replace the source systems.

### 2.3 Design Principles

1. **Trust through transparency** — Every AI decision is explainable. Confidence is always visible. The human is always in control.

2. **Review, don't do** — Entries does the work; the accountant reviews. Bulk operations for efficiency. Clear visual hierarchy: attention on exceptions, not routine.

3. **Learn from corrections** — Every correction is an opportunity to improve. Capture context when offered, but never block workflow.

4. **Notion-like interactions** — Relation fields via searchable dropdowns. Inline editing. Keyboard-first navigation.

---

## 3. Target User

**Primary:** Tech-forward small business accountants (1-50 clients) who:
- Value accuracy over speed (but want both)
- Are skeptical of "AI magic" and need to audit everything
- Currently spend 2-4 hours per client on month-end close
- Use QuickBooks Online as their primary accounting software
- Pull data from multiple sources (bank statements, payroll, receipts)

**Not for MVP:**
- Large accounting firms with complex multi-user workflows
- Accountants who don't use QuickBooks Online
- Businesses doing their own books (no accountant)

---

## 4. Jobs to Be Done

### Job 1: Reconciliation
> *As an accountant, I want to match transactions between bank statements and QuickBooks so that I can confirm all transactions are accounted for and identify discrepancies.*

**Current pain:**
- Manual comparison in Excel or side-by-side windows
- Timing differences cause false mismatches
- Duplicates are easy to miss
- Process repeats monthly for each client

**Entries solution:**
- Unified view of transactions from both sources
- AI-powered matching with confidence scores
- Automatic detection of timing differences, duplicates, amount mismatches
- Bulk approval for high-confidence matches

### Job 2: Categorization
> *As an accountant, I want transactions automatically categorized to the correct chart of accounts so that I spend less time on data entry and more time on advisory.*

**Current pain:**
- Same vendors categorized differently across months
- Rules in QBO are keyword-based and brittle
- New vendors require manual lookup
- Context about "why this category" lives in accountant's head

**Entries solution:**
- AI categorization using vendor history, amount patterns, and learned rules
- Natural language rules ("Stripe fees go to Payment Processing")
- Explainability for every suggestion
- Corrections propagate to similar transactions

### Job 3: Anomaly Detection
> *As an accountant, I want to be alerted to unusual transactions or patterns so that I can catch errors or fraud early.*

**Current pain:**
- Anomalies discovered late in close process
- No systematic way to flag "unusual"
- Relies on accountant memory ("this is higher than usual")

**Entries solution:**
- Proactive surfacing of anomalies during sync
- Categories: new vendors, unusual amounts, timing differences, duplicates
- Severity levels to prioritize review
- Contextual explanations ("This is 3x the average for this vendor")

---

## 5. Feature Specifications

### 5.1 Navigation & Information Architecture

#### App Shell
- **Sidebar Navigation** — Persistent left sidebar with collapsible state
- **Breadcrumb Header** — Context-aware breadcrumb trail at top of each page
- **Workspace Switcher** — Searchable dropdown for switching between client workspaces

#### Search Modal
- **Trigger:** Click "Search" in sidebar or press `Cmd+K` / `Ctrl+K`
- **UI:** Centered dialog with command palette (cmdk) — Notion-style
- **Scope:** All pages across all workspaces in the organization
- **Results grouped by:**
  - **General** — Home
  - **Per workspace** — All 7 workspace pages (Event Feed, Data Connectors, Docs, Entries AI, Reconcile, Categorize, Rules)
- **Filtering:** Real-time fuzzy filtering as user types (handled by cmdk)
- **Navigation:** Clicking a result navigates to that page and closes the modal
- **Dismiss:** Escape key or clicking outside the modal

#### Sidebar Structure
```
[Logo: Entries]

Home
Search (opens search modal)

[Workspace Switcher: Client Name ▼]

Data
├── Event Feed (default workspace home)
├── Data Connectors
└── Docs

Productivity
├── Entries AI
├── Reconcile
└── Categorize

Knowledge
└── Rules

(spacer — pushes collapse to bottom)

[Collapse]
```

**Sidebar Design Rules:**
- Logo, Home, Search, and Workspace Switcher are **grouped together** in a single top container with even internal spacing (`gap-1`)
- The top group and workspace nav sections (Data, Productivity, Knowledge) share consistent vertical spacing (`mb-6` / 24px) between groups
- Section labels (Data, Productivity, Knowledge) use **sentence case** (not uppercase)
- The Collapse button is **always pinned to the bottom** of the sidebar, even when no workspace is selected (home screen state). An empty flex spacer fills remaining vertical space when workspace nav sections are absent.

#### Breadcrumb Pattern
`Writeoff > {Workspace Name} > {Current Page}`

- Writeoff links to Home (accounting firm level)
- Workspace Name links to Event Feed (workspace default)
- Current Page is non-clickable

### 5.2 Home Page

**Purpose:** Central hub for managing all client workspaces with a welcoming, lighthearted tone.

**URL:** `/`

**Layout (top to bottom):**

1. **Greeting Banner**
   - Large centered heading with accounting-themed message
   - Messages cycle randomly on each page load
   - Examples: "Time to make the numbers sing.", "Let's balance those books.", "Ready to reconcile?"
   - Typography: `text-[2.5rem] font-semibold tracking-tight`

2. **Clients Section**
   - Section header: "Clients" (sentence case, `h3` / `text-sm font-medium`)
   - "Add Client" button (right-aligned)
   - List view (not cards) with client rows
   - Each row shows:
     - Client name (left)
     - Pending notification badge (blue pill with count, if > 0)
     - Connected app logos (right-aligned, fetched from logo.dev)
   - Logos use ConnectorLogo component with size="sm" (24px)
   - Click row → navigates to workspace Event Feed

3. **Recent Activity Section**
   - Section header: "Recent activity" (sentence case, `h3` / `text-sm font-medium`)
   - Master event feed combining events from all workspaces
   - Columns: Source icon | Client name | Event type | Description | Timestamp
   - Sources shown with ConnectorLogo or Sparkles icon for AI
   - Click row → navigates to workspace Event Feed

**Elements:**
- Breadcrumb: `Writeoff > Home`
- Max width container: `max-w-5xl mx-auto`
- Spacing between sections: `space-y-10`

### 5.3 Event Feed

**Purpose:** Timeline of all business events observed across connected apps.

**URL:** `/workspace/{id}/event-feed`

**Elements:**
- Immutable event log showing what happened
- Columns: Occurred (timestamp), Source (QBO, Plaid, Entries), Description
- Left sidebar with Data Sources list and filter controls
- Filter by source, date range
- Events are clickable for detail view

**Event Types:**
- Transactions from connected apps (QBO, Plaid, Stripe, etc.)
- AI actions (matched, categorized)
- User actions (corrections, approvals)

### 5.4 Data Connectors

**Purpose:** Manage integrations with external data sources.

**URL:** `/workspace/{id}/connectors`

**Elements:**
- Connected Apps section showing active integrations
  - Status, last sync time, account info
  - Sync and settings actions
- Available Connectors grid
  - OAuth flow to connect new apps
  - Categories: Accounting, Payments, Payroll, E-commerce, CRM
- Request Connector CTA for missing integrations

### 5.5 Docs

**Purpose:** Document storage for bank statements, receipts, and other financial documents.

**URL:** `/workspace/{id}/docs`

**Elements:**
- Upload area with drag-and-drop
- Document list with columns: Name, Type, Uploaded, Status
- Document types: Bank Statement, Receipt, Invoice, Other
- Status states: Matched (linked to event), Pending Match, Unprocessed
- AI extracts structured data and matches to events
- Preview, download, and action buttons on hover

### 5.6 Entries AI

**Purpose:** Notion-style AI assistant for asking questions about financial data.

**URL:** `/workspace/{id}/ai`

**Elements:**
- Chat interface with message history
- Suggested prompts for common queries:
  - Revenue trends
  - Largest expenses
  - Anomalies
  - Unmatched items
  - Category breakdowns
- AI can analyze transactions, identify patterns, answer questions
- Clear disclaimer about verification

### 5.7 Reconcile

**Purpose:** Match transactions between bank and QBO.

**URL:** `/workspace/{id}/reconcile`

**Layout:** Split view
- Left panel: Bank statement transactions
- Right panel: QBO transactions
- Visual connections between matched items

**Interactions:**
- Click to select transaction
- Drag to manual match (or use button)
- Hover reveals match suggestions with confidence
- Bulk select for batch operations

**Match States:**
- Exact match (same amount, date, description)
- Suggested match (AI confidence > threshold)
- Partial match (amount differs, likely fee)
- Unmatched (no candidate found)

### 5.8 Categorize

**Purpose:** Review and approve AI-suggested categorizations.

**URL:** `/workspace/{id}/categorize`

**Elements:**
- Stats cards: Uncategorized, High Confidence, Needs Review, No Suggestion
- Transaction table with columns:
  - Date, Description, Amount
  - AI Suggestion with confidence indicator
  - Category dropdown for selection/override
- Bulk actions: Accept all high confidence
- AI reasoning popover on suggestion click

### 5.9 Rules

**Purpose:** Manage categorization rules that automate future transactions.

**URL:** `/workspace/{id}/rules`

**Rule creation:**
- Natural language input: "Transactions from Gusto are Payroll Expense"
- System parses and confirms interpretation
- Option to apply retroactively

**Rule list:**
- All active rules with match counts
- Enable/disable toggle
- Edit/delete actions

### 5.10 Transaction Detail Modal

**Purpose:** Deep inspection of a single transaction and its relations.

**Elements:**
- All transaction fields (date, description, amount, source, category)
- Matched transactions (clickable relations)
- AI reasoning for categorization/match
- Edit capability for all fields
- History log (who changed what, when)

### 5.11 Sync to QuickBooks

**Flow:**
1. User clicks "Sync to QuickBooks"
2. Summary modal shows what will change
3. User confirms
4. Progress indicator during sync
5. Success/failure report

**Guardrails:**
- Never auto-sync
- Requires explicit confirmation
- Changes to closed periods blocked

---

## 6. Example Scenarios

### Timing Difference
- Bank: $5,000 charge on Oct 31
- QBO: Same charge dated Nov 1
- Entries: "Likely timing difference—same amount, 1-day gap, same vendor. Match with note?"

### Processor Fee
- Bank: $970 deposit
- Invoice: $1,000 payment
- Entries: "Amount mismatch: $30 difference likely Stripe fee (3%). Match and create fee entry?"

### Duplicate
- QBO: Two $500 "Office Rent" entries
- Bank: One $500 debit
- Entries: "Potential duplicate in QBO. Review and remove duplicate?"

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| Reconciliation accuracy | ≥ 95% |
| Categorization accuracy | ≥ 90% |
| Time to close | -50% |
| Anomaly detection rate | 100% |
| User satisfaction | NPS > 50 |

---

## 8. MVP Scope

### In Scope (P0)
- Home page with client list
- Sidebar navigation with workspace switcher
- Event Feed as workspace home
- Data Connectors management
- Document storage and matching
- Entries AI chat interface
- Reconciliation split view
- Categorization review interface
- AI-powered matching with confidence
- AI-powered categorization with explainability
- Manual corrections with optional context
- Rules management
- Bulk approve/reject
- Sync to QuickBooks (with confirmation)
- Audit log

### Out of Scope (Future)
- Multi-user/team support
- Xero integration
- Client-facing portal
- Automated bank statement fetching
- Anomaly detection queue (moved to future)

---

## 9. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2025 | Finalized for engineering review |
| 1.1 | Jan 2025 | Added sidebar navigation, breadcrumbs, Event Feed, Data Connectors, Docs, Entries AI, and Categorize pages. Updated information architecture. |
| 1.2 | Jan 2025 | Sidebar refinements: sentence case section labels, increased section spacing, collapse button always pinned to bottom. |
| 1.3 | Jan 2025 | Added search modal (Cmd+K command palette) for navigating to any page across all workspaces. Home page section headers changed from overline/uppercase to sentence case h3. |
