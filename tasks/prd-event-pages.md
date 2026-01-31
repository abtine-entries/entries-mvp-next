# PRD: Event Pages

## Introduction

Every entity in Entries (transactions, matches, anomalies, rules, syncs, AI actions) becomes a first-class "event" with its own dedicated page — just like pages in Notion. Each event page shows its properties, an audit trail of changes, and contextual notes. Properties are defined at the workspace level (like Notion database columns), so all events in a workspace share a consistent schema. Notes serve double duty: human context for the accountant and metadata context for the knowledge graph.

This is an architectural change that elevates events from table rows to rich, navigable pages — the foundational building block of Entries' knowledge graph.

## Goals

- Every event has a dedicated page at `/workspace/{id}/event/{eventId}` with full breadcrumb navigation
- Users can define custom property schemas at the workspace level (text, number, boolean, date, select)
- Each event page displays an audit trail showing all modifications over time (by users and Entries AI)
- Users can add timestamped plain-text notes to any event, which feed into the knowledge graph as context
- The event feed links into individual event pages (click-through navigation)

## User Stories

### US-060: Create Event model and schema migration
**Description:** As a developer, I need a generic Event model that wraps any entity type so that all entities can be navigated as pages.

**Acceptance Criteria:**
- [ ] New `Event` model in Prisma schema with fields: `id`, `workspaceId`, `entityType` (transaction, match, anomaly, rule, sync, ai_action), `entityId`, `title`, `createdAt`, `updatedAt`
- [ ] Event has relations to Workspace
- [ ] Migration runs successfully
- [ ] Seed script creates Event records for existing transactions
- [ ] Typecheck/lint passes

### US-061: Create EventProperty and EventPropertyDefinition models
**Description:** As a developer, I need schema-level property definitions and per-event property values so users can define custom typed properties.

**Acceptance Criteria:**
- [ ] New `EventPropertyDefinition` model: `id`, `workspaceId`, `name`, `type` (text, number, boolean, date, select), `options` (JSON, for select type), `position` (ordering), `createdAt`
- [ ] New `EventProperty` model: `id`, `eventId`, `definitionId`, `value` (stored as JSON string to support all types), `createdAt`, `updatedAt`
- [ ] Relations: Definition belongs to Workspace, Property belongs to Event and Definition
- [ ] Migration runs successfully
- [ ] Typecheck/lint passes

### US-062: Create EventNote model
**Description:** As a developer, I need a notes model so users and AI can attach contextual plain-text notes to events.

**Acceptance Criteria:**
- [ ] New `EventNote` model: `id`, `eventId`, `authorId` (nullable — null for AI), `authorType` (user, ai), `content` (text), `createdAt`, `updatedAt`
- [ ] Relation to Event
- [ ] Migration runs successfully
- [ ] Typecheck/lint passes

### US-063: Event page route and layout
**Description:** As a user, I want to navigate to a dedicated event page so I can see all details about that event.

**Acceptance Criteria:**
- [ ] New route at `/workspace/[id]/event/[eventId]/page.tsx`
- [ ] Breadcrumb shows: `Entries > {Workspace} > Event Feed > {Event Title}`
- [ ] Page fetches event with its entity data, properties, notes, and audit logs
- [ ] Returns 404 if event not found or wrong workspace
- [ ] Page layout has sections: Header (title + entity type badge), Properties, Notes, Audit Trail
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-064: Event page — properties section
**Description:** As a user, I want to view and edit custom properties on an event page so I can add structured metadata.

**Acceptance Criteria:**
- [ ] Properties section displays all workspace-level property definitions
- [ ] Each property renders an appropriate input: text field, number input, boolean toggle, date picker, select dropdown
- [ ] Editing a property value saves immediately (optimistic update)
- [ ] Saving a property creates an audit log entry with old/new values
- [ ] Empty properties show placeholder text ("Empty")
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-065: Event page — notes section
**Description:** As a user, I want to add plain-text notes to an event so I can capture context that informs the knowledge graph.

**Acceptance Criteria:**
- [ ] Notes section displays all notes in chronological order
- [ ] Each note shows: author name (or "Entries AI"), timestamp, content
- [ ] Text input at bottom of notes section with submit button
- [ ] New notes appear immediately after submission
- [ ] Notes are stored as EventNote records with authorType
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-066: Event page — audit trail section
**Description:** As a user, I want to see a chronological history of all changes to an event so I can understand how it evolved.

**Acceptance Criteria:**
- [ ] Audit trail section displays all AuditLog entries for the event's entity
- [ ] Each entry shows: action label, timestamp, actor (user name or "Entries AI"), old/new values where applicable
- [ ] Property changes show: property name, old value, new value
- [ ] Note additions appear in the audit trail
- [ ] Most recent entries appear first
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-067: Event feed — click-through to event pages
**Description:** As a user, I want to click an event in the feed to navigate to its dedicated page.

**Acceptance Criteria:**
- [ ] Each row in the event feed is a clickable link to `/workspace/{id}/event/{eventId}`
- [ ] Hover state indicates clickability (cursor pointer, subtle highlight)
- [ ] Navigation preserves sidebar state and workspace context
- [ ] Back button returns to event feed
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-068: Workspace property schema management
**Description:** As a user, I want to define property types at the workspace level so all events share a consistent schema.

**Acceptance Criteria:**
- [ ] UI to add new property definitions (name + type + options for select)
- [ ] UI to reorder properties (drag or up/down buttons)
- [ ] UI to rename or delete property definitions
- [ ] Deleting a definition prompts confirmation (warns about data loss)
- [ ] Property definitions are accessible from the event page (e.g. via a settings/schema button)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-069: Extend audit logging for properties and notes
**Description:** As a developer, I need all property edits and note additions to generate audit log entries.

**Acceptance Criteria:**
- [ ] Property value changes create AuditLog with action `property_updated`, oldValue/newValue as JSON
- [ ] Note additions create AuditLog with action `note_added`, newValue containing note content
- [ ] AuditLog entries reference the Event's entityId for consistency with existing audit logs
- [ ] Audit log entries include the property definition name in the stored JSON for readability
- [ ] Typecheck/lint passes

### US-070: Event page header with entity-specific data
**Description:** As a user, I want the event page header to show relevant entity data (amount, date, source, status) so I get key info at a glance.

**Acceptance Criteria:**
- [ ] Header shows event title and entity type badge (Transaction, Match, Anomaly, Rule, etc.)
- [ ] For transactions: shows amount, date, source, status, category, confidence
- [ ] For matches: shows matched transactions, match type, confidence
- [ ] For anomalies: shows severity, type, status, suggested resolution
- [ ] Data is read from the related entity (not duplicated on Event model)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Create `Event` model as a generic wrapper for any entity type (transaction, match, anomaly, rule, sync, ai_action)
- FR-2: Create `EventPropertyDefinition` model for workspace-level property schema (types: text, number, boolean, date, select)
- FR-3: Create `EventProperty` model for per-event property values, linked to definitions
- FR-4: Create `EventNote` model for plain-text notes with author tracking (user or AI)
- FR-5: Event page route at `/workspace/[id]/event/[eventId]` with breadcrumb navigation
- FR-6: Event page displays: entity-specific header, custom properties (editable), notes (addable), audit trail (read-only)
- FR-7: Property edits save immediately and generate audit log entries
- FR-8: Notes are plain text, timestamped, attributed to user or AI
- FR-9: Audit trail shows all modifications chronologically with actor, action, and old/new values
- FR-10: Event feed rows link to individual event pages
- FR-11: Workspace settings allow adding, editing, reordering, and deleting property definitions
- FR-12: Deleting a property definition warns the user about data loss
- FR-13: Event records are automatically created when entities (transactions, matches, etc.) are created
- FR-14: Notes stored on events contribute to the knowledge graph context (via metadata)

## Non-Goals

- No rich text or markdown in notes (plain text only)
- No inline editing of entity-specific fields on the event page (e.g. transaction amount is read-only — edit via original UI)
- No drag-and-drop property reordering in v1 (up/down buttons are fine)
- No event templates or event types beyond entity types
- No real-time collaboration on event pages
- No event-to-event relations or linking (future)
- No bulk property editing across multiple events

## Design Considerations

- Follow Notion's page layout: title at top, properties as key-value rows below, then content (notes), then activity (audit trail)
- Property rows should use the same layout pattern as Notion: label on the left, value/input on the right
- Entity type badge uses existing tag colors from the design system
- Audit trail uses a timeline layout similar to the existing transaction detail modal history section
- Notes section should feel lightweight — just a text area and a list of entries, no heavy UI
- Reuse existing UI components: Badge, Input, Button, Card, Dialog (for confirmation)

## Technical Considerations

- **Event model is a thin wrapper:** It stores entityType + entityId and resolves the actual entity via relation or lookup. Entity-specific data lives on the original model (Transaction, Match, etc.), not duplicated.
- **Property values stored as JSON strings:** Since SQLite doesn't support JSON columns natively, store all property values as JSON strings (consistent with existing AuditLog pattern).
- **Audit log integration:** Extend existing AuditLog model — no new audit model needed. Property/note changes use the Event's entityId as the entityId in AuditLog for backwards compatibility.
- **Event creation hook:** When a Transaction, Match, Anomaly, or Rule is created, an Event record should be created alongside it. This can be done in the existing server actions or via Prisma middleware.
- **Performance:** Event page loads entity + properties + notes + audit logs. Use `Promise.all` for parallel fetching. Paginate audit logs if they grow large.

## Success Metrics

- Every entity in the system is navigable as a page via the event feed
- Users can add and edit custom properties on events within 2 clicks
- Audit trail accurately reflects all changes made by users and AI
- Notes provide useful context that can be surfaced by the knowledge graph

## Open Questions

- Should the event feed auto-create Event records for historical transactions, or only for new ones going forward?
- Should property definitions be shared across workspaces (global templates) or strictly per-workspace?
- How should the knowledge graph consume event notes — direct DB query, or a separate indexing step?
