# PRD: Alerts — Smart Assistant for Accountants

## Introduction

Alerts is a smart assistant layer that surfaces anomalies, asks clarifying questions, reports system events, and delivers proactive insights — all in one place. Accountants open Alerts first thing every morning to see if anything requires their attention across all their clients. Some alerts are informational ("FYI"), while others require explicit user input before work can proceed ("Requires Action"). Resolved alerts move to an audit trail so nothing is lost.

The feature spans two surfaces: a **global alerts view** on the home screen (all clients at a glance) and a **workspace-specific alerts page** for drilling into a single client.

## Goals

- Give accountants a single "morning briefing" across all clients
- Surface anomalies, AI questions, system events, and proactive insights automatically
- Clearly distinguish alerts that need user action from informational ones
- Allow inline responses so accountants can act without navigating away
- Support snooze/defer and escalate/assign workflows for team collaboration
- Maintain a resolved alerts audit trail for accountability and review

## User Stories

### US-001: Alert data model
**Description:** As a developer, I need a database schema to store alerts so they can be created, queried, and updated across the system.

**Acceptance Criteria:**
- [ ] Create `Alert` model in Prisma schema with fields: `id`, `workspaceId`, `type` (anomaly | ai_question | system | insight), `priority` (requires_action | fyi), `status` (active | snoozed | resolved), `title`, `body` (markdown), `entityType` (nullable — transaction, match, rule, etc.), `entityId` (nullable — links to source entity), `responseType` (nullable — confirm | select | text | none), `responseOptions` (nullable JSON — for select-type responses), `responseValue` (nullable — user's response), `resolvedAt`, `resolvedBy`, `snoozedUntil`, `assignedTo` (nullable userId), `createdAt`, `updatedAt`
- [ ] Add relation from `Alert` to `Workspace` and `User` (assignedTo, resolvedBy)
- [ ] Generate and run migration successfully
- [ ] Typecheck passes

### US-002: Seed sample alerts
**Description:** As a developer, I need realistic sample alerts so I can build the UI against real data before alert generation is automated.

**Acceptance Criteria:**
- [ ] Seed script creates at least 12 alerts across multiple workspaces covering all 4 types (anomaly, ai_question, system, insight)
- [ ] Mix of "requires_action" and "fyi" priorities
- [ ] Mix of statuses: mostly active, a few resolved, one snoozed
- [ ] Some alerts have `responseType` set (confirm, select, text) with appropriate `responseOptions`
- [ ] Some alerts link to existing entities (transactions, anomalies) via `entityType`/`entityId`
- [ ] Typecheck passes

### US-003: Workspace alerts page
**Description:** As an accountant, I want a dedicated Alerts page within each workspace so I can review all alerts for a specific client.

**Acceptance Criteria:**
- [ ] New page at `/workspace/[id]/alerts`
- [ ] Add "Alerts" item to sidebar navigation under a logical section (e.g., above Event Feed or in its own top-level position)
- [ ] Sidebar nav item shows badge count of active "requires_action" alerts for the current workspace
- [ ] Page displays list of active alerts, sorted with "requires_action" first, then "fyi", then by recency
- [ ] Each alert card shows: type icon, priority indicator (visual distinction between requires_action and fyi), title, body preview, timestamp, and linked entity (if any)
- [ ] Clicking a linked entity navigates to its detail page (e.g., event detail)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Global alerts view on home page
**Description:** As an accountant, I want to see alerts across all my clients on the home screen so I get a single morning briefing.

**Acceptance Criteria:**
- [ ] New section on the home page (above or alongside recent activity) showing aggregated alerts
- [ ] Alerts grouped by workspace/client name
- [ ] Shows count summary per workspace (e.g., "Acme Corp — 3 requires action, 5 fyi")
- [ ] Expandable to see individual alerts per workspace
- [ ] Clicking an alert navigates to the workspace alerts page (or directly to the alert)
- [ ] Only shows active alerts (not resolved)
- [ ] Workspace rows on the home page show alert badge count (requires_action count)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Alert inline response — confirm type
**Description:** As an accountant, I want to confirm or reject AI suggestions directly from the alert card so I don't have to navigate elsewhere.

**Acceptance Criteria:**
- [ ] Alerts with `responseType: "confirm"` show "Approve" and "Reject" buttons
- [ ] Clicking "Approve" saves the response, marks alert as resolved, and records `resolvedAt` + `resolvedBy`
- [ ] Clicking "Reject" prompts for an optional reason (text input), then resolves the alert
- [ ] Resolved alert moves to the Resolved tab
- [ ] Server action handles the mutation with proper error handling
- [ ] Toast notification confirms the action
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Alert inline response — select type
**Description:** As an accountant, I want to choose from options the AI presents (e.g., pick the correct category) directly in the alert.

**Acceptance Criteria:**
- [ ] Alerts with `responseType: "select"` render options from `responseOptions` as selectable choices (radio buttons or button group)
- [ ] Selecting an option and submitting resolves the alert with the chosen value stored in `responseValue`
- [ ] Alert moves to Resolved tab after submission
- [ ] Server action handles the mutation
- [ ] Toast notification confirms the action
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Alert inline response — text type
**Description:** As an accountant, I want to type a free-text response when the AI asks an open-ended question.

**Acceptance Criteria:**
- [ ] Alerts with `responseType: "text"` show a text input field with a submit button
- [ ] Submitting saves the response in `responseValue` and resolves the alert
- [ ] Alert moves to Resolved tab
- [ ] Server action handles the mutation
- [ ] Toast notification confirms the action
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Dismiss/acknowledge alert
**Description:** As an accountant, I want to dismiss FYI alerts I've read so they don't clutter my active view.

**Acceptance Criteria:**
- [ ] All alerts (both priorities) show a dismiss/acknowledge action (icon button or menu option)
- [ ] Dismissing marks the alert as resolved with no response value
- [ ] Alert moves to Resolved tab
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Snooze/defer alert
**Description:** As an accountant, I want to snooze an alert to deal with it later when I have more information or time.

**Acceptance Criteria:**
- [ ] All active alerts show a "Snooze" action (icon button or menu option)
- [ ] Snooze presents time options: "Later today" (4 hours), "Tomorrow morning" (next 9 AM), "Next week" (next Monday 9 AM), or custom date/time
- [ ] Snoozed alert disappears from active view and stores `snoozedUntil` timestamp
- [ ] Snoozed alert reappears in active view when `snoozedUntil` has passed (query filters by current time)
- [ ] Snoozed alerts visible via a filter or indicator so they aren't forgotten
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Escalate/assign alert
**Description:** As an accountant, I want to assign an alert to a team member so the right person handles it.

**Acceptance Criteria:**
- [ ] All active alerts show an "Assign" action (icon button or menu option)
- [ ] Assign opens a user picker showing team members (users in the system)
- [ ] Selecting a user sets `assignedTo` on the alert
- [ ] Assigned alerts show an avatar/name badge of the assignee
- [ ] Filter option to view "Assigned to me" alerts
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Resolved alerts tab
**Description:** As an accountant, I want to review previously resolved alerts for audit purposes and to see what actions were taken.

**Acceptance Criteria:**
- [ ] Workspace alerts page has two tabs: "Active" (default) and "Resolved"
- [ ] Resolved tab shows all resolved alerts for the workspace, newest first
- [ ] Each resolved alert shows: original alert content, resolution type (dismissed, responded, snoozed-then-resolved), response value (if any), who resolved it, and when
- [ ] Resolved alerts are read-only (no actions)
- [ ] Global home view does NOT show resolved alerts (only active)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-012: Alert type — anomaly alerts
**Description:** As an accountant, I want to be alerted when the system detects anomalies (duplicates, unusual amounts, timing mismatches, new vendors) so I can investigate.

**Acceptance Criteria:**
- [ ] Server-side utility function that creates an alert from an existing `Anomaly` record
- [ ] Alert title and body are generated from anomaly data (type, severity, affected transaction details)
- [ ] Alert links to the source anomaly/transaction via `entityType` and `entityId`
- [ ] Priority is set based on anomaly severity: high severity → "requires_action", medium/low → "fyi"
- [ ] Duplicate alerts are not created for the same anomaly
- [ ] Typecheck passes

### US-013: Alert type — AI question alerts
**Description:** As an accountant, I want the AI to ask me questions when it's uncertain about categorization, rule application, or reconciliation decisions.

**Acceptance Criteria:**
- [ ] Server-side utility function that creates an AI question alert with appropriate `responseType` (confirm, select, or text)
- [ ] For categorization questions: `responseType: "select"` with category options in `responseOptions`
- [ ] For confirmation questions: `responseType: "confirm"` (e.g., "Apply this rule to 15 similar transactions?")
- [ ] For open-ended questions: `responseType: "text"` (e.g., "What is the purpose of this recurring charge?")
- [ ] Alert title clearly states what the AI is asking
- [ ] Alert body provides context (affected transactions, reasoning, confidence level)
- [ ] Priority is always "requires_action" (AI is blocked until answered)
- [ ] Typecheck passes

### US-014: Alert type — system event alerts
**Description:** As an accountant, I want to know about system events (sync failures, new data imported, connector issues) without having to check each integration manually.

**Acceptance Criteria:**
- [ ] Server-side utility function that creates a system alert from sync/connector events
- [ ] Covers: sync completed (fyi), sync failed (requires_action), new transactions imported (fyi), connector disconnected (requires_action)
- [ ] Alert body includes relevant details (transaction count, error message, connector name)
- [ ] Priority is set appropriately: failures/disconnections → "requires_action", informational → "fyi"
- [ ] Typecheck passes

### US-015: Alert type — proactive insight alerts
**Description:** As an accountant, I want to receive AI-generated insights about spending trends, unusual patterns, and notable changes so I can proactively advise my clients.

**Acceptance Criteria:**
- [ ] Server-side utility function that creates an insight alert
- [ ] Example insights: "Client X expenses up 40% vs last month", "New recurring vendor detected: $500/mo to Acme SaaS", "3 transactions over $10,000 this week (unusual for this client)"
- [ ] Priority is always "fyi" (insights are informational)
- [ ] Alert body includes supporting data (amounts, percentages, time comparisons)
- [ ] Typecheck passes

### US-016: Alert filtering and search
**Description:** As an accountant, I want to filter and search alerts so I can quickly find what I'm looking for.

**Acceptance Criteria:**
- [ ] Filter by priority: All | Requires Action | FYI
- [ ] Filter by type: All | Anomaly | AI Question | System | Insight
- [ ] Filter by assignment: All | Assigned to me | Unassigned
- [ ] Free-text search across alert title and body
- [ ] Filters persist in URL search params
- [ ] Filters work on both Active and Resolved tabs
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: The system must store alerts with type, priority, status, optional response schema, and audit fields
- FR-2: The system must display a global alerts summary on the home page, grouped by workspace
- FR-3: The system must display a workspace-specific alerts page accessible from the sidebar
- FR-4: The sidebar must show a badge count of active "requires_action" alerts per workspace
- FR-5: The system must support three inline response types: confirm (approve/reject), select (pick from options), and text (free-form input)
- FR-6: The system must allow users to dismiss, snooze, or assign any active alert
- FR-7: Snoozed alerts must automatically reappear when their snooze period expires
- FR-8: Resolved alerts must be viewable in a separate "Resolved" tab with full audit context
- FR-9: The system must generate alerts from four sources: anomalies, AI questions, system events, and proactive insights
- FR-10: The system must prevent duplicate alerts for the same source entity
- FR-11: Alerts must be filterable by priority, type, assignment, and free-text search
- FR-12: Filter state must persist in URL search params

## Non-Goals

- No push notifications (email, SMS, browser push) — this is in-app only for now
- No real-time / WebSocket updates — alerts appear on page load/refresh
- No automated alert generation pipeline — this PRD covers the data model, UI, and utility functions; actual trigger integration (e.g., running anomaly detection on sync) is a follow-up
- No alert configuration/preferences (e.g., "don't show me system alerts") — all alerts are shown
- No mobile-specific UI — desktop-first, existing responsive patterns are sufficient
- No alert grouping/threading (e.g., combining 5 similar anomalies into one) — each alert is standalone

## Design Considerations

- Use existing shadcn/ui components: Card for alert items, Badge for priority/type indicators, Tabs for Active/Resolved, Button for actions, Dialog for snooze options and assign picker
- Alert type icons: use Lucide icons differentiated by type (e.g., `AlertTriangle` for anomaly, `MessageCircleQuestion` for AI question, `RefreshCw` for system, `TrendingUp` for insight)
- Priority visual treatment: "Requires Action" gets a left border accent (warning color) and a prominent badge; "FYI" is more subdued
- Maintain the existing Notion-inspired dark aesthetic — alerts should feel native to the app
- Alert cards should be compact enough to scan quickly but expandable for full detail
- The global home view should be a summary/digest, not a full alert list — avoid overwhelming the morning briefing

## Technical Considerations

- **Database:** Add `Alert` model to existing Prisma schema with relations to `Workspace` and `User`
- **Data fetching:** Server Components for initial page load; Server Actions for mutations (resolve, snooze, assign)
- **Snooze logic:** Query active alerts with `WHERE status = 'active' OR (status = 'snoozed' AND snoozedUntil <= NOW())` — SQLite doesn't have timezone-aware datetime, so store as ISO strings and compare in application code or use unix timestamps
- **Entity linking:** Reuse existing `entityType`/`entityId` pattern from the Event model for consistency
- **Response schema:** Store `responseOptions` as JSON string (SQLite doesn't have native JSON type); parse on read
- **Home page aggregation:** Single query grouping alert counts by workspace to avoid N+1
- **URL state:** Use `nuqs` or manual `useSearchParams` for filter persistence (check if `nuqs` is already in the project)

## Success Metrics

- Accountants check Alerts page as their first action each morning
- "Requires Action" alerts are resolved within 24 hours on average
- Reduction in missed anomalies and overlooked AI questions compared to event feed alone
- Accountants can triage all alerts for a client in under 5 minutes

## Open Questions

- Should the home page global view show individual alert cards or just per-workspace summary counts with a "View all" link?
- Should there be an "Urgent" priority level above "Requires Action" for truly critical issues (e.g., sync down for 24+ hours)?
- When an AI question alert is answered, should the response automatically trigger the downstream action (e.g., apply the category), or should it just record the answer for the AI to process later?
- Should alerts integrate with the existing Event Feed (i.e., create an Event when an alert is created/resolved)?
- What is the retention policy for resolved alerts? Keep forever, or archive/delete after a period?
