# Entries MVP — Product Requirements Document

**Version:** 3.0  
**Last Updated:** January 2026  
**Status:** Ready for Engineering Review

---

## 1. Executive Summary

Entries is an AI-powered bookkeeping assistant that helps accountants close monthly books faster without sacrificing accuracy. The MVP focuses on two interconnected jobs: **categorization** (mapping transactions to the chart of accounts) and **intelligent data hygiene** (surfacing anomalies, duplicates, and inconsistencies proactively).

At the center of Entries is **Esme**—an intelligent assistant that acts as a "smart junior" working alongside the accountant. Esme proactively surfaces issues, handles routine categorization, learns from accountant corrections, and gradually earns autonomy through demonstrated competence.

The core insight is that 10-20% of transactions consume 80% of an accountant's time—typically due to duplicates, amount anomalies, and ambiguous categorization. Esme handles the routine work, surfaces problems early, and builds trust over time to take on more autonomous work.

**MVP Success Criteria:**
- Match human accuracy on categorization
- Reduce time-to-close by 50%
- Accountants report Esme "feels like a real team member"
- Pilot accountants say they "can't go back" to their old workflow

---

## 2. Product Philosophy

### 2.1 Entries is the Data Team, Not the System of Record

Entries does not replicate functionality that existing tools (QuickBooks, Xero, banks) have already mastered. Instead, Entries:
- **Ingests** data from authoritative sources
- **Enriches** data with relationships, context, and intelligence
- **Suggests** actions that sync back to the source systems
- **Learns** from accountant feedback to improve over time

The system of record remains QuickBooks/Xero. Entries is the intelligence layer.

### 2.2 Esme: The Smart Junior

Esme is not a chatbot or a feature—she's a team member. The design principle is: **"What would a capable junior accountant do?"**

A good junior:
- Comes to your desk with updates, not emails
- Says "I categorized these 12 transactions—want me to show you?" not "12 transactions categorized"
- Asks for help when uncertain, learns from corrections
- Gradually takes on more responsibility as they prove themselves
- Never acts on something critical without checking first

### 2.3 Trust is Earned, Not Assumed

Esme starts with training wheels. Every pattern, category, and action type has a confidence tier:

| Tier | Behavior | Example |
|------|----------|---------|
| **Suggest** | Esme surfaces a recommendation; accountant must approve | "I think this is office supplies—confirm?" |
| **Act + Notify** | Esme takes action, notifies after | "Categorized 12 transactions as payroll" |
| **Act Silently** | Esme handles autonomously, appears in daily digest only | Routine categorizations for learned patterns |

**Graduation logic:**
- Starts at Tier 1 for each category/vendor/pattern
- After N confirmations with no corrections → Tier 2
- After sustained accuracy at Tier 2 → Tier 3
- Any correction resets that specific pattern to Tier 1

**Accountant controls:**
- Can manually lock any category/pattern to a specific tier ("always ask me about legal fees")
- Global setting: "Never act without asking" for risk-averse users

---

## 3. Target User

**Primary:** Tech-forward small business accountants
- Manages 40-50 clients across various industries
- Uses QuickBooks Online or Xero
- Comfortable with modern software (Notion, Slack, etc.)
- Values accuracy above speed, but wants both
- Currently spends 80% of month-end close on variance hunting and categorization

**Key insight:** Accountants are skeptical by nature. They won't trust a system that makes decisions they can't audit or override. Esme must be transparent, correctable, and deferential—earning trust through demonstrated competence.

---

## 4. Scope

### 4.1 In Scope (MVP)

| Feature | Description |
|---------|-------------|
| **Esme (Intelligent Assistant)** | Conversational interface with proactive alerts, inline actions, and learning |
| **Categorization** | AI-powered transaction categorization with human review |
| **Data Explorer** | NL-queryable tables for transactions, vendors, chart of accounts |
| **Rules Engine** | Natural language automation rules |
| **Event Feed** | Immutable audit trail of all data changes |
| **Data Connectors** | QuickBooks Online, Xero, Bank (via Plaid), Slack, Google Drive |
| **Document Management** | Upload and parse bank statement PDFs |
| **Multi-client Workspaces** | Isolated client environments |
| **Multi-tenancy** | Team members with role-based access per firm |

### 4.2 Out of Scope (Deferred)

| Feature | Rationale | When |
|---------|-----------|------|
| Reconciliation | Requires mature entity/relation model | Post-MVP |
| Journal entries | Focus on categorization first | V2 |
| Vendor enrichment | Nice-to-have, not core | V2 |

---

## 5. Information Architecture

### 5.1 Navigation Structure

**Global (always visible):**
- Home
- Search (opens modal)

**Client Dropdown** (workspace selector)

**Data Section:**
- Event Feed
- Data Connectors
- Docs
- Data Explorer

**Productivity Section:**
- Esme
- Categorize

**Knowledge Section:**
- Rules

**Footer:**
- Settings
- Account

### 5.2 Navigation States

**No Workspace Selected:**
- Home: Visible (shows all clients + cross-client alert summary)
- Search: Visible (searches all workspaces)
- Client Dropdown: Shows "Select Client"
- Data/Productivity/Knowledge sections: Hidden or disabled

**Workspace Selected:**
- All nav items visible and active
- Client Dropdown shows current workspace name
- All pages scoped to selected workspace
- Esme's context is scoped to this client (like opening a "brief folder")

---

## 6. Page Specifications

### 6.1 HOME

**Purpose:** Macro view of all clients + cross-client alert summary from Esme. Drive accountants to add more clients.

**Layout:**
- Header: "Clients" with prominent blue "Add Client" button (top right)
- **Esme Summary Card** (top): Cross-client alert rollup
- Client list table below

**Esme Summary Card:**

Top of page, shows cross-client alert rollup. Friendly message format (e.g., "Good morning! 3 clients need attention today...") with brief list of top issues and a "View Details" action that navigates to Esme page.

**Client List Table:**

| Column | Description |
|--------|-------------|
| Client name | Workspace name (clickable) |
| Alerts | Count badge with severity indicator (🔴 critical, 🟡 needs attention, — none) |
| New events | Count since last visit (resets on visit) |
| Sync status | Synced (green) / Syncing (blue) / Attention (red) |

**Interactions:**
- Click Esme card → Navigate to Esme page (no client selected, shows cross-client view)
- Click client row → Enter workspace (navigates to Esme page for that client)
- "Add Client" → New workspace creation modal

---

### 6.2 SEARCH

**Purpose:** Quick universal search across all data objects. Opens as a modal (not a page).

**Behavior:**
- Triggered by clicking Search nav item or `⌘K` / `Ctrl+K`
- Notion-style modal with search input
- Scope toggle: "All workspaces" or "Current workspace" (if one selected)
- Results grouped by type: Transactions, Vendors, Documents, Rules, Events

---

### 6.3 ESME (Intelligent Assistant)

**Purpose:** Esme's home base. Conversational interface where Esme proactively posts alerts as messages, accountant can respond, and both can initiate queries.

**Design Principle:** This is a conversation, not a dashboard. Esme "comes to your desk" with updates. The metaphor is Slack DMs with a smart colleague, not a notification center.

**Layout:**
- Chat-style interface (messages flow top to bottom, newest at bottom)
- Esme's messages appear on the left with her avatar
- User's messages appear on the right
- **Inline action cards** embedded in Esme's messages for quick resolution
- Persistent input bar at bottom for user queries/commands

**Alert Types & Severity:**

| Type | Severity | Example |
|------|----------|---------|
| Duplicate detected | 🔴 Critical | "Found potential duplicate: two $500 'Office Rent' charges on Oct 1" |
| Categorization needed | 🔴 Critical | "I'm not sure how to categorize this $2,500 charge from TechCorp" |
| Anomaly detected | 🟡 Attention | "Office supplies spending is 3x higher than usual this month" |
| Cash threshold | 🟡 Attention | "Heads up: cash balance dropped below $10k" |
| Daily digest | ℹ️ Info | "Here's what I handled today: 47 transactions categorized, 3 need your review" |

**Inline Action Cards:**

Embedded within Esme's messages, cards show relevant data and offer quick actions. Cards should include:
- Alert type and severity indicator
- Relevant data fields (amount, vendor, date, description, source)
- Esme's reasoning/guess when applicable
- Action buttons (Confirm, Dismiss, View Details, Add Context, etc.)
- Inline dropdowns for quick categorization

**Card Types:**

| Card Type | Contents | Actions |
|-----------|----------|---------|
| Duplicate Alert | Side-by-side transaction comparison, bank reference | Mark as Duplicate, Not a Duplicate, View Details |
| Categorization Needed | Transaction details, Esme's guess with reasoning | Category dropdown, Confirm, Skip, Add Context |
| Daily Digest | Summary stats, items needing review, observations | Review Items, Looks Good |
| Anomaly Alert | Transaction + comparison to typical, explanation | Acknowledge, Investigate, Dismiss |

**User Input & Interaction:**

The accountant can:
- Reply to any alert to provide context ("That's not a duplicate—it's two separate rent payments for different properties")
- Ask Esme questions ("Show me all uncategorized transactions over $1k")
- Give Esme commands ("Change all TechCorp transactions to Software & Subscriptions")
- Provide feedback ("Good job on catching that duplicate")

**Conversation Flow Example:**

1. Esme posts alert: "I found a potential duplicate—can you take a look?" [Card with two transactions]
2. User replies: "That's not a duplicate—it's rent for two different properties. The client has a warehouse and an office, both $500/month."
3. Esme responds: "Got it! I'll remember that this client has two $500 rent payments each month. Should I create a rule to expect both?" [Yes, Create Rule / No, Just This Once]
4. User clicks "Yes, Create Rule"
5. Esme confirms: "Done! I created this rule: 'Expect two $500 Office Rent charges on the 1st of each month.' I'll stop flagging these as duplicates going forward."

**Notification Delivery:**

| Channel | Behavior |
|---------|----------|
| In-app | All alerts appear in Esme's conversation; badge count on nav |
| Slack | Optional integration; critical alerts only by default, configurable |

**Slack Integration:**

- Connect Slack workspace in Settings
- Choose which alert types to push to Slack
- Messages link back to Entries for resolution
- Accountant can reply in Slack; Esme responds there too (stretch goal for MVP)

---

### 6.4 DATA EXPLORER

**Purpose:** Accountants can view and query tables of their data using natural language. Think "Notion databases + AI queries."

**Location:** Contextual within each client workspace (under Data section).

**Available Tables:**

| Table | Description |
|-------|-------------|
| Transactions | All transactions from connected sources |
| Vendors | Normalized vendor list with spend totals |
| Chart of Accounts | Account categories with balances |
| Documents | Uploaded files with parsed metadata |
| Events | Audit trail (same data as Event Feed, table view) |

**Layout:**
- Tab bar for switching between tables
- NL query input bar (prominent, always visible)
- **Interpretation banner** showing how query was understood
- Data table with sortable/filterable columns
- Sidebar for row details (on click)

**NL Query Interaction:**

When user types a query (e.g., "Show me all vendor payments over $5k last quarter"):

1. **Parse with smart defaults:** Current client, fiscal quarter, cash-basis
2. **Surface interpretation visibly:** Clickable chips showing applied filters (e.g., "Acme Corp · Q4 2024 · Cash basis · 23 results")
3. **Make parameters clickable:** Each chip is interactive—click to change date range, toggle cash/accrual, switch client
4. **Learn from corrections:** If user always switches to accrual, remember that preference

**Example Queries:**

| Query | Result |
|-------|--------|
| "What's unusual this month?" | Table of transactions flagged as anomalies with reasoning |
| "Show me all Amazon transactions" | Filtered transaction table |
| "Which vendors have we paid the most this year?" | Vendors table sorted by total spend descending |
| "List all uncategorized transactions" | Transactions where category = null |
| "Compare Q3 vs Q4 spending by category" | Pivot table with category rows, quarter columns |

---

### 6.5 EVENT FEED

**Purpose:** Immutable audit trail of all data changes. Every event Entries observes or creates.

**Layout:**
- Header with connected source logos (clickable → Data Connectors)
- Red notification dot on source logo if sync needs attention
- **Prominent filter bar** below sources
- Chronological table (newest first)

**Filter Bar:**

| Filter | Options |
|--------|---------|
| Source | All, QuickBooks, Chase, Amex, Entries, Manual |
| Type | All, Transaction, Category Change, Rule Applied, Context Added, System |
| Date | Last 7 days, Last 30 days, This month, Last month, Custom range |

**Table Columns:**

| Column | Description |
|--------|-------------|
| Source | Logo/icon of originating system |
| Occurred | When event happened in source system |
| Recorded | When Entries captured it |
| Type | Event type |
| Description | Brief summary |

**Row Click → Sidebar:**
- Full event payload
- Custom properties (user-added, Notion-style)
- Related entities
- Audit trail
- Data lineage

---

### 6.6 DATA CONNECTORS

**Purpose:** Manage integrations. Connect new apps, monitor status, troubleshoot issues.

**Layout:**
- "Connected" section with active integrations
- "Available" section with connection CTAs
- Each connected app shows: name, status, last sync, data types

**MVP Integrations:**

| Integration | Type | Data |
|-------------|------|------|
| QuickBooks Online | Accounting | Transactions, Chart of Accounts, Vendors |
| Xero | Accounting | Transactions, Chart of Accounts, Vendors |
| Plaid | Banking | Bank transactions (real-time) |
| Slack | Communication | Messages, files, receipts shared by clients |
| Google Drive | File Storage | Documents, statements, spreadsheets |

**Slack Integration Details:**
- Connect client Slack channels where receipts/invoices are shared
- Esme can surface attachments and link them to transactions
- Also serves as notification delivery channel (separate from data ingestion)

**Google Drive Integration Details:**
- Connect folders containing bank statements, receipts, invoices
- Auto-import new files added to watched folders
- Parse documents same as manual uploads in Docs

---

### 6.7 DOCS

**Purpose:** Upload and manage documents (bank statements, receipts, invoices).

**Features:**
- Folder organization
- PDF parsing to extract transaction data
- Link documents to transactions/events
- Full-text search within documents
- Auto-import from connected Google Drive folders

---

### 6.8 CATEGORIZE

**Purpose:** Review and approve AI-categorized transactions. Split-view with transactions and chart of accounts.

**Layout:**
- Left panel: Transaction table with category dropdown per row
- Right panel: Chart of accounts with running totals
- Filter bar: Date range, categorization status, source

**Interaction:**
- Change category via dropdown (inline edit)
- Bulk select + bulk categorize
- Right panel updates totals in real-time
- Esme's suggestions appear as pre-selected options with confidence indicator (🤖 icon for uncertain items)

---

### 6.9 RULES

**Purpose:** Create categorization automations using natural language.

**Features:**
- Natural language rule input
- Esme parses and confirms interpretation
- List of active rules with match counts
- Enable/disable toggle per rule
- Esme proactively suggests rules when patterns detected

**Rule Creation Flow:**
1. User enters rule in natural language (e.g., "All Square transactions should have the fee portion categorized as Payment Processing Fees")
2. Esme displays her interpretation as structured conditions/actions
3. User confirms or edits
4. Rule saved and applied going forward

**Rules List View:**
- Active rules with human-readable description
- Match count and last applied date
- Edit/delete actions
- Esme's suggestions section at bottom (patterns she's detected that could become rules)

---

## 7. Esme: Detailed Specification

### 7.1 Personality & Voice

**Name:** Esme  
**Persona:** Smart, capable junior accountant. First day was 6 months ago—past the "new hire" nervousness but still deferential and eager to learn.

**Voice Guidelines:**

| Do | Don't |
|----|-------|
| "I found a potential duplicate—can you take a look?" | "ALERT: Duplicate detected" |
| "I categorized 12 transactions as payroll" | "12 transactions have been automatically categorized" |
| "I'm not sure about this one" | "Confidence: 47%" |
| "Got it! I'll remember that" | "Preference saved" |
| "Here's your daily summary" | "Daily Report Generated" |

**Tone:** Warm, professional, concise. Never robotic. Never overly casual.

### 7.2 Alert Types

| Alert Type | Trigger | Severity | Default Tier |
|------------|---------|----------|--------------|
| Duplicate detected | Two transactions with same amount, date, vendor | 🔴 Critical | Suggest |
| Categorization needed | New vendor or ambiguous description | 🔴 Critical | Suggest |
| Anomaly: Unusual amount | Transaction 3x+ typical for category | 🟡 Attention | Suggest |
| Anomaly: New vendor | First transaction from this vendor | 🟡 Attention | Suggest |
| Cash threshold | Balance drops below configured amount | 🟡 Attention | Act + Notify |
| Sync failure | Data connector error | 🔴 Critical | Act + Notify |
| Daily digest | End of day summary | ℹ️ Info | Act + Notify |

### 7.3 Learning Mechanism

Esme learns from:

1. **Explicit corrections:** Accountant changes Esme's categorization → Esme learns the pattern
2. **Confirmations:** Accountant confirms Esme's suggestion → Esme gains confidence
3. **Context provided:** Accountant explains why something is categorized a certain way → Esme stores this
4. **Rules created:** Explicit rules become highest-confidence patterns

**Feedback Loop:**
- After correction: "Got it! Should I apply this to similar transactions, or just this one?"
- After confirmation: Silent (no need to acknowledge every confirmation)
- After context: "Thanks for explaining! I'll keep this in mind for future [vendor/category/pattern] transactions."

### 7.4 Autonomy Controls (Settings)

**Autonomy Level Options:**
- **Conservative** — Always ask before acting
- **Balanced** (default) — Act on high-confidence items, ask on uncertain
- **Autonomous** — Act on most items, notify after

**Category Overrides:**
- Accountant can specify categories that always require approval (e.g., "Legal & Professional Fees", "Owner's Draw")

**Notification Settings:**
- In-app notifications (always on)
- Slack notifications (configurable: all alerts, critical only, or off)
- Email digest (daily, optional)

**Threshold Alerts:**
- Cash balance threshold (configurable amount)
- Unusual spending threshold (configurable multiplier, e.g., 3x average)

---

## 8. Multi-tenancy & Permissions

### 8.1 Account Hierarchy

```
Firm (Account)
├── Team Members (Users)
│   ├── Owner (1 per firm)
│   ├── Admins
│   └── Members
└── Client Workspaces
    ├── Workspace A
    ├── Workspace B
    └── ...
```

### 8.2 Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| **Owner** | Firm principal, created the account | Full access; billing; can delete firm; can promote Admins |
| **Admin** | Senior team member | Manage team members; manage all workspaces; cannot delete firm |
| **Member** | Staff accountant | Access assigned workspaces only; cannot manage team |

### 8.3 Workspace Access

- Team members must be explicitly granted access to each workspace
- Admins can access all workspaces by default
- Members only see workspaces they're assigned to
- Workspace assignment is managed by Owner or Admin

### 8.4 Esme & Multi-tenancy

- Esme's learning is scoped to the **workspace**, not the user
- When a team member corrects Esme, all team members on that workspace benefit
- Rules are workspace-scoped (shared across team)
- Autonomy settings are workspace-scoped (so team has consistent experience)
- Notification preferences are user-scoped (each person chooses their own Slack/email settings)

### 8.5 Audit Trail

- All actions logged with user attribution
- Event Feed shows which team member performed each action
- Esme's actions attributed to "Esme" with confidence tier noted

---

## 9. Technical Requirements

### 8.1 Data Model Principles

- **Events are immutable:** All changes stored as append-only events
- **Flexible payloads:** No rigid schema; JSON payloads that can be queried
- **Graph relationships:** Entities linked via relations (transaction → vendor, transaction → category, etc.)
- **Multi-currency:** Store original currency + converted amount; support USD, CAD, EUR at minimum

### 8.2 Key Entities

| Entity | Description |
|--------|-------------|
| Workspace | Client container; isolated data environment |
| Event | Immutable record of any change/observation |
| Transaction | Financial transaction from any source |
| Vendor | Normalized vendor entity |
| Category | Chart of accounts entry |
| Rule | Natural language automation |
| Document | Uploaded file with parsed metadata |
| Alert | Esme-generated notification |

### 8.3 Sync Architecture

- **Polling:** QuickBooks/Xero via OAuth (15-minute intervals)
- **Webhooks:** Where available, subscribe to real-time updates
- **Bank:** Plaid for real-time bank transactions
- **Documents:** User-uploaded, parsed via OCR/extraction pipeline

---

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Categorization accuracy | >95% | % of Esme's categorizations not corrected |
| Time to close | -50% | Self-reported by pilot users |
| Esme trust score | Tier 2+ for 80% of categories | % of categories at Act+Notify or higher |
| Pilot retention | 100% | "Can't go back" in exit interviews |
| Clients per accountant | +20% | Average workspaces per user after 3 months |

---

## 11. Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| What's the right N for tier graduation? (5? 10? 20?) | PM/Eng | To test in pilot |
| Should Esme have a visible avatar? | Design | To explore |
| Slack two-way sync (reply in Slack → action in Entries)? | Eng | Stretch for MVP |
| How to handle conflicting rules? | PM | Needs spec |

---

## 12. Appendix

### A. Example Natural Language Rules

```
"All Uber charges under $50 → Travel - Local"

"Amazon transactions under $100 → Office Supplies unless description contains 'AWS'"

"All Square transactions should have the fee portion categorized as Payment Processing Fees"

"Restaurant charges over $200 → Flag for review"

"Transfers between checking and savings → Ignore for categorization"
```

### B. Example Esme Conversations

**Anomaly Detection:**
```
Esme: "Office supplies spending is 3x higher than usual this month ($2,400 vs $800 average). Want me to show you the transactions?"

User: "Yes, show me"

Esme: [Shows transaction list]
      "The increase is mainly from two large Office Depot orders ($1,200 each) on Jan 5 and Jan 12."

User: "That's expected—we furnished a new office"

Esme: "Got it! Should I note this as a one-time expense, or will there be more orders like this?"
```

**Learning from Correction:**
```
Esme: "I categorized the $450 Staples charge as Office Supplies"

User: [Changes to "Computer Equipment"]

Esme: "I see you changed this to Computer Equipment. The description says 'laptop stand and monitor arm'—should I categorize Staples charges with 'laptop', 'monitor', or 'computer' in the description as Computer Equipment going forward?"

User: "Yes"

Esme: "Done! I'll apply this rule to future transactions."
```

### C. Data Explorer Query Examples

```
"Show me all transactions over $5,000"
→ Filtered transaction table

"Which categories had the biggest increase vs last month?"
→ Comparison table with % change

"Find all transactions from vendors I haven't seen before"
→ Transactions where vendor.first_seen = this_month

"What percentage of transactions did Esme categorize automatically?"
→ Single stat: "78% (847 of 1,086)"

"List transactions where Esme was wrong"
→ Transactions where original_category ≠ current_category AND categorized_by = Esme
```

---

## 13. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2025 | — | Initial PRD |
| 2.0 | Jan 2025 | — | Added page specifications, navigation, Entries AI |
| 3.0 | Jan 2026 | — | Removed reconciliation; renamed Entries AI to Esme; added trust ramp system; added Data Explorer; added Slack/Google Drive connectors; added multi-tenancy with roles |
