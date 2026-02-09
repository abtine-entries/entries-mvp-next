# PRD: Migrate All Components to shadcn

## Introduction

Migrate the entire Entries MVP frontend to use shadcn/ui as the default component library. The project already has ~85% shadcn adoption with 16 standard and 4 enhanced shadcn UI components. This migration completes the remaining 15% by: adopting shadcn blocks for the sidebar and login page, replacing the custom layout shell with shadcn's SidebarProvider pattern, migrating custom breadcrumbs, refactoring domain-specific components to compose shadcn primitives internally, and adopting the shadcn neutral theme as the base with Entries brand color overrides.

This is a single-PR migration. Every component file should either be a shadcn component or explicitly justified as custom.

## Goals

- Make shadcn/ui the single source of truth for all UI primitives
- Adopt shadcn Sidebar block to replace the custom sidebar implementation
- Adopt shadcn login block to replace the custom login page
- Replace custom Breadcrumb and AppShell with shadcn equivalents (Breadcrumb, SidebarProvider/SidebarInset)
- Refactor domain-specific components (ConnectorLogo, SourceIcon, SyntaxJson) to compose shadcn primitives internally
- Adopt shadcn neutral theme as the base, overriding only with Entries brand colors
- Eliminate all hand-rolled UI where a shadcn equivalent exists (inline-styled cards, badges, etc.)

## User Stories

### US-001: Install missing shadcn components
**Description:** As a developer, I need all required shadcn primitives installed so the migration can reference them.

**Acceptance Criteria:**
- [ ] Install via CLI: `sidebar`, `breadcrumb`, `separator`, `avatar`, `collapsible`, `scroll-area`, `sheet`, `tabs`, `sonner`
- [ ] Verify each component file exists in `src/components/ui/`
- [ ] Typecheck passes (`npx tsc --noEmit`)

---

### US-002: Adopt shadcn neutral theme as base with brand overrides
**Description:** As a designer, I want the shadcn neutral theme as the foundation so our design tokens align with the ecosystem, while preserving Entries brand identity.

**Acceptance Criteria:**
- [ ] Update `globals.css` to use the shadcn neutral theme CSS variables as the base layer
- [ ] Override `--primary` with Entries Blue (`hsl(214 99% 50%)`) and `--primary-foreground` with white
- [ ] Preserve all existing semantic color variables (success, warning, error, info) as custom extensions
- [ ] Preserve the dark-mode-only Notion-inspired palette (background `hsl(220 7% 15%)`, etc.)
- [ ] Map sidebar-specific CSS variables (`--sidebar-background`, `--sidebar-foreground`, etc.) to Entries dark palette
- [ ] `--radius` set to `0.375rem` (6px) to match current default border-radius
- [ ] Verify no visual regressions on existing pages (spot-check login, home, event feed, event detail)
- [ ] Typecheck passes

---

### US-003: Migrate sidebar to shadcn Sidebar block
**Description:** As a user, I want a polished sidebar navigation that supports workspace switching, collapsible state, and search — built on the shadcn Sidebar component for consistency and accessibility.

**Acceptance Criteria:**
- [ ] Replace `src/components/layout/sidebar.tsx` with a new implementation using shadcn `Sidebar`, `SidebarContent`, `SidebarHeader`, `SidebarFooter`, `SidebarMenu`, `SidebarMenuButton`, `SidebarMenuItem`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarRail`
- [ ] Workspace switcher in `SidebarHeader` using the shadcn TeamSwitcher pattern (DropdownMenu with workspace list and "Create workspace" option)
- [ ] Navigation items rendered via `SidebarMenu` + `SidebarMenuButton` with Lucide icons, matching current nav structure (Home, Event Feed, Connectors, AI, Docs, Rules, Categorize, Reconciliation)
- [ ] Active route highlighting using `isActive` prop on `SidebarMenuButton`
- [ ] Collapsible sidebar support via `collapsible="icon"` prop
- [ ] User section in `SidebarFooter` using shadcn NavUser pattern with Avatar (show user name/email, sign out action)
- [ ] Cmd+K search trigger integrated into sidebar (keep existing search-modal.tsx, just wire it to a SidebarMenuButton)
- [ ] Existing sidebar state management (collapsed/expanded) migrated from custom AppShellContext to shadcn `SidebarProvider` / `useSidebar`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-004: Migrate AppShell layout to SidebarProvider + SidebarInset
**Description:** As a developer, I want the app layout to use shadcn's SidebarProvider/SidebarInset pattern so the sidebar and main content area are managed by the same system.

**Acceptance Criteria:**
- [ ] Replace `src/components/layout/app-shell.tsx` with a layout that wraps children in `SidebarProvider` > `AppSidebar` + `SidebarInset`
- [ ] Remove custom `AppShellContext` — all sidebar state now comes from `useSidebar()` hook
- [ ] `SidebarInset` contains the header area (SidebarTrigger + Breadcrumb) and the page content
- [ ] Update `src/app/(authenticated)/layout.tsx` to use the new layout component
- [ ] `TooltipProvider` still wraps the app (shadcn Sidebar requires it)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-005: Migrate Breadcrumb to shadcn Breadcrumb
**Description:** As a user, I want consistent breadcrumb navigation that follows shadcn's accessible pattern, integrated into the sidebar header area.

**Acceptance Criteria:**
- [ ] Replace `src/components/layout/breadcrumb.tsx` with shadcn `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`
- [ ] Breadcrumb renders inside the `SidebarInset` header, after `SidebarTrigger` and a vertical `Separator`
- [ ] Preserve existing breadcrumb data (workspace name, page name, icon support)
- [ ] Update `src/components/layout/page-header.tsx` to accept and render the new Breadcrumb
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-006: Migrate login page to shadcn login block pattern
**Description:** As a user, I want a polished login page that follows shadcn's login-01 block pattern while preserving Entries branding.

**Acceptance Criteria:**
- [ ] Refactor `src/app/login/page.tsx` to follow shadcn login-01 block structure (centered Card with CardHeader/CardContent, FieldGroup/Field/FieldLabel for form fields)
- [ ] Keep existing auth logic (Google OAuth via `signIn("google")`) unchanged
- [ ] Entries logo and branding preserved
- [ ] Uses shadcn Button, Card, Input, Label, Field components
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-007: Refactor ConnectorLogo to compose shadcn Avatar
**Description:** As a developer, I want ConnectorLogo to use shadcn Avatar internally so it inherits accessible markup and consistent styling.

**Acceptance Criteria:**
- [ ] Refactor `src/components/ui/connector-logo.tsx` to render using shadcn `Avatar`, `AvatarImage`, `AvatarFallback`
- [ ] Keep the existing public API (`ConnectorLogo` props: connector type, size, etc.) unchanged
- [ ] Fallback initials rendered via `AvatarFallback`
- [ ] Connector image rendered via `AvatarImage` with proper alt text
- [ ] All existing usages across the app continue to work without changes
- [ ] Typecheck passes

---

### US-008: Refactor SourceIcon to compose shadcn Avatar
**Description:** As a developer, I want SourceIcon to use shadcn Avatar internally for consistency with ConnectorLogo.

**Acceptance Criteria:**
- [ ] Refactor `src/components/ui/source-icon.tsx` to render using shadcn `Avatar`, `AvatarImage`, `AvatarFallback`
- [ ] Keep existing public API unchanged
- [ ] Entries logo fallback rendered via `AvatarFallback` or `AvatarImage`
- [ ] Falls back to ConnectorLogo (which now also uses Avatar) when appropriate
- [ ] All existing usages continue to work
- [ ] Typecheck passes

---

### US-009: Refactor SyntaxJson to compose shadcn ScrollArea
**Description:** As a developer, I want SyntaxJson to use shadcn ScrollArea for overflow handling instead of raw CSS overflow.

**Acceptance Criteria:**
- [ ] Wrap the JSON output in `src/components/ui/syntax-json.tsx` with shadcn `ScrollArea` for horizontal/vertical overflow
- [ ] Keep existing syntax highlighting logic and color scheme unchanged
- [ ] Keep existing public API unchanged
- [ ] All existing usages (event feed columns, audit trail) continue to work
- [ ] Typecheck passes

---

### US-010: Replace inline-styled cards on connectors page with shadcn Card
**Description:** As a developer, I want connector list items to use shadcn Card for visual consistency.

**Acceptance Criteria:**
- [ ] Refactor connector items in `src/app/(authenticated)/workspace/[id]/connectors/page.tsx` to use `Card`, `CardContent` instead of raw `<div className="border rounded-lg...">`
- [ ] Preserve existing layout, icons, and badge usage
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-011: Replace inline-styled stat cards on categorize page with shadcn Card
**Description:** As a developer, I want stat cards on the categorization page to use shadcn Card.

**Acceptance Criteria:**
- [ ] Refactor stat card divs in `src/app/(authenticated)/workspace/[id]/categorize/page.tsx` to use `Card`, `CardContent`
- [ ] Preserve existing stat display (count, label, icon)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-012: Replace custom notification badge in client-row with shadcn Badge
**Description:** As a developer, I want the new-event notification count to use shadcn Badge for consistency.

**Acceptance Criteria:**
- [ ] Refactor `src/app/(authenticated)/client-row.tsx` to use shadcn `Badge` component instead of custom `<span>` with inline className
- [ ] Preserve existing appearance (blue pill with count)
- [ ] Typecheck passes

---

### US-013: Audit and update all existing shadcn components to latest versions
**Description:** As a developer, I want all existing shadcn components to be up to date with the latest shadcn CLI output so we don't carry stale implementations.

**Acceptance Criteria:**
- [ ] Re-run `npx shadcn@latest add <component> --overwrite` for each existing shadcn component: `badge`, `button`, `calendar`, `card`, `checkbox`, `command`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `select`, `skeleton`, `switch`, `table`, `tooltip`
- [ ] After overwrite, re-apply any intentional customizations (Badge semantic variants, Card container queries/CardAction, Dialog showCloseButton, Switch size variants, Button xs size)
- [ ] Document each intentional customization with a `// Custom: <reason>` comment
- [ ] Typecheck passes
- [ ] Verify no visual regressions on key pages

---

### US-014: Full integration verification
**Description:** As a developer, I want to verify the entire app works correctly after the migration.

**Acceptance Criteria:**
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Manually verify in browser: login page, home/workspace list, event feed, event detail page, connectors page, AI chat, docs page, rules page, categorize page, reconciliation page
- [ ] Sidebar expands/collapses correctly
- [ ] Workspace switcher works
- [ ] Breadcrumbs show correct hierarchy on all pages
- [ ] Search modal (Cmd+K) opens and functions
- [ ] No console errors in browser DevTools

## Functional Requirements

- FR-1: All UI primitives (Button, Card, Input, Select, Dialog, Badge, Table, etc.) must come from shadcn/ui installed via the CLI
- FR-2: The sidebar must use shadcn's `Sidebar` component with `SidebarProvider` for state management
- FR-3: Breadcrumbs must use shadcn's `Breadcrumb` component
- FR-4: The app layout must use `SidebarProvider` + `SidebarInset` instead of a custom AppShell
- FR-5: The login page must follow the shadcn login-01 block pattern
- FR-6: Domain-specific components (ConnectorLogo, SourceIcon, SyntaxJson) must compose shadcn primitives internally while preserving their public API
- FR-7: The theme must use shadcn's neutral base with CSS variable overrides for Entries brand colors
- FR-8: All inline-styled UI elements that have shadcn equivalents must be replaced (Cards on connectors/categorize pages, Badge on client-row)
- FR-9: Every shadcn component must be the latest version from the CLI, with intentional customizations documented via comments
- FR-10: The app must build, typecheck, and lint without errors after migration

## Non-Goals

- No light mode support — the app remains dark-mode only
- No redesign of page layouts or information architecture — only component-level migration
- No new features or functionality — this is a pure infrastructure/component migration
- No changes to business logic, API calls, or data fetching
- No migration of TanStack React Table to a different table solution — DataTable stays as a custom wrapper around shadcn Table
- No changes to the custom Field or InputGroup components — they are complementary to shadcn and already well-designed
- No changes to the SearchModal implementation — only its trigger point moves into the sidebar

## Design Considerations

- **Sidebar pattern:** Use shadcn `sidebar-07` as the reference (collapsible to icons, workspace switcher in header, user in footer). Adapt to Entries' navigation structure.
- **Login pattern:** Use shadcn `login-01` as the reference (centered Card form). Adapt to Entries branding and Google OAuth.
- **Brand colors:** The shadcn neutral theme provides grays. Override `--primary` and `--primary-foreground` for Entries Blue. Keep semantic colors (success/warning/error/info) as custom CSS variable extensions since shadcn doesn't have built-in semantic color variants.
- **Existing customizations to preserve:**
  - Badge: semantic variants (success, warning, error, info)
  - Card: container queries, CardAction component
  - Dialog: showCloseButton prop
  - Switch: size variants (sm, default)
  - Button: xs size variant
- **Avatar usage:** ConnectorLogo and SourceIcon should use shadcn Avatar's `AvatarImage` + `AvatarFallback` pattern. This gives accessible alt text and graceful fallback handling for free.

## Technical Considerations

- **Install order:** Install new shadcn components first (US-001), then update theme (US-002), then migrate layout (US-003 → US-005), then login (US-006), then domain components (US-007 → US-009), then page cleanup (US-010 → US-012), then update existing components (US-013), then verify (US-014).
- **SidebarProvider scope:** `SidebarProvider` must wrap the entire authenticated layout. It replaces the current `AppShellContext`.
- **shadcn Sidebar CSS variables:** The shadcn Sidebar component reads `--sidebar-*` CSS variables. These must be mapped to Entries' dark palette in `globals.css`.
- **Overwriting components:** When re-running the shadcn CLI with `--overwrite`, customizations will be lost. Back up customized components before overwriting, then re-apply changes.
- **Breaking change risk:** The sidebar and layout migration (US-003, US-004) are the highest-risk changes since they affect every authenticated page. These should be done together and verified immediately.
- **Radix UI dependencies:** Some new shadcn components will add Radix dependencies (`@radix-ui/react-separator`, `@radix-ui/react-avatar`, `@radix-ui/react-scroll-area`, `@radix-ui/react-collapsible`). These will be auto-installed by the shadcn CLI.

## Success Metrics

- Zero custom UI primitives — every button, card, input, select, dialog, badge, table, tooltip, popover, checkbox, switch, skeleton, calendar, command, dropdown-menu, label is a shadcn component
- Sidebar uses shadcn's Sidebar with zero custom state management
- Breadcrumbs use shadcn's Breadcrumb component
- Login page follows shadcn block pattern
- Build + typecheck + lint all pass
- No visual regressions on any page

## Open Questions

- Should the sidebar support mobile responsive behavior (shadcn Sidebar has built-in mobile sheet mode via `useSidebar().isMobile`)? Currently the app doesn't appear to have mobile layout handling.
- Should we adopt shadcn's `Sonner` (toast) component to replace any existing toast/notification patterns, or is that out of scope?
- The current sidebar has a workspace search/filter feature — should this be preserved as-is or simplified?
