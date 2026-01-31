# PRD: Esme Canvas UI

## Introduction

Redesign Esme's interface from a basic chat window into a **canvas-style workspace** where Esme writes rich, interactive blocks — alerts, daily briefings, data summaries, and action cards — directly onto a scrollable canvas. A persistent **alert tray** on the right side holds pending alerts as draggable cards that users can drop onto the canvas to give Esme context and trigger responses. A persistent input bar at the bottom lets users converse with Esme at any time.

This consolidates the separate `/workspace/[id]/alerts` page into Esme's canvas. Esme becomes the single surface for alerts, updates, daily reports, and conversation — a true "team member" interface rather than a chatbot.

## Goals

- Replace the current chat-only Esme UI with a canvas + alert tray layout
- Support multiple block types on the canvas: text, alerts, briefings, insights, and actions
- Enable drag-and-drop of alert cards from the right tray onto the main canvas
- Deliver daily briefings as conversational rich messages with embedded data
- Consolidate the alerts page into Esme — remove `/workspace/[id]/alerts` as a standalone route
- Maintain the persistent input bar for natural language interaction
- Keep Esme as the default workspace landing page (`/workspace/[id]` → `/workspace/[id]/esme`)

## User Stories

### US-001: Canvas layout shell
**Description:** As a user, I want the Esme page to have a two-panel layout (canvas + alert tray) so I can see Esme's content and my pending alerts side by side.

**Acceptance Criteria:**
- [ ] Esme page renders a two-panel layout: main canvas area (left, flexible width) and alert tray (right, ~320px)
- [ ] Canvas area is vertically scrollable with blocks rendered top to bottom (oldest first)
- [ ] Alert tray is vertically scrollable independently
- [ ] Alert tray can be collapsed/expanded via a toggle button, giving the canvas full width when collapsed
- [ ] Collapsed state persists in localStorage
- [ ] On viewports < 1024px, the alert tray defaults to collapsed (overlay mode)
- [ ] PageHeader with existing breadcrumb pattern (Org > Workspace > Esme) remains at the top
- [ ] Persistent input bar is pinned to the bottom of the canvas area, not the tray
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: Canvas block system — base components
**Description:** As a developer, I need a block rendering system that can display different block types on the canvas so Esme can write varied content.

**Acceptance Criteria:**
- [ ] Create a `CanvasBlock` component that accepts a `block` prop with a `type` discriminator
- [ ] Supported block types: `text`, `alert`, `briefing`, `insight`, `action`
- [ ] Each block type renders a distinct visual treatment (detailed in subsequent stories)
- [ ] Blocks have consistent spacing between them (`space-y-4`)
- [ ] User messages render right-aligned in `bg-muted` rounded bubbles (preserving current behavior)
- [ ] Esme blocks render left-aligned, full width of the canvas column (max-w-2xl centered)
- [ ] Each block shows a timestamp in `text-xs text-muted-foreground`
- [ ] Typecheck passes

### US-003: Text blocks
**Description:** As a user, I want Esme's conversational messages to appear as clean text blocks on the canvas so they feel like a team member writing, not a chatbot bubbling.

**Acceptance Criteria:**
- [ ] Text blocks render Esme's message content as `text-sm whitespace-pre-wrap` (no bubble, no background)
- [ ] Supports basic markdown rendering (bold, italic, links, lists) via a lightweight renderer
- [ ] Esme's text blocks have no avatar — the canvas itself is "Esme's space"
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Alert blocks on the canvas
**Description:** As a user, I want alerts that Esme surfaces to appear as interactive cards on the canvas so I can respond to them in context.

**Acceptance Criteria:**
- [ ] Alert blocks render as bordered cards with: type icon, priority badge, title, body, and response controls
- [ ] "Requires Action" alerts have a left border accent in warning color (`border-l-4 border-l-warning`)
- [ ] "FYI" alerts use a secondary badge and no left border accent
- [ ] Response controls match current implementation: ConfirmResponse, SelectResponse, TextResponse
- [ ] Resolved alerts show with reduced opacity (0.6) and a green checkmark with resolution text
- [ ] Resolving an alert on the canvas also updates its status in the alert tray
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Briefing blocks (daily report)
**Description:** As a user, I want Esme to deliver a daily briefing as a rich conversational message with embedded stats so I can quickly understand the state of this workspace.

**Acceptance Criteria:**
- [ ] Briefing block starts with a time-of-day greeting ("Good morning", "Good afternoon", "Good evening")
- [ ] Contains a natural-language summary paragraph (e.g., "You have 3 items needing attention today. 2 bills are overdue totaling $4,200, and there's 1 anomaly in recent transactions.")
- [ ] Embedded stats section with 3-4 key metrics displayed as a horizontal row of stat pills: e.g., "3 alerts", "$4,200 overdue", "12 uncategorized"
- [ ] Each stat pill is a rounded badge with an icon + value, clickable to scroll to or highlight relevant alerts
- [ ] Briefing appears once per day at the top of the canvas (or as the first block when the user opens Esme)
- [ ] For demo: briefing content is generated server-side from actual database counts (alerts, bills, uncategorized events)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Insight blocks
**Description:** As a user, I want Esme to surface data insights as visually distinct cards so I can spot trends and anomalies without asking.

**Acceptance Criteria:**
- [ ] Insight blocks render with a `TrendingUp` icon and "Insight" label
- [ ] Body text is Esme's conversational explanation of the insight
- [ ] Optional embedded data: a simple key-value list or a mini bar/sparkline (text-based for demo, e.g., "▁▂▃▅▇" unicode sparkline)
- [ ] Visual treatment: subtle background (`bg-muted/30`), rounded-xl, no heavy border
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Action blocks
**Description:** As a user, I want Esme to present actionable suggestions as cards with buttons so I can approve or dismiss them directly on the canvas.

**Acceptance Criteria:**
- [ ] Action blocks render with a title, description, and 1-2 action buttons (primary + ghost)
- [ ] Examples: "Prepare batch payment for 5 overdue bills ($12,340)" with "Review Bills" and "Dismiss" buttons
- [ ] Clicking an action button can navigate to a page (e.g., bills page) or trigger a server action
- [ ] Completed actions show a "Done" state with checkmark and reduced opacity
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Alert tray — list and grouping
**Description:** As a user, I want the right-side alert tray to show all active alerts grouped by priority so I can see what needs attention at a glance.

**Acceptance Criteria:**
- [ ] Alert tray header shows "Alerts" label and a count badge (total active alerts)
- [ ] Alerts grouped into two sections: "Requires Action" (top) and "FYI" (below)
- [ ] Each section has a label with the count (e.g., "Requires Action (3)")
- [ ] Each alert card in the tray shows: type icon, title (truncated to 2 lines), priority badge, and relative timestamp
- [ ] Empty state: "No active alerts" with a `Bell` icon
- [ ] Tray fetches the same alert data currently used by the alerts page (active + snoozed with expired `snoozedUntil`)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Alert tray — drag and drop to canvas
**Description:** As a user, I want to drag an alert card from the tray and drop it onto the canvas so I can ask Esme about it or pin it for context.

**Acceptance Criteria:**
- [ ] Alert cards in the tray are draggable (grab cursor on hover, visual lift on drag start)
- [ ] Canvas area is a valid drop target — shows a visual drop indicator (dashed border or highlight) when an alert is dragged over it
- [ ] Dropping an alert onto the canvas creates an alert block at the bottom of the canvas (before the input bar)
- [ ] After dropping, Esme responds with a contextual text block acknowledging the alert (e.g., "Let me look into this anomaly for you..." — canned response for demo)
- [ ] The same alert can only be dropped once (duplicate prevention)
- [ ] Dragging provides a drag preview showing the alert title
- [ ] Use `@dnd-kit/core` and `@dnd-kit/sortable` for the drag-and-drop implementation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Alert tray — inline actions
**Description:** As a user, I want to perform quick actions on alerts directly in the tray (dismiss, snooze) without dragging them to the canvas.

**Acceptance Criteria:**
- [ ] Each alert card in the tray shows action buttons on hover: dismiss (X icon) and snooze (Clock icon)
- [ ] Dismiss sets alert status to "resolved" and removes it from the tray
- [ ] Snooze opens a small popover with duration options (1 hour, 4 hours, tomorrow, next week) — reuse existing `SnoozePopover` component
- [ ] Dismissed/snoozed alerts animate out of the tray (150ms fade + collapse)
- [ ] Actions revalidate both the alert tray and the canvas (in case the alert was also on the canvas)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Remove standalone alerts page
**Description:** As a developer, I need to remove the separate alerts page and redirect any existing links to Esme, since Esme now owns the alerts surface.

**Acceptance Criteria:**
- [ ] Remove `/workspace/[id]/alerts` page and its components (page.tsx, filtered-alerts.tsx, alert-filters.tsx)
- [ ] Keep the alert server actions (dismiss, snooze, assign, resolve) — they are now called from the Esme canvas and tray
- [ ] Keep the alert response components (ConfirmResponse, SelectResponse, TextResponse) — they are reused in canvas alert blocks
- [ ] Remove "Alerts" from sidebar navigation if it existed as a separate item
- [ ] Home page alerts summary links now navigate to `/workspace/[id]/esme` instead of `/workspace/[id]/alerts`
- [ ] Typecheck passes

### US-012: Persist canvas blocks in database
**Description:** As a developer, I need canvas blocks stored in the database so content persists across sessions and page reloads.

**Acceptance Criteria:**
- [ ] Extend the `EsmeMessage` model's `metadata` field to store block type and block-specific data as JSON
- [ ] Block type stored as `metadata.blockType`: `text` | `alert` | `briefing` | `insight` | `action`
- [ ] Alert blocks store `metadata.alertId` (existing behavior, preserved)
- [ ] Briefing blocks store `metadata.briefingDate` and `metadata.stats` (JSON object with metric values)
- [ ] Action blocks store `metadata.actionType`, `metadata.actionData`, and `metadata.actionStatus` (pending | completed | dismissed)
- [ ] Server-side page component parses metadata and passes typed block data to the client
- [ ] Typecheck passes

### US-013: Input bar — persistent chat input
**Description:** As a user, I want a persistent input bar at the bottom of the canvas so I can message Esme at any time without losing context of what's on the canvas.

**Acceptance Criteria:**
- [ ] Input bar is pinned to the bottom of the canvas area (not the alert tray)
- [ ] Auto-resizing textarea with max height of 150px
- [ ] Send button (ArrowUp icon) enabled only when input is non-empty
- [ ] Enter to send, Shift+Enter for newline
- [ ] Disabled state with reduced opacity during pending message send
- [ ] Sending a message creates a user text block on the canvas and Esme responds with an appropriate block
- [ ] Matches current input bar styling: `rounded-xl border bg-muted/50`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-014: Migrate Esme server actions for canvas blocks
**Description:** As a developer, I need the `sendEsmeMessage` server action to create properly typed canvas blocks so the new UI renders them correctly.

**Acceptance Criteria:**
- [ ] User messages saved with `metadata.blockType = 'text'`
- [ ] Esme's canned replies saved with `metadata.blockType = 'text'`
- [ ] Bill-related keyword responses saved with `metadata.blockType = 'action'` and appropriate `actionType`/`actionData`
- [ ] When Esme surfaces an alert (existing behavior), saved with `metadata.blockType = 'alert'` and `metadata.alertId`
- [ ] Existing messages without blockType metadata default to `text` type in the UI (backwards compatibility)
- [ ] Typecheck passes

### US-015: Daily briefing generation
**Description:** As a developer, I need a server-side function that generates the daily briefing content from real workspace data.

**Acceptance Criteria:**
- [ ] Function `generateDailyBriefing(workspaceId)` queries: active alert count (by priority), overdue bill count + total, uncategorized event count, recent event count (last 24h)
- [ ] Returns a structured briefing object: `{ greeting, summary, stats: { label, value, icon }[] }`
- [ ] Briefing is created as an EsmeMessage with `blockType = 'briefing'` when the user opens Esme and no briefing exists for today
- [ ] Only one briefing per workspace per calendar day (check `briefingDate` in metadata)
- [ ] Typecheck passes

### US-016: Update home page alerts summary navigation
**Description:** As a user, I want clicking an alert on the home page to take me to Esme instead of a standalone alerts page.

**Acceptance Criteria:**
- [ ] Home page `AlertsSummary` table row click navigates to `/workspace/${workspaceId}/esme` instead of `/workspace/${workspaceId}/alerts`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Esme page uses a two-panel layout: scrollable canvas (left/center) and collapsible alert tray (right, ~320px)
- FR-2: Canvas renders an ordered sequence of typed blocks: text, alert, briefing, insight, action
- FR-3: User messages appear as right-aligned bubbles; Esme blocks appear left-aligned with no bubble
- FR-4: Alert tray displays all active workspace alerts grouped by priority (requires_action first, then fyi)
- FR-5: Alert cards in the tray are draggable onto the canvas using `@dnd-kit`
- FR-6: Dropping an alert on the canvas creates an alert block and triggers a canned Esme response
- FR-7: Alert tray cards support hover-revealed dismiss and snooze actions
- FR-8: Daily briefing block generates automatically on first visit each day using real workspace data
- FR-9: Briefing includes time-of-day greeting, natural-language summary, and stat pills with counts
- FR-10: Alert blocks on the canvas support inline response controls (confirm, select, text) matching existing alert response components
- FR-11: Resolving an alert on the canvas syncs its status in the tray (and vice versa)
- FR-12: Action blocks display actionable suggestions with primary/ghost buttons and completion states
- FR-13: Insight blocks display trend data with conversational explanations
- FR-14: Persistent input bar at the bottom of the canvas with auto-resize, Enter to send, Shift+Enter for newline
- FR-15: All canvas blocks persist via the `EsmeMessage` model with `metadata.blockType` discriminator
- FR-16: The standalone `/workspace/[id]/alerts` page is removed; all alert management happens within Esme
- FR-17: Home page alert summary rows navigate to `/workspace/[id]/esme`
- FR-18: Canvas blocks from before this migration (no blockType) default to text type

## Non-Goals

- No real LLM integration — Esme responses remain canned/pattern-matched for demo
- No reordering or rearranging blocks on the canvas (blocks are chronological, not a free-form board)
- No drag-and-drop between canvases (only tray → canvas)
- No real-time updates via WebSocket/SSE — page revalidation on action is sufficient
- No canvas block editing or deletion by the user
- No multi-workspace alert tray — tray is scoped to the current workspace
- No chart/graph rendering library — insights use text-based sparklines and key-value pairs for demo
- No alert creation UI — alerts are generated by the system (seed data or server actions)

## Design Considerations

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  PageHeader: Org > Workspace > Esme                              │
├──────────────────────────────────────────┬───────────────────────┤
│                                          │  Alerts          [×]  │
│   [Briefing Block - Good morning...]     │                       │
│                                          │  Requires Action (3)  │
│   [Text Block - Esme message]            │  ┌─────────────────┐  │
│                                          │  │ ⚠ Anomaly alert │  │ ← draggable
│   [Alert Block - inline response]        │  │   $4,200...     │  │
│                                          │  └─────────────────┘  │
│          [User message bubble]           │  ┌─────────────────┐  │
│                                          │  │ ? AI Question   │  │ ← draggable
│   [Action Block - suggestion]            │  │   Categorize... │  │
│                                          │  └─────────────────┘  │
│   [Insight Block - trend data]           │                       │
│                                          │  FYI (2)              │
│                                          │  ┌─────────────────┐  │
│                                          │  │ ↻ System update │  │
│                                          │  └─────────────────┘  │
├──────────────────────────────────────────┤                       │
│  [Ask Esme anything...           ] [↑]   │                       │
└──────────────────────────────────────────┴───────────────────────┘
```

### Visual Treatment per Block Type

| Block Type | Background | Border | Icon | Special |
|------------|-----------|--------|------|---------|
| Text | None (transparent) | None | None | Markdown rendering |
| Alert | `bg-card` | `border` + optional `border-l-4 border-l-warning` | Type-specific | Response controls |
| Briefing | `bg-primary/5` | `border border-primary/20` | `Sparkles` | Stat pills row |
| Insight | `bg-muted/30` | None | `TrendingUp` | Sparkline or key-value data |
| Action | `bg-card` | `border` | Context-specific | Primary + ghost buttons |
| User message | `bg-muted` | None | None | Right-aligned bubble |

### Drag and Drop

- Use `@dnd-kit/core` for accessible, performant drag-and-drop
- Drag overlay shows a semi-transparent copy of the alert card
- Drop zone indicator: dashed `border-2 border-dashed border-primary/40` on the canvas when dragging
- Animation: 200ms ease transition on drop

### Alert Tray

- Width: 320px fixed (collapsible to 0)
- Separator: `border-l border-border` between canvas and tray
- Toggle button: small icon button at the top-right of the tray header
- Collapsed state: tray hidden, canvas takes full width
- Mobile: tray is an overlay sheet that slides in from the right

### Existing Components to Reuse

- `ConfirmResponse`, `SelectResponse`, `TextResponse` — alert response controls
- `SnoozePopover` — snooze duration picker
- `Badge` — priority and type badges
- `Button` — action buttons
- `PageHeader` — breadcrumb header
- Alert type icons mapping (`typeIcons` record)
- `formatRelativeTime` utility

## Technical Considerations

- **Drag-and-drop library:** Install `@dnd-kit/core` and `@dnd-kit/utilities`. Avoid `react-beautiful-dnd` (deprecated).
- **Block type discrimination:** Use TypeScript discriminated unions for block types. The `metadata` JSON field on `EsmeMessage` stores the block type and type-specific data.
- **Backwards compatibility:** Existing `EsmeMessage` records without `blockType` in metadata should render as text blocks. The UI should handle `null`/missing metadata gracefully.
- **Server components:** The Esme page remains a server component that fetches messages and alerts, then passes serialized data to the client canvas component.
- **Alert data flow:** The alert tray and canvas alert blocks share the same data source. Use React state lifted to the canvas shell to keep them in sync. Server action revalidation (`revalidatePath`) handles cross-request consistency.
- **Daily briefing:** Generated server-side in the page component. Check for existing briefing by querying `EsmeMessage` where `metadata LIKE '%briefingDate%'` for today's date. If none exists, generate and insert one before rendering.
- **Performance:** Canvas should virtualize if message count exceeds ~100 blocks (not needed for demo, but worth noting for future).

## Success Metrics

- Esme page loads with canvas + alert tray in under 1 second
- User can drag an alert from tray to canvas in a single gesture
- Daily briefing displays accurate counts matching actual workspace data
- All alert response types (confirm, select, text) work on canvas alert blocks
- No regression in existing Esme chat functionality (sending messages, keyword responses)
- Collapsing/expanding the alert tray is smooth (150ms transition)

## Open Questions

- Should the alert tray show a "Resolved" section at the bottom, or should resolved alerts disappear entirely from the tray?
- Should dragging an alert to the canvas mark it as "acknowledged" (a new intermediate status)?
- Should the briefing block be collapsible/dismissable after the user has read it?
- Should the canvas support keyboard-driven alert focus (arrow keys to navigate blocks, Enter to expand)?
- When Esme responds to a dropped alert, should the response include data from the alert's related event (if linked)?
