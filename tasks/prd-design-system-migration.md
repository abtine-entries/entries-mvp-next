# PRD: Design System Migration from entries-mvp-cc

## Introduction

Migrate the design system, assets, and visual styling from the `entries-mvp-cc` (Vite/React) project to the `entries-mvp-next` (Next.js) project to achieve visual parity. This includes updating the sidebar navigation to match the source project's look and feel, migrating the Entries logo and branding, updating CSS variables/colors, and integrating logo.dev for connector logos throughout the application.

## Goals

- Achieve exact visual parity between the two projects' navigation and overall styling
- Migrate the Entries logo and update branding from "Writeoff" to "Entries"
- Update all CSS variables and design tokens to match the source project
- Ensure logo.dev is used consistently for connector/service logos
- Maintain existing Next.js functionality and routing while updating visual presentation

## User Stories

### US-040: Migrate Entries logo asset
**Description:** As a user, I want to see the Entries branding so the app has consistent visual identity.

**Acceptance Criteria:**
- [ ] Copy `Entries Icon Blue Background.png` from source project to `/public/` directory
- [ ] Update sidebar logo to use the Entries icon image (h-6 w-6 rounded-[3px])
- [ ] Change brand text from "Writeoff" to "Entries" in sidebar
- [ ] Update favicon to match Entries branding
- [ ] Typecheck passes

### US-041: Update CSS design tokens
**Description:** As a developer, I need the CSS variables to match the source project so all components use consistent styling.

**Acceptance Criteria:**
- [ ] Update `globals.css` with exact CSS variables from source project
- [ ] Migrate sidebar-specific CSS variables (sidebar-background, sidebar-foreground, sidebar-accent, etc.)
- [ ] Update semantic colors (success, warning, error, info) to match source
- [ ] Ensure oklch color format is used where applicable
- [ ] Verify all existing components still render correctly
- [ ] Typecheck passes

### US-042: Update typography configuration
**Description:** As a user, I want consistent typography so the app feels polished and readable.

**Acceptance Criteria:**
- [ ] Update font family from "Inter Tight" to "Inter" in root layout
- [ ] Add font-heading, font-body, and font-mono CSS variables
- [ ] Update @theme block in globals.css with typography tokens
- [ ] Verify h1-h4 and body text styles match source project
- [ ] Typecheck passes

### US-043: Match sidebar visual styling
**Description:** As a user, I want the sidebar navigation to look identical to the source project.

**Acceptance Criteria:**
- [ ] Update sidebar background color to match (oklch values)
- [ ] Update sidebar width to 240px expanded / 64px collapsed (currently correct)
- [ ] Apply correct text colors: `text-sidebar-foreground` for default, `text-sidebar-accent-foreground` for active
- [ ] Update hover state: `hover:bg-sidebar-accent/50`
- [ ] Update active state: `bg-sidebar-accent text-sidebar-accent-foreground font-semibold`
- [ ] Apply `transition-colors duration-150` to nav items
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-044: Update navigation item styling
**Description:** As a user, I want navigation items to have proper visual feedback on hover and selection.

**Acceptance Criteria:**
- [ ] Nav items have `min-h-[36px]` minimum height
- [ ] Icons are h-4 w-4 size consistently
- [ ] Gap between icon and text is `gap-3` (12px)
- [ ] Apply `rounded-md` border radius to nav items
- [ ] Section labels use uppercase styling with smaller font size
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-045: Update sidebar logo section
**Description:** As a user, I want the logo section to match the source project with proper spacing and styling.

**Acceptance Criteria:**
- [ ] Logo image uses `h-6 w-6 rounded-[3px] flex-shrink-0` styling
- [ ] Brand text uses `font-heading text-sm font-semibold text-sidebar-accent-foreground`
- [ ] Brand text conditionally hidden when sidebar is collapsed
- [ ] Logo links to home page
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-046: Update breadcrumb styling
**Description:** As a user, I want the breadcrumb to match the source project's visual style.

**Acceptance Criteria:**
- [ ] Breadcrumb container has `h-12` height (48px)
- [ ] Apply `px-6` horizontal padding
- [ ] Add `border-b border-border` bottom border
- [ ] Use `bg-background` for breadcrumb bar
- [ ] Chevron separators match source styling
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-047: Update button component variants
**Description:** As a developer, I need button variants to match the source project's design system.

**Acceptance Criteria:**
- [ ] Default variant: `bg-primary text-primary-foreground shadow hover:bg-primary/90`
- [ ] Outline variant: `border border-input bg-background hover:bg-accent hover:text-accent-foreground`
- [ ] Ghost variant: `hover:bg-accent hover:text-accent-foreground`
- [ ] Default size: `h-7 px-3 py-1.5` (28px height)
- [ ] Small size: `h-6 rounded-md px-2 text-[11px]`
- [ ] Icon size: `h-7 w-7`
- [ ] Typecheck passes

### US-048: Update badge component variants
**Description:** As a developer, I need badge variants to match the source project.

**Acceptance Criteria:**
- [ ] Add semantic variants if missing: success, warning, error, info
- [ ] Success uses `--success` color variable
- [ ] Warning uses `--warning` color variable
- [ ] Error uses `--error` color variable (currently --destructive)
- [ ] Info uses `--info` color variable
- [ ] Typecheck passes

### US-049: Update card component styling
**Description:** As a developer, I need cards to match the source project's styling.

**Acceptance Criteria:**
- [ ] Card uses `bg-card` background
- [ ] Border uses `border-border` color
- [ ] Default padding/gap matches source (gap-6 for CardHeader/Content)
- [ ] Card radius matches `--radius` variable
- [ ] Typecheck passes

### US-050: Configure logo.dev for additional areas
**Description:** As a user, I want to see service logos throughout the app, not just in connectors.

**Acceptance Criteria:**
- [ ] Move logo.dev token to environment variable (NEXT_PUBLIC_LOGO_DEV_TOKEN)
- [ ] Update ConnectorLogo component to use env variable
- [ ] Ensure workspace cards can display connector logos if applicable
- [ ] Verify existing connector logo usage still works
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-051: Update workspace switcher styling
**Description:** As a user, I want the workspace/client dropdown to match the source project visually.

**Acceptance Criteria:**
- [ ] Dropdown trigger matches source styling (shows workspace name when expanded, icon when collapsed)
- [ ] Popover content uses correct background and border colors
- [ ] Search input styling matches source
- [ ] Workspace list items have proper hover states
- [ ] "Add Client" button matches source styling
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-052: Update input component styling
**Description:** As a developer, I need input components to match the source project.

**Acceptance Criteria:**
- [ ] Input height matches source (h-9, 36px)
- [ ] Focus ring uses `ring-primary` color
- [ ] Border color uses `border-input` variable
- [ ] Background uses `bg-background`
- [ ] Placeholder text uses proper muted color
- [ ] Typecheck passes

### US-053: Final visual QA and cleanup
**Description:** As a developer, I need to verify all pages match the source project styling.

**Acceptance Criteria:**
- [ ] Home page (workspace list) visual parity verified
- [ ] Workspace pages visual parity verified
- [ ] All modals and dialogs use correct styling
- [ ] All interactive states (hover, focus, active) match source
- [ ] No styling regressions in existing features
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: The sidebar must be visually identical to the source project (240px/64px widths, colors, typography)
- FR-2: The Entries logo must display in the sidebar header with proper sizing (h-6 w-6)
- FR-3: All CSS variables must use the exact values from the source project's design tokens
- FR-4: Navigation items must have proper hover (`bg-sidebar-accent/50`) and active (`bg-sidebar-accent`) states
- FR-5: The breadcrumb bar must match source styling (h-12, border-b, bg-background)
- FR-6: Button and badge components must include all variants from the source project
- FR-7: The logo.dev token must be stored as an environment variable, not hardcoded
- FR-8: All existing functionality must continue to work after the migration

## Non-Goals

- No changes to routing or page structure
- No changes to authentication flow
- No migration of Zustand state management (keep current Next.js patterns)
- No changes to API or data layer
- No changes to the actual navigation items/structure (only styling)
- No light mode implementation (source project is dark mode only)
- No migration of search modal (Cmd+K) implementation

## Design Considerations

### Source Files to Reference
- `/Users/abtinemonavvari/Projects/entries-mvp-cc/src/components/layout/AppShell.tsx` - Main sidebar/layout
- `/Users/abtinemonavvari/Projects/entries-mvp-cc/src/index.css` - CSS variables and design tokens
- `/Users/abtinemonavvari/Projects/entries-mvp-cc/tailwind.config.js` - Tailwind theme configuration
- `/Users/abtinemonavvari/Projects/entries-mvp-cc/src/assets/Entries Icon Blue Background.png` - Logo asset

### Key CSS Variables to Migrate
```css
/* Sidebar Colors */
--sidebar-background: 220 7% 12%;
--sidebar-foreground: oklch(0.65 0 0);
--sidebar-accent: oklch(0.269 0 0);
--sidebar-accent-foreground: oklch(0.985 0 0);
--sidebar-border: oklch(0.922 0 0 / 10%);

/* Semantic Colors */
--success: hsl(166 37% 49%);
--warning: hsl(31 100% 63%);
--error: hsl(6 100% 71%);
--info: hsl(204 55% 56%);
```

### Component Reuse
- Keep existing shadcn/ui components, only update their variant styling
- Keep existing layout component structure, update CSS classes

## Technical Considerations

- Both projects use Tailwind CSS 4.x with similar configuration
- Source uses React Router; target uses Next.js App Router (no impact on styling)
- Source uses Vite; target uses Next.js (no impact on CSS)
- Both projects use the same UI component library (shadcn/ui)
- logo.dev is already configured in `next.config.ts` for remote images

### Migration Order
1. First migrate CSS variables (foundation)
2. Then update components (buttons, badges, inputs)
3. Then update layout components (sidebar, breadcrumb)
4. Finally migrate assets and branding

## Success Metrics

- Visual parity: Side-by-side comparison shows identical styling
- No functional regressions: All existing features work as before
- Typecheck passes: No TypeScript errors introduced
- Build succeeds: `npm run build` completes without errors

## Open Questions

- Should the search modal (Cmd+K) keyboard shortcut be implemented as part of this migration or in a separate story?
- Should the favicon be updated to match Entries branding?
- Are there any additional pages in the source project that should inform this styling migration?
