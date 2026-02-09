# PRD: Entries MVP — AI-Powered Bookkeeping Assistant

## Introduction

Entries is an AI-powered bookkeeping assistant that helps accountants close monthly books faster without sacrificing accuracy. The MVP focuses on three interconnected jobs: **reconciliation** (matching transactions across sources), **categorization** (mapping transactions to the chart of accounts), and **anomaly detection** (surfacing variances and unusual transactions proactively).

The core insight is that 10-20% of transactions consume 80% of an accountant's time—typically due to timing differences, duplicates, amount mismatches, and ambiguous categorization. Entries acts as a "smart associate with data chops" that handles the routine work, surfaces problems early, and learns from accountant corrections.

**Tech Stack:** Next.js 14+ (App Router), PostgreSQL with Prisma, TypeScript, Tailwind CSS. QuickBooks and Claude API integrations will be mocked initially.

---

## Goals

- Match human accuracy on reconciliation (≥95%) and categorization (≥90%)
- Reduce time-to-close by 50%
- Pilot accountants say they "can't go back" to their old workflow
- Provide full transparency and explainability for all AI decisions
- Enable bulk operations for efficient review workflows

---

## User Stories

### Phase 1: Foundation & Data Layer

#### US-001: Database Schema Setup
**Description:** As a developer, I need the core database schema so that all entities can be persisted.

**Acceptance Criteria:**
- [ ] Prisma schema defines: User, Workspace, Transaction, Match, Category, Rule, Anomaly, AuditLog
- [ ] Transaction model includes: id, workspaceId, source (bank/qbo), date, description, amount, categoryId, status, confidence, aiReasoning, createdAt, updatedAt
- [ ] Match model links two transactions with confidence score and match type (exact/suggested/partial/manual)
- [ ] Migrations run successfully
- [ ] Seed script creates mock data for one workspace with 50+ transactions
- [ ] Typecheck passes

#### US-002: Mock QuickBooks Data Service
**Description:** As a developer, I need a mock QBO service so that I can develop without real API integration.

**Acceptance Criteria:**
- [ ] Service returns realistic transaction data (vendors, amounts, dates, categories)
- [ ] Includes chart of accounts with standard categories
- [ ] Simulates connection status (connected/disconnected)
- [ ] Data includes edge cases: timing differences, potential duplicates, fee variations
- [ ] Typecheck passes

#### US-003: Mock Bank Statement Data Service
**Description:** As a developer, I need mock bank data that pairs with QBO data for reconciliation testing.

**Acceptance Criteria:**
- [ ] Service returns bank transactions that partially overlap with QBO data
- [ ] Includes transactions with 1-2 day timing differences from QBO counterparts
- [ ] Includes transactions with fee-adjusted amounts (e.g., $970 vs $1000)
- [ ] Includes some unmatched transactions on each side
- [ ] Typecheck passes

#### US-004: Mock AI Categorization Service
**Description:** As a developer, I need a mock Claude API service for categorization suggestions.

**Acceptance Criteria:**
- [ ] Service accepts transaction data and returns category suggestion
- [ ] Returns confidence score (0-1) with each suggestion
- [ ] Returns human-readable reasoning string
- [ ] Uses deterministic logic based on vendor name/description patterns
- [ ] Typecheck passes

#### US-005: Mock AI Matching Service
**Description:** As a developer, I need a mock Claude API service for transaction matching suggestions.

**Acceptance Criteria:**
- [ ] Service accepts two transaction lists and returns match suggestions
- [ ] Each match includes confidence score and match type
- [ ] Returns reasoning for each suggested match
- [ ] Handles timing differences, fee adjustments, and exact matches
- [ ] Typecheck passes

---

### Phase 2: Authentication & Home Page

#### US-006: Authentication Setup
**Description:** As a user, I want to sign in securely so that my client data is protected.

**Acceptance Criteria:**
- [ ] NextAuth.js configured with credentials provider (email/password)
- [ ] Protected routes redirect to login
- [ ] Session persists across page refreshes
- [ ] Logout functionality works
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-007: Home Page — Workspace List
**Description:** As an accountant, I want to see all my client workspaces so that I can select which client to work on.

**Acceptance Criteria:**
- [ ] Displays list of workspaces as cards or table rows
- [ ] Each workspace shows: client name, last sync timestamp, pending items count, anomaly count
- [ ] Empty state shown when no workspaces exist
- [ ] Loading state while fetching
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-008: Home Page — Add Client Button
**Description:** As an accountant, I want to add a new client workspace so that I can onboard new clients.

**Acceptance Criteria:**
- [ ] "Add Client" button visible on home page
- [ ] Opens modal with client name input
- [ ] Creates workspace in database on submit
- [ ] New workspace appears in list after creation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-009: Navigate to Workspace
**Description:** As an accountant, I want to click a workspace to enter it so that I can work on that client's books.

**Acceptance Criteria:**
- [ ] Clicking workspace card navigates to `/workspace/[id]`
- [ ] Workspace ID in URL matches selected workspace
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 3: Workspace Dashboard

#### US-010: Workspace Dashboard Layout
**Description:** As an accountant, I want a dashboard overview of my client's reconciliation status so that I know what needs attention.

**Acceptance Criteria:**
- [ ] Displays client name and QBO connection status (mocked as "Connected")
- [ ] Header with workspace name and back navigation to home
- [ ] Responsive layout works on desktop (1024px+)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-011: Dashboard Summary Cards
**Description:** As an accountant, I want to see key metrics at a glance so that I can prioritize my work.

**Acceptance Criteria:**
- [ ] Four summary cards: Matched, Pending Review, Anomalies, Variance ($)
- [ ] Cards show count/amount from database
- [ ] Cards are clickable and navigate to relevant view
- [ ] Visual distinction for cards needing attention (anomalies, pending)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-012: Dashboard Quick Actions
**Description:** As an accountant, I want quick action buttons so that I can jump to common tasks.

**Acceptance Criteria:**
- [ ] "Review Pending" button navigates to reconciliation view filtered to pending
- [ ] "View Anomalies" button navigates to anomaly queue
- [ ] "Sync Now" button triggers data refresh (mocked)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-013: Period Selector
**Description:** As an accountant, I want to select which month I'm working on so that I can close specific periods.

**Acceptance Criteria:**
- [ ] Dropdown shows current month and previous 11 months
- [ ] Selecting a period filters all dashboard data to that period
- [ ] Selected period persists in URL params
- [ ] Default is current month
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 4: Reconciliation View

#### US-014: Reconciliation Split View Layout
**Description:** As an accountant, I want to see bank and QBO transactions side by side so that I can reconcile them.

**Acceptance Criteria:**
- [ ] Left panel shows bank statement transactions
- [ ] Right panel shows QBO transactions
- [ ] Both panels are scrollable independently
- [ ] Panel headers show source name and transaction count
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-015: Transaction List Display
**Description:** As an accountant, I want to see transaction details in each panel so that I can identify matches.

**Acceptance Criteria:**
- [ ] Each transaction row shows: date, description, amount, category (if assigned)
- [ ] Positive amounts (deposits) styled differently from negative (withdrawals)
- [ ] Matched transactions show visual indicator (checkmark, muted styling)
- [ ] Unmatched transactions are visually prominent
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-016: Transaction Selection
**Description:** As an accountant, I want to select a transaction so that I can see match suggestions.

**Acceptance Criteria:**
- [ ] Clicking a transaction selects it (highlighted state)
- [ ] Selected transaction shows match candidates in opposite panel
- [ ] Match candidates show confidence score badge
- [ ] Only one transaction can be selected at a time
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-017: AI Match Suggestions Display
**Description:** As an accountant, I want to see AI-suggested matches so that I can approve them quickly.

**Acceptance Criteria:**
- [ ] Suggested matches highlighted in opposite panel when transaction selected
- [ ] Confidence score shown (High >90%, Medium 70-90%, Low <70%)
- [ ] Match type shown (Exact, Timing Difference, Fee Adjusted)
- [ ] Hover reveals AI reasoning tooltip
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-018: Approve Match
**Description:** As an accountant, I want to approve a suggested match so that transactions are reconciled.

**Acceptance Criteria:**
- [ ] "Approve Match" button visible when match candidate is highlighted
- [ ] Clicking approve creates Match record in database
- [ ] Both transactions update to "matched" status
- [ ] Visual feedback confirms the match (animation or toast)
- [ ] Summary cards update to reflect new counts
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-019: Manual Match
**Description:** As an accountant, I want to manually match two transactions so that I can handle cases AI missed.

**Acceptance Criteria:**
- [ ] Can select one transaction from each panel
- [ ] "Create Match" button appears when one transaction selected on each side
- [ ] Creates Match record with type "manual"
- [ ] Both transactions update to matched status
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-020: Reject Match Suggestion
**Description:** As an accountant, I want to reject incorrect match suggestions so that AI can learn.

**Acceptance Criteria:**
- [ ] "Reject" button on suggested matches
- [ ] Rejecting removes suggestion from view
- [ ] Rejection logged to audit log
- [ ] Optional: text field for rejection reason
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-021: Bulk Select Transactions
**Description:** As an accountant, I want to select multiple transactions so that I can perform bulk operations.

**Acceptance Criteria:**
- [ ] Checkbox on each transaction row
- [ ] "Select All" checkbox in panel header
- [ ] Selected count displayed
- [ ] Bulk action bar appears when items selected
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-022: Bulk Approve Matches
**Description:** As an accountant, I want to bulk approve high-confidence matches so that I can work efficiently.

**Acceptance Criteria:**
- [ ] "Approve All High-Confidence" button in bulk action bar
- [ ] Only approves matches with confidence > 90%
- [ ] Confirmation modal shows count before approving
- [ ] All approved transactions update status
- [ ] Summary cards refresh
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 5: Transaction Detail & Categorization

#### US-023: Transaction Detail Modal
**Description:** As an accountant, I want to see full transaction details so that I can make informed decisions.

**Acceptance Criteria:**
- [ ] Modal opens when clicking transaction detail icon/button
- [ ] Shows all fields: date, description, amount, source, category, status
- [ ] Shows matched transactions (if any) as clickable links
- [ ] Shows AI reasoning for categorization/match suggestions
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-024: Edit Transaction Fields
**Description:** As an accountant, I want to edit transaction fields so that I can correct errors.

**Acceptance Criteria:**
- [ ] Category, description editable inline in modal
- [ ] Changes save to database on blur or save button
- [ ] Audit log entry created for each change
- [ ] Optimistic UI update with error rollback
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-025: Transaction History Log
**Description:** As an accountant, I want to see who changed what and when so that I can audit changes.

**Acceptance Criteria:**
- [ ] History section in transaction detail modal
- [ ] Shows: timestamp, user, field changed, old value, new value
- [ ] Sorted newest first
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-026: Category Dropdown with AI Suggestion
**Description:** As an accountant, I want a smart category dropdown so that I can categorize quickly.

**Acceptance Criteria:**
- [ ] Searchable dropdown with all chart of accounts categories
- [ ] AI-suggested category shown at top with confidence badge
- [ ] Recent/frequent categories shown after AI suggestion
- [ ] "Why?" button shows AI reasoning
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-027: Apply Category to Similar Transactions
**Description:** As an accountant, I want to apply my category choice to similar transactions so that I don't repeat work.

**Acceptance Criteria:**
- [ ] After categorizing, prompt asks "Apply to X similar transactions?"
- [ ] Similar = same vendor/description pattern
- [ ] Shows preview of affected transactions
- [ ] Bulk update on confirm
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 6: Rules Management

#### US-028: Create Rule from Natural Language
**Description:** As an accountant, I want to create rules in plain English so that future transactions auto-categorize.

**Acceptance Criteria:**
- [ ] Text input for rule: "Transactions from Gusto are Payroll Expense"
- [ ] System parses and confirms interpretation
- [ ] Shows preview of transactions that would match
- [ ] Option to apply retroactively
- [ ] Rule saved to database
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-029: Rules List View
**Description:** As an accountant, I want to see all my rules so that I can manage them.

**Acceptance Criteria:**
- [ ] Table/list of all rules for workspace
- [ ] Shows: rule text, match count, created date, status (active/disabled)
- [ ] Sortable by match count and date
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-030: Edit/Delete Rules
**Description:** As an accountant, I want to modify or remove rules so that I can correct mistakes.

**Acceptance Criteria:**
- [ ] Edit button opens rule in edit mode
- [ ] Delete button with confirmation
- [ ] Enable/disable toggle
- [ ] Changes logged to audit log
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 7: Anomaly Detection

#### US-031: Anomaly Detection on Sync
**Description:** As an accountant, I want anomalies detected automatically so that I catch problems early.

**Acceptance Criteria:**
- [ ] On data sync, system scans for: timing differences, duplicates, unusual amounts, new vendors, amount mismatches
- [ ] Each anomaly saved with type, severity, and description
- [ ] Anomaly count updates on dashboard
- [ ] Typecheck passes

#### US-032: Anomaly Queue View
**Description:** As an accountant, I want a dedicated anomaly queue so that I can review issues efficiently.

**Acceptance Criteria:**
- [ ] List view of all anomalies for workspace
- [ ] Filterable by type (timing, duplicate, amount, vendor)
- [ ] Filterable by severity (high, medium, low)
- [ ] Sortable by date detected and severity
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-033: Anomaly Detail Card
**Description:** As an accountant, I want to understand each anomaly so that I can resolve it.

**Acceptance Criteria:**
- [ ] Clear explanation of why flagged
- [ ] Shows affected transaction(s) with links
- [ ] Contextual info: "This is 3x the average for this vendor"
- [ ] Suggested resolution action
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-034: Resolve Anomaly
**Description:** As an accountant, I want to resolve anomalies so that I can clear my queue.

**Acceptance Criteria:**
- [ ] "Accept" button applies suggested resolution
- [ ] "Dismiss" button marks as reviewed/ignored
- [ ] "Modify" opens transaction detail for manual fix
- [ ] Resolution logged to audit log
- [ ] Anomaly removed from queue after resolution
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 8: Sync to QuickBooks

#### US-035: Sync Summary Modal
**Description:** As an accountant, I want to preview changes before syncing so that I don't make mistakes.

**Acceptance Criteria:**
- [ ] "Sync to QuickBooks" button on workspace dashboard
- [ ] Modal shows summary: X categorizations, Y new matches, Z corrections
- [ ] Expandable sections show individual changes
- [ ] Warning for changes to closed periods (blocked in MVP)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-036: Confirm and Execute Sync
**Description:** As an accountant, I want to confirm and execute sync so that changes are applied.

**Acceptance Criteria:**
- [ ] "Confirm Sync" button requires explicit click
- [ ] Progress indicator during sync (mocked delay)
- [ ] Success toast with summary
- [ ] Error handling with clear message if sync fails
- [ ] All synced changes logged to audit log
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 9: Audit & Activity

#### US-037: Audit Log View
**Description:** As an accountant, I want a full audit log so that I can review all changes.

**Acceptance Criteria:**
- [ ] Dedicated audit log page per workspace
- [ ] Shows: timestamp, user, action, entity, old/new values
- [ ] Filterable by action type and date range
- [ ] Searchable by entity or description
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-038: Recent Activity Feed on Dashboard
**Description:** As an accountant, I want to see recent activity so that I know what's happened.

**Acceptance Criteria:**
- [ ] Dashboard shows last 10 activities
- [ ] Shows: action summary, timestamp, user
- [ ] "View All" link to full audit log
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Functional Requirements

- FR-1: The system must allow users to create and manage multiple client workspaces
- FR-2: The system must ingest transaction data from bank statements and QuickBooks (mocked)
- FR-3: The system must automatically suggest transaction matches with confidence scores
- FR-4: The system must allow users to approve, reject, or manually create matches
- FR-5: The system must automatically suggest transaction categories with explainability
- FR-6: The system must allow users to create categorization rules in natural language
- FR-7: The system must detect and surface anomalies: timing differences, duplicates, unusual amounts, new vendors
- FR-8: The system must allow bulk operations for matches and categorizations
- FR-9: The system must maintain a complete audit log of all changes
- FR-10: The system must require explicit confirmation before syncing changes to QuickBooks
- FR-11: The system must support period selection for month-end close workflow
- FR-12: The system must provide keyboard navigation for power users (future enhancement path)

---

## Non-Goals (Out of Scope)

- Multi-user/team support with role-based permissions
- Xero or other accounting software integrations
- Client-facing portal for document upload
- Automated bank statement fetching (Plaid integration)
- Real QuickBooks API integration (will be mocked)
- Real Claude API integration (will be mocked)
- Mobile-responsive design (desktop-first MVP)
- Automated/scheduled syncs (always manual)
- Priority-based notifications or reminders
- Invoice or payment management

---

## Design Considerations

- **UI Framework:** Tailwind CSS with shadcn/ui components
- **Interactions:** Notion-like experience with inline editing, searchable dropdowns, keyboard navigation
- **Visual Hierarchy:** Attention on exceptions (anomalies, pending), not routine (matched)
- **Confidence Display:** Color-coded badges (green = high, yellow = medium, red = low)
- **Split View:** Reconciliation uses resizable panels for bank vs QBO comparison
- **Modals:** Transaction details, sync confirmation, rule creation use modal overlays
- **Toast Notifications:** Success/error feedback for all actions

---

## Technical Considerations

- **Framework:** Next.js 14+ with App Router
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js with credentials provider
- **State Management:** React Query for server state, Zustand for UI state if needed
- **API:** Next.js API routes, RESTful patterns
- **Mocking:** Dedicated service layer for QBO and AI, easily swappable for real integrations
- **Type Safety:** Strict TypeScript, Zod for runtime validation
- **Testing:** Jest + React Testing Library for critical paths

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Reconciliation accuracy (AI suggestions) | ≥ 95% |
| Categorization accuracy (AI suggestions) | ≥ 90% |
| Time to close (vs. manual baseline) | -50% |
| Anomaly detection rate | 100% of seeded anomalies |
| User can complete full reconciliation flow | End-to-end in dev |

---

## Open Questions

1. Should we use shadcn/ui or build custom components for the reconciliation split view?
2. What's the preferred authentication provider for production (credentials, OAuth, etc.)?
3. Should period selection persist per-workspace or globally per-user?
4. How should we handle very large transaction volumes (pagination vs. virtual scrolling)?
5. Should corrections create "learning" data for when real AI is integrated?
