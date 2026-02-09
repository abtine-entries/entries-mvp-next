# PRD: Actions — Batch Bill Payments (Xero → Wise)

## Introduction

Add an **Actions** capability to Entries that lets accountants write back to external applications and execute financial tasks directly from within their workspace. The first action to build is **batch bill payments**: Esme pulls authorized bills from Xero, presents them in a dedicated bills page, and the user selects which to pay as a batch via Wise.

This is a **demo-scoped** implementation — Xero data will be mocked/hardcoded, and the Wise integration will support both real API calls and a CSV/JSON file export fallback.

## Goals

- Introduce the concept of "Actions" — operations that write back to external systems
- Provide a dedicated `/bills` page in the workspace showing payable bills from Xero
- Allow Esme to pull and present bills, with the user selecting and confirming a payment batch
- Support Wise batch transfer creation via API (preferred) and file export (fallback)
- Demonstrate the end-to-end accounts payable workflow in a single session

## User Stories

### US-001: Bills data model and seed data
**Description:** As a developer, I need a bills data model with realistic mocked Xero data so the demo has a populated bills table.

**Acceptance Criteria:**
- [ ] Add `Bill` model to Prisma schema with fields: id, workspaceId, vendorName, invoiceNumber, dueDate, amount, currency, status (authorized | pending | paid | overdue), xeroId, description, createdAt, updatedAt
- [ ] Add `BatchPayment` model: id, workspaceId, status (draft | submitted | processing | completed | failed), totalAmount, currency, wiseTransferId (nullable), fileExportPath (nullable), createdAt, updatedAt
- [ ] Add `BatchPaymentItem` join model: id, batchPaymentId, billId, amount, currency, recipientName
- [ ] Create seed data with 8–12 realistic bills (mix of authorized, pending, paid, overdue) across 4–6 vendors
- [ ] Migration runs successfully
- [ ] Typecheck passes

### US-002: Bills page — table view
**Description:** As an accountant, I want a dedicated bills page in my workspace so I can see all outstanding bills from Xero at a glance.

**Acceptance Criteria:**
- [ ] New page at `/workspace/[id]/bills`
- [ ] PageHeader with breadcrumbs following existing pattern (Org → Workspace → Bills with `Receipt` icon)
- [ ] Data table with columns: checkbox (select), Vendor, Invoice #, Due Date, Amount, Currency, Status (badge)
- [ ] Status badges use semantic colors: authorized=success, pending=warning, overdue=error, paid=secondary
- [ ] Table supports row selection via checkboxes
- [ ] Empty state when no bills exist
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Bills page — filtering and sorting
**Description:** As an accountant, I want to filter bills by status and sort by due date or amount so I can focus on what needs to be paid.

**Acceptance Criteria:**
- [ ] Status filter dropdown: All | Authorized | Pending | Paid | Overdue
- [ ] Default filter is "Authorized" (the bills ready to pay)
- [ ] Sortable columns: Due Date (default ascending), Amount, Vendor
- [ ] Filter state persisted in URL search params
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Sidebar navigation — add Bills under Data section
**Description:** As an accountant, I want to access the bills page from the sidebar so it's discoverable alongside other data views.

**Acceptance Criteria:**
- [ ] Add "Bills" nav item to the "Data" section in the sidebar
- [ ] Use `Receipt` icon from lucide-react
- [ ] Active state highlighting matches existing nav items
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Create batch payment sheet
**Description:** As an accountant, I want to review selected bills and create a batch payment so I can pay multiple vendors at once.

**Acceptance Criteria:**
- [ ] "Create Batch Payment" button appears in PageHeader actions when 1+ bills with status "authorized" are selected
- [ ] Clicking opens a right-side Sheet showing:
  - Summary: total amount, number of bills, currency
  - Line-item list of selected bills (vendor, invoice #, amount)
  - Option to remove individual bills from batch
- [ ] "Send via Wise" primary action button
- [ ] "Export File" secondary action button
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Batch payment confirmation dialog
**Description:** As an accountant, I want a confirmation step before executing a payment so I don't accidentally send money.

**Acceptance Criteria:**
- [ ] Clicking "Send via Wise" opens a confirmation dialog
- [ ] Dialog shows: total amount, recipient count, and explicit "This will initiate a real transfer" warning
- [ ] "Confirm & Send" button and "Cancel" button
- [ ] For demo: confirming creates the BatchPayment record with status "submitted" and simulates success after 2s delay
- [ ] Bill statuses update to "paid" on success
- [ ] Success toast notification with batch reference
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Export batch payment file
**Description:** As an accountant, I want to export the batch as a CSV file so I can upload it to Wise manually if the API isn't available.

**Acceptance Criteria:**
- [ ] Clicking "Export File" generates a CSV with columns: recipientName, amount, currency, invoiceNumber, reference
- [ ] CSV downloads automatically in the browser
- [ ] BatchPayment record created with status "draft" and fileExportPath set
- [ ] Toast notification confirming file download
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Batch payment history
**Description:** As an accountant, I want to see past batch payments so I can track what's been sent.

**Acceptance Criteria:**
- [ ] Section below the bills table (or a tab) showing batch payment history
- [ ] Each batch shows: date, total amount, recipient count, status badge, method (API / File Export)
- [ ] Clicking a batch expands to show line items
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Esme — pull bills conversation flow
**Description:** As an accountant, I want to ask Esme to show me bills ready to pay so she can pull the data and direct me to take action.

**Acceptance Criteria:**
- [ ] Esme responds to prompts like "show me bills ready to pay" or "what invoices need to be paid"
- [ ] Esme replies with a summary: "You have X authorized bills totaling $Y from Z vendors" with a link/button to the bills page
- [ ] For demo: Esme's response is pattern-matched (not LLM-driven) — specific trigger phrases produce canned responses
- [ ] Typecheck passes

### US-010: Esme — batch payment assistant
**Description:** As an accountant, I want Esme to help me create a batch payment by suggesting which bills to include.

**Acceptance Criteria:**
- [ ] After navigating to bills (or in chat), Esme can suggest: "I see 5 authorized bills due this week totaling $12,340. Want me to prepare a batch?"
- [ ] User confirms → Esme navigates to bills page with authorized bills pre-selected
- [ ] For demo: canned response triggered by user confirmation
- [ ] Typecheck passes

### US-011: Connector logo for Xero and Wise
**Description:** As a developer, I need logo configurations for Xero and Wise so they display correctly in the UI.

**Acceptance Criteria:**
- [ ] Add Xero and Wise to `connector-logo-config.ts`
- [ ] Logos render correctly in bills page and batch payment sheet
- [ ] Typecheck passes

### US-012: Event logging for batch payments
**Description:** As an accountant, I want batch payment actions logged in the event feed so there's an audit trail.

**Acceptance Criteria:**
- [ ] Creating a batch payment creates an Event with type "action" and properties: actionType=batch_payment, totalAmount, recipientCount, method (api/file), status
- [ ] Bill status changes create individual Events
- [ ] Events visible in the workspace event feed
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Add `Bill`, `BatchPayment`, and `BatchPaymentItem` models to Prisma schema with appropriate relations to Workspace
- FR-2: Seed database with 8–12 realistic mocked bills across multiple vendors and statuses
- FR-3: New page at `/workspace/[id]/bills` with a data table listing all bills
- FR-4: Bills table supports multi-row selection via checkboxes
- FR-5: Bills table supports filtering by status (default: authorized) and sorting by due date, amount, vendor
- FR-6: "Create Batch Payment" button appears when authorized bills are selected
- FR-7: Batch payment sheet shows summary, line items, and remove-from-batch controls
- FR-8: "Send via Wise" triggers a confirmation dialog, then creates a BatchPayment record and simulates API success
- FR-9: "Export File" generates and downloads a CSV file with payment details
- FR-10: Successful batch payment updates bill statuses to "paid"
- FR-11: Batch payment history section shows past batches with expandable line items
- FR-12: Esme responds to bill-related prompts with summaries and links to the bills page
- FR-13: Add Xero and Wise to connector logo configuration
- FR-14: All batch payment actions create audit Events in the event feed
- FR-15: Add "Bills" to sidebar navigation under the "Data" section

## Non-Goals

- No real Xero OAuth integration — data is mocked/seeded
- No real Wise API calls — transfers are simulated for demo
- No multi-currency conversion handling
- No recurring/scheduled payment support
- No approval workflows beyond single-user confirmation
- No partial payments on a single bill
- No generic "Actions" framework — this is purpose-built for the batch payment use case
- No notification system (email, Slack) for payment status

## Design Considerations

- Follow existing page layout pattern: `PageHeader` + scrollable content area with `px-10 py-6`
- Reuse `DataTable` component with checkbox selection (already supports row selection)
- Reuse `Badge` component with semantic variants for bill status
- Reuse `Sheet` component (right-side panel) for batch payment review — same pattern as rule creation
- Reuse `Dialog` for confirmation step
- Connector logos for Xero and Wise should follow `ConnectorLogo` component pattern
- Bills page should feel consistent with Event Feed and Data Explorer pages

## Technical Considerations

- **Data model:** Bills are a new Prisma model, not reusing Transaction. They represent vendor invoices, not bank/QBO transactions.
- **Demo data:** Seed script should create realistic bills with vendors like "Acme Corp", "CloudHost Ltd", etc. Amounts should be realistic ($500–$15,000 range).
- **CSV export:** Generate client-side using a utility function — no server-side file generation needed for demo.
- **Simulated Wise API:** Use a `setTimeout` or similar delay to mimic async API behavior. Store the "transfer" result in BatchPayment.
- **Esme integration:** Pattern-match on keywords in `esme-chat.tsx` — no LLM call needed for demo. Use the existing `EsmeMessage` model for conversation history.
- **URL state:** Bill status filter should use `searchParams` consistent with how other pages handle filters.

## Success Metrics

- User can view all bills, filter to authorized, and create a batch payment in under 5 clicks
- Batch payment flow is completable end-to-end in a single demo session
- All actions produce audit trail entries in the event feed
- File export produces a valid, well-formatted CSV

## Open Questions

- Should the bills page show a "Xero" source indicator per bill, anticipating future multi-source support?
- Should batch payment amounts be editable (pay partial) or always match the full bill amount?
- What Wise CSV format should the export follow — Wise's standard bulk template or a custom format?
- Should Esme proactively surface overdue bills as alerts, or only respond when asked?
