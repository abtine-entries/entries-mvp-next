# PRD: Notion-Style Data Tables — Clickable Cells, Entity Sidebars & Custom Relations

## Introduction

Evolve the data table architecture to match Notion's interactive paradigm. Cells that reference entities (Source, Category, Vendor, Document) become clickable, opening enhanced sidebar detail views with rich context. A new user-defined relation column system lets users create custom columns that link records across tables — with multi-link support and a searchable popover picker. This transforms our tables from flat read-only grids into an interconnected, navigable data mesh.

## Goals

- Make every entity-referencing cell in every table clickable, opening an enhanced sidebar with full entity context
- Build an enhanced sidebar system with entity-specific detail views (transactions list, sync status, aggregated stats, connection management)
- Create a flexible, user-defined relation column system where users can create new relation columns linking any two tables
- Support multi-link relations (many-to-many) so a single record can link to multiple records in another table
- Generalize the existing `StatementCell` pattern into a reusable `RelationCell` component with Notion-style popover picker
- Maintain URL state persistence and existing table performance

## User Stories

### US-001: Clickable entity cells — Source
**Description:** As a user, I want to click on a Source cell (e.g., "Chase" or "QuickBooks") in any table so that a sidebar opens showing all transactions from that source, sync status, and connection details.

**Acceptance Criteria:**
- [ ] Source cells in the Explorer transactions tab and Event Feed table are rendered as clickable links (underline on hover, pointer cursor)
- [ ] Clicking a Source cell opens the existing sidebar/drawer (not a full page navigation)
- [ ] Sidebar shows: source name, connector logo, sync status badge, last sync timestamp, total transaction count, total volume
- [ ] Sidebar includes a paginated table of the 20 most recent transactions from that source
- [ ] Sidebar includes connection management actions: "Re-sync" and "Disconnect" buttons
- [ ] Clicking a Source cell does NOT trigger the row-level click handler (event propagation stopped)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-002: Clickable entity cells — Vendor
**Description:** As a user, I want to click on a Vendor name in the Explorer vendors tab or in a transaction's vendor reference so that a sidebar opens with vendor details and transaction history.

**Acceptance Criteria:**
- [ ] Vendor name cells in Explorer (transactions tab "Description" vendor link, vendors tab) are clickable
- [ ] Sidebar shows: vendor name, normalized name, total spend, transaction count, first seen / last seen dates
- [ ] Sidebar includes a table of the 10 most recent transactions for that vendor
- [ ] Sidebar includes a spending trend summary (total spend per month for last 6 months)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-003: Clickable entity cells — Category
**Description:** As a user, I want to click on a Category cell in the Explorer transactions tab or categories tab so that a sidebar shows category details and all transactions in that category.

**Acceptance Criteria:**
- [ ] Category cells in Explorer transactions tab and categories tab are clickable
- [ ] Sidebar shows: category name, type (expense/income/etc.), parent category (if hierarchical)
- [ ] Sidebar includes transaction count and total amount for this category
- [ ] Sidebar includes a table of the 10 most recent transactions in this category
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-004: Clickable entity cells — Document
**Description:** As a user, I want to click on a Document reference (e.g., in the Statement column or Docs table) so that a sidebar shows document details including linked transactions.

**Acceptance Criteria:**
- [ ] Document file name cells in the Docs table and Statement cells in Explorer are clickable
- [ ] Sidebar shows: file name, file type badge, file size, upload date, uploaded by, parse status
- [ ] Sidebar includes a table of all transactions linked to this document
- [ ] Sidebar includes a download button and a "View PDF" action (for PDF documents)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-005: Enhanced sidebar shell — polymorphic entity detail
**Description:** As a developer, I need to refactor the sidebar to support a unified entity-detail pattern that any table can invoke for any entity type.

**Acceptance Criteria:**
- [ ] Create a shared `EntityDetailSidebar` component that accepts an entity type and entity ID
- [ ] The component dynamically renders the correct detail view based on entity type (source, vendor, category, document)
- [ ] The sidebar is accessible from any data table in the application (Explorer, Event Feed, Docs, Bills, Rules)
- [ ] The sidebar supports loading states while fetching entity data
- [ ] The sidebar supports an error state if the entity is not found
- [ ] The existing `RowDetailSidebar` in Explorer continues to work for row-level clicks (transaction detail, etc.)
- [ ] Typecheck/lint passes

### US-006: Schema — RelationColumn and RelationLink models
**Description:** As a developer, I need database models to store user-defined relation columns and the many-to-many links between records.

**Acceptance Criteria:**
- [ ] Add `RelationColumn` model to Prisma schema with fields: `id`, `workspaceId`, `name` (display label), `sourceTable` (enum: transactions, documents, bills, vendors, categories, events, rules), `targetTable` (same enum), `createdAt`, `updatedAt`
- [ ] Add `RelationLink` model with fields: `id`, `relationColumnId`, `sourceRecordId`, `targetRecordId`, `createdAt`
- [ ] `RelationLink` has a unique constraint on `(relationColumnId, sourceRecordId, targetRecordId)` to prevent duplicate links
- [ ] `RelationColumn` has a relation to `Workspace` and cascading deletes
- [ ] `RelationLink` has a relation to `RelationColumn` with cascading deletes
- [ ] Migration generates and runs successfully
- [ ] Typecheck passes

### US-007: Server actions — CRUD for relation columns
**Description:** As a developer, I need server actions to create, list, update, and delete relation columns for a workspace.

**Acceptance Criteria:**
- [ ] `createRelationColumn(workspaceId, name, sourceTable, targetTable)` — creates a new relation column
- [ ] `getRelationColumns(workspaceId, sourceTable?)` — lists relation columns, optionally filtered by source table
- [ ] `updateRelationColumn(id, name)` — renames a relation column
- [ ] `deleteRelationColumn(id, workspaceId)` — deletes a column and all its links (cascade)
- [ ] All actions validate that the workspace exists and the user has access
- [ ] All actions call `revalidatePath` after mutations
- [ ] Typecheck passes

### US-008: Server actions — CRUD for relation links
**Description:** As a developer, I need server actions to create and remove links between records via a relation column.

**Acceptance Criteria:**
- [ ] `addRelationLink(relationColumnId, sourceRecordId, targetRecordId)` — creates a link
- [ ] `removeRelationLink(relationColumnId, sourceRecordId, targetRecordId)` — removes a link
- [ ] `getRelationLinks(relationColumnId, sourceRecordId)` — returns all target records linked from a given source record
- [ ] `getTargetRecordOptions(workspaceId, targetTable, search?)` — returns candidate records for linking with optional search filter (used by the popover picker)
- [ ] Duplicate links are handled gracefully (upsert or no-op)
- [ ] Typecheck passes

### US-009: RelationCell component — Notion-style popover picker
**Description:** As a user, I want relation columns to show linked records as inline chips, and clicking the cell opens a searchable popover where I can add or remove links.

**Acceptance Criteria:**
- [ ] `RelationCell` component renders linked records as small, clickable chips/badges inside the cell
- [ ] If no records are linked, an empty state shows a "+" icon on row hover (matching existing `StatementCell` pattern)
- [ ] Clicking the cell (or "+") opens a `Popover` with a `Command` (cmdk) searchable list of target records
- [ ] The popover shows a checkbox next to each option; checked items are currently linked
- [ ] Selecting an unchecked item adds a link; selecting a checked item removes the link (toggle behavior)
- [ ] Changes are optimistically updated in the UI with `useTransition` / `useOptimistic`
- [ ] The popover supports search/filter of target records
- [ ] Multiple chips in a cell truncate gracefully with a "+N more" overflow indicator
- [ ] Clicking a linked chip opens the entity detail sidebar for that record
- [ ] Cell click does NOT trigger the row-level click handler (event propagation stopped)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-010: "Add relation column" UI in table header
**Description:** As a user, I want to add new relation columns to any table by clicking a "+" button in the table header, similar to Notion's "Add a property" action.

**Acceptance Criteria:**
- [ ] A "+" button appears after the last column header in every data table
- [ ] Clicking "+" opens a popover/dialog with fields: column name (text input) and target table (dropdown of available tables)
- [ ] Submitting creates the relation column via server action and the new column appears in the table
- [ ] The new column immediately renders `RelationCell` for every row
- [ ] The source table is inferred from the current table context (not user-selected)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-011: Manage relation columns — rename and delete
**Description:** As a user, I want to rename or delete custom relation columns I've created.

**Acceptance Criteria:**
- [ ] Right-clicking (or clicking a "..." menu on) a relation column header opens a context menu with "Rename" and "Delete" options
- [ ] "Rename" opens an inline text input in the column header, saving on Enter or blur
- [ ] "Delete" shows a confirmation dialog warning that all links in this column will be removed
- [ ] Confirming delete removes the column from the table and deletes all associated links
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-012: Migrate existing Statement column to RelationCell
**Description:** As a developer, I want to migrate the existing `StatementCell` (transaction→document link) to use the new `RelationCell` system so we have one unified relation pattern.

**Acceptance Criteria:**
- [ ] The existing `documentId` foreign key on Transaction remains as-is for backward compatibility
- [ ] A default "Statement" `RelationColumn` is seeded for each workspace (sourceTable=transactions, targetTable=documents)
- [ ] Existing transaction→document links are migrated to `RelationLink` records
- [ ] The Statement column in Explorer renders using `RelationCell` instead of the legacy `StatementCell`
- [ ] Multi-link is now supported: a transaction can link to multiple documents
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-013: Persist relation columns in table column order
**Description:** As a developer, I need relation columns to integrate with the existing column definition system so they render in the correct position within each table.

**Acceptance Criteria:**
- [ ] Relation columns are fetched on page load alongside static column definitions
- [ ] Relation columns are appended after the last static column but before any "Actions" column
- [ ] Column order is deterministic (sorted by `createdAt` ascending)
- [ ] If a relation column is deleted, it disappears from the table on next load
- [ ] Typecheck passes

### US-014: Loading and empty states for relation data
**Description:** As a user, I want relation cells and entity sidebars to show appropriate loading and empty states.

**Acceptance Criteria:**
- [ ] Relation cells show a subtle skeleton/shimmer while links are loading
- [ ] Entity detail sidebar shows a skeleton layout while entity data is loading
- [ ] If no links exist for a relation cell, the cell shows a muted "+" on row hover
- [ ] If an entity sidebar fails to load (e.g., deleted record), it shows an error message with a close button
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: All entity-referencing cells (Source, Category, Vendor, Document) across all data tables must be clickable and open an enhanced detail sidebar
- FR-2: Cell clicks must stop propagation so they do not trigger row-level click handlers
- FR-3: The entity detail sidebar must dynamically render content based on entity type (source, vendor, category, document)
- FR-4: Source detail sidebar must display: connector logo, sync status, last sync time, transaction count, total volume, recent transactions table, and "Re-sync" / "Disconnect" actions
- FR-5: Vendor detail sidebar must display: name, total spend, transaction count, date range, recent transactions, and monthly spending trend
- FR-6: Category detail sidebar must display: name, type, parent category, transaction count, total amount, and recent transactions
- FR-7: Document detail sidebar must display: file name, type, size, status, upload info, linked transactions, and download/view actions
- FR-8: Users must be able to create custom relation columns on any table, specifying a column name and target table
- FR-9: Relation columns must support many-to-many linking (one source record can link to multiple target records)
- FR-10: Relation cells must render linked records as inline chips and provide a searchable popover picker for adding/removing links
- FR-11: The popover picker must fetch candidate target records with search/filter support
- FR-12: Relation columns must support rename and delete via a column header context menu
- FR-13: Deleting a relation column must cascade-delete all associated links
- FR-14: The existing Statement (transaction→document) pattern must be migrated to the new RelationCell system
- FR-15: Relation column definitions must be stored in the database (`RelationColumn` model) and scoped to a workspace
- FR-16: Relation links must be stored in the database (`RelationLink` model) with a unique constraint preventing duplicate links
- FR-17: All relation mutations must use optimistic UI updates for responsiveness

## Non-Goals

- No drag-and-drop column reordering (relation columns append at end)
- No formula or rollup columns (Notion-style computed properties)
- No relation columns that reference records across different workspaces
- No inline editing of entity details from within the sidebar (view-only for now)
- No full-page entity detail views — sidebar/drawer pattern only
- No bi-directional relation column auto-creation (creating a relation from Table A→B does not auto-create a reverse column on Table B)
- No filtering or sorting by relation column values (future enhancement)
- No row-level permissions on relation links

## Design Considerations

- **Clickable cells:** Use underline-on-hover + pointer cursor to signal clickability. Match the existing `StatementCell` visual pattern (muted when empty, primary color when populated).
- **Entity sidebar:** Extend or compose alongside the existing `RowDetailSidebar` Sheet component. Use the same slide-in-from-right animation. Consider a tab layout within the sidebar for entities with lots of content (e.g., Source: "Transactions" tab, "Settings" tab).
- **Relation chips:** Render as small rounded badges inside the cell. Use the target entity's display name. Truncate with "+N" overflow when more than 2-3 chips fit.
- **Popover picker:** Reuse the existing `Command` (cmdk) pattern from `StatementCell`. Add checkboxes for multi-select. Show entity-specific secondary info (e.g., document type badge, vendor spend amount).
- **"+" column button:** Style as a muted, borderless button matching the table header height. Show a subtle icon only.
- **Existing components to reuse:** `Popover`, `Command`, `CommandInput`, `CommandList`, `CommandItem`, `Badge`, `Sheet`, `SourceIcon`, `Skeleton`.

## Technical Considerations

- **Database:** Two new models (`RelationColumn`, `RelationLink`). The `sourceTable`/`targetTable` fields use a string enum rather than a Prisma enum to avoid migration churn as new tables are added. Validate at the application layer.
- **Column definitions:** Static columns are defined in `columns.tsx` files at build time. Relation columns must be fetched at runtime and merged into the `ColumnDef[]` array. Use a utility function like `buildColumnsWithRelations(staticColumns, relationColumns, documents, workspaceId)`.
- **Data fetching:** Relation links for visible rows should be batch-fetched in the page's server action (e.g., `getRelationLinksForRecords(relationColumnId, recordIds[])`) rather than per-cell to avoid N+1 queries.
- **Optimistic updates:** Use React's `useTransition` + local state for immediate UI feedback when adding/removing links, matching the existing `StatementCell` pattern.
- **Migration path:** The existing `Transaction.documentId` FK is preserved. The migration script creates `RelationLink` records from existing `documentId` values. After migration, the `RelationCell` reads from `RelationLink` instead of the FK. The FK can be deprecated in a future cleanup.
- **Performance:** Relation cells with many links could impact table rendering. Cap the visible chip count at 3 with a "+N more" overflow. Lazy-load the popover's candidate list on open (not on table render).
- **Bundle size:** The `Command` (cmdk) component is already in the bundle via `StatementCell`. No new heavy dependencies expected.

## Success Metrics

- Users can click any entity cell and see a rich detail sidebar in under 300ms
- Users can create a new relation column and link their first record within 3 clicks
- The relation popover search returns results within 200ms for workspaces with up to 10,000 records
- Existing StatementCell functionality is preserved with zero regressions after migration
- Table render performance remains under 100ms for tables with up to 5 relation columns

## Open Questions

1. Should we batch-fetch all relation data for visible rows in one query, or lazy-load per-cell on scroll? (Recommendation: batch-fetch for the current page of rows)
2. Should the "+" add-column button be visible only to workspace admins, or all members?
3. Should we support a "default" set of relation columns per workspace (auto-created on workspace creation), or start completely empty?
4. How should relation columns interact with CSV/data export — include linked record names as comma-separated values?
5. Should clicking a chip inside a relation cell open the entity sidebar immediately, or require a modifier key (Cmd+click) to avoid accidental navigation?
