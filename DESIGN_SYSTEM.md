# Entries Design System

> Design guidelines for building Entries. Follow Notion's UX/UI patterns closely.
> Dark mode only. Uncompromising attention to detail.

---

## Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Components | [shadcn/ui](https://ui.shadcn.com) | Copy-paste components, full ownership |
| Primitives | [Radix UI](https://radix-ui.com) | Accessible, unstyled foundations |
| Styling | [Tailwind CSS](https://tailwindcss.com) | Utility-first, design tokens via CSS variables |
| Icons | [Lucide React](https://lucide.dev) | Clean, consistent, tree-shakable |
| Fonts | Google Fonts | Inter Tight (all text) |

### Installation

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Install core components
npx shadcn-ui@latest add button input dialog dropdown-menu table checkbox
npx shadcn-ui@latest add popover command select tooltip skeleton alert
```

---

## Colors

All colors use CSS custom properties for consistency.

### Core Palette (Notion Dark Mode)

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--background` | 220 7% 12% | `#191919` | Main background |
| `--background-secondary` | 220 7% 15% | `#1E1E1E` | Sidebar, cards |
| `--background-tertiary` | 220 7% 18% | `#252525` | Hover states, elevated surfaces |
| `--foreground` | 0 0% 100% | `#FFFFFF` (90% opacity) | Primary text |
| `--foreground-muted` | 220 5% 65% | `#9B9B9B` | Secondary text, placeholders |
| `--border` | 220 5% 20% | `#2E2E2E` | Borders, dividers |

### Accent Colors

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--primary` | 214 99% 50% | `#0166FF` | Entries blue — buttons, links, focus |
| `--primary-hover` | 214 99% 45% | `#0058E0` | Button hover |
| `--primary-muted` | 214 50% 25% | `#1E3A5F` | Selected backgrounds |

### Semantic Colors

| Token | Text Hex | Background Hex | Usage |
|-------|----------|----------------|-------|
| `--success` | `#4DAB9A` | `#1A3332` | Matched, synced, approved |
| `--warning` | `#FFA344` | `#3D2E1F` | Pending review, anomalies |
| `--error` | `#FF7369` | `#3D2020` | Errors, rejected, duplicates |
| `--info` | `#529CCA` | `#1E2D3D` | Information, timing differences |

### Tag Colors (Notion-derived)

| Name | Text | Background | Usage |
|------|------|------------|-------|
| Gray | `#979A9B` | `#373737` | Default tags |
| Brown | `#937264` | `#3D3535` | — |
| Orange | `#FFA344` | `#3D2E1F` | Warnings |
| Yellow | `#FFDC49` | `#3D3A25` | Pending |
| Green | `#4DAB9A` | `#1A3332` | Success |
| Blue | `#529CCA` | `#1E2D3D` | Info |
| Purple | `#9A6DD7` | `#2D2840` | — |
| Pink | `#E255A1` | `#3D2535` | — |
| Red | `#FF7369` | `#3D2020` | Errors |

---

## Typography

### Font Family

**Inter Tight** is used throughout the application for all text — headings and body.

```css
:root {
  --font-sans: 'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
}
```

### Next.js Font Setup

```tsx
import { Inter_Tight } from "next/font/google";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter-tight",
  display: "swap",
});

// In html tag:
<html className={interTight.variable}>
```

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `h1` | 40px / 2.5rem | 600 (Semibold) | 1.2 | Page titles |
| `h2` | 30px / 1.875rem | 600 (Semibold) | 1.25 | Section headers |
| `h3` | 24px / 1.5rem | 500 (Medium) | 1.3 | Subsections |
| `h4` | 18px / 1.125rem | 500 (Medium) | 1.4 | Card titles |
| `body` | 16px / 1rem | 400 | 1.6 | Default text |
| `body-sm` | 14px / 0.875rem | 400 | 1.5 | Secondary text, UI labels |
| `caption` | 12px / 0.75rem | 500 | 1.4 | Metadata, timestamps |
| `overline` | 11px / 0.6875rem | 600 | 1.3 | Section labels, ALL CAPS |

### CSS Implementation

```css
@layer base {
  body {
    font-family: var(--font-sans);
  }

  h1 {
    @apply text-[2.5rem] leading-[1.2] font-semibold tracking-tight;
  }

  h2 {
    @apply text-[1.875rem] leading-[1.25] font-semibold tracking-tight;
  }

  h3 {
    @apply text-[1.5rem] leading-[1.3] font-medium;
  }

  h4 {
    @apply text-[1.125rem] leading-[1.4] font-medium;
  }
}
```

---

## Spacing

8px base grid. Use Tailwind's default scale.

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0 | — |
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Icon gaps, inline spacing |
| `space-3` | 12px | Small padding |
| `space-4` | 16px | Default padding |
| `space-5` | 20px | — |
| `space-6` | 24px | Card padding |
| `space-8` | 32px | Section gaps |
| `space-10` | 40px | Large gaps |
| `space-12` | 48px | Page sections |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Small buttons, tags |
| `radius` | 6px | Default — buttons, inputs, cards |
| `radius-md` | 8px | Modals, dropdowns |
| `radius-lg` | 12px | Large cards |
| `radius-full` | 9999px | Avatars, pills |

---

## Shadows

Minimal shadows — Notion prefers borders.

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.2)` | Subtle elevation |
| `shadow` | `0 2px 8px rgba(0,0,0,0.25)` | Dropdowns, popovers |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,0.3)` | Modals |

**Prefer borders over shadows.** Use `border border-border` for most elevation needs.

---

## Navigation Components

### Sidebar

The sidebar is the primary navigation element, providing access to all pages within the application.

**Dimensions:**
- Width: 240px (expanded), 64px (collapsed)
- Header height: 56px
- Item height: 36px

**Structure:**

```tsx
import { Sidebar } from '@/components/layout'

<Sidebar
  workspaces={workspaces}  // Array of { id, name }
  collapsed={false}
  onToggleCollapse={() => {}}
  onSearchClick={() => {}}  // Opens the search modal
/>
```

**Sidebar Sections:**

The sidebar is divided into two groups with consistent `mb-6` (24px) spacing between them:

1. **Top Group** (single container with `gap-1` internal spacing):
   - **Logo** — App branding with link to home
   - **Home** — Navigate to home page
   - **Search** — Opens the search modal (button, not a link)
   - **Workspace Switcher** — Searchable dropdown for client selection

2. **Workspace Nav Sections** (each separated by `mb-6`):
   - **Data** — Event Feed, Data Connectors, Docs
   - **Productivity** — Entries AI, Reconcile, Categorize
   - **Knowledge** — Rules

3. **Collapse Button** — Always pinned to bottom via flex spacer

**Navigation Item States:**

```tsx
// Default
className="text-muted-foreground hover:bg-[hsl(220,7%,18%)] hover:text-foreground"

// Active
className="bg-[hsl(220,7%,18%)] text-foreground"
```

**Section Labels:**

```tsx
// Sentence case section headers (not uppercase)
className="text-xs tracking-wider text-sidebar-foreground/70"
```

**Section Spacing:**
- Sections use `mb-6` (24px) between groups for generous visual breathing room

**Collapse Button:**
- Always pinned to the bottom of the sidebar via flex layout
- When no workspace is selected (home screen), an empty `flex-1` spacer fills remaining space to push the collapse button down

### Workspace Switcher

Dropdown for switching between client workspaces.

```tsx
<Popover>
  <PopoverTrigger>
    <Button variant="ghost" className="w-full justify-between">
      {currentWorkspace.name}
      <ChevronDown />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-64 p-0" align="start" side="right">
    <Input placeholder="Search clients..." />
    {/* Workspace list */}
    {/* Add Client button */}
  </PopoverContent>
</Popover>
```

**Selected State:**

```tsx
// Highlighted workspace in list
className="bg-[hsl(214,50%,25%)]"  // Primary muted blue
```

### Search Modal

Notion-style command palette for navigating to any page across all workspaces. Uses `Dialog` + `Command` (cmdk).

```tsx
import { SearchModal } from '@/components/layout'

<SearchModal
  open={searchOpen}
  onOpenChange={setSearchOpen}
  workspaces={workspaces}  // Array of { id, name }
/>
```

**Keyboard Shortcut:** `Cmd+K` (Mac) / `Ctrl+K` (Windows) — registered globally via `useEffect`

**Result Structure:**
- **General** group: Home
- **Per-workspace** groups (one `CommandGroup` per workspace, labeled by workspace name):
  - Event Feed, Data Connectors, Docs, Entries AI, Reconcile, Categorize, Rules

**Behavior:**
- cmdk handles fuzzy filtering automatically as the user types
- Selecting a result calls `router.push(href)` and closes the modal
- Escape key or clicking outside dismisses the modal
- No close button — clean, minimal chrome

**Styling:**

```tsx
// Dialog positioned slightly above center
<DialogContent className="p-0 gap-0 sm:max-w-xl top-[40%]" showCloseButton={false}>
  <Command className="rounded-lg">
    <CommandInput placeholder="Search pages..." />
    <CommandList className="max-h-[360px]">
      {/* ... */}
    </CommandList>
  </Command>
</DialogContent>
```

**Integration:**
- Mounted in `AppShell` so it's globally accessible
- Sidebar "Search" item is a `<button>` that calls `onSearchClick` (not a `<Link>`)

### Breadcrumb

Context-aware breadcrumb trail at top of each page.

```tsx
import { Breadcrumb } from '@/components/layout'

<Breadcrumb
  items={[
    { label: 'Writeoff', href: '/' },
    { label: 'Acme Corporation', href: '/workspace/123/event-feed' },
    { label: 'Event Feed' },  // No href = current page
  ]}
/>
```

**Styling:**

```tsx
// Link item
className="text-muted-foreground hover:text-foreground"

// Current item (last, no href)
className="text-foreground font-medium"

// Separator
<ChevronRight className="h-4 w-4 text-muted-foreground" />
```

### Page Header

Consistent header component with breadcrumb and optional actions.

```tsx
import { PageHeader } from '@/components/layout'

<PageHeader
  breadcrumbs={[
    { label: 'Writeoff', href: '/' },
    { label: workspace.name, href: `/workspace/${id}/event-feed` },
    { label: 'Rules' },
  ]}
  actions={<Button>Create Rule</Button>}
/>
```

**Dimensions:**
- Height: 56px
- Padding: 24px horizontal

### App Shell

The main layout wrapper that combines sidebar and main content area.

```tsx
import { AppShell } from '@/components/layout'

<AppShell workspaces={workspaces}>
  {children}
</AppShell>
```

**Structure:**

```tsx
<div className="flex h-screen overflow-hidden bg-background">
  <Sidebar />
  <main className="flex-1 overflow-auto">
    {children}
  </main>
  <SearchModal />  {/* Global search modal (Cmd+K) */}
</div>
```

---

## Component Specifications

### Buttons

```tsx
// Primary
<Button>Approve</Button>
// → bg-primary text-white hover:bg-primary-hover

// Secondary
<Button variant="secondary">Cancel</Button>
// → bg-secondary text-foreground hover:bg-secondary/80

// Ghost
<Button variant="ghost">Edit</Button>
// → bg-transparent hover:bg-muted

// Destructive
<Button variant="destructive">Delete</Button>
// → bg-destructive text-white hover:bg-destructive/90

// Sizes
<Button size="sm">Small</Button>  // h-8 px-3 text-sm
<Button size="default">Default</Button>  // h-10 px-4
<Button size="lg">Large</Button>  // h-12 px-6 text-lg
```

### Inputs

```tsx
<Input placeholder="Search transactions..." />
// → h-10 px-3 bg-background border border-border rounded-md
// → focus:ring-2 focus:ring-primary focus:border-transparent
```

### Tables

```tsx
<Table>
  <TableHeader>
    <TableRow className="bg-muted/50 border-b border-border">
      <TableHead>Date</TableHead>
      <TableHead>Description</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="hover:bg-muted/30 transition-colors">
      <TableCell>Jan 15, 2024</TableCell>
      <TableCell>STRIPE TRANSFER</TableCell>
      <TableCell className="text-right font-mono">$4,970.00</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Status Badges

```tsx
// Pending
<Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
  Pending Review
</Badge>

// Approved
<Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
  Approved
</Badge>

// Synced
<Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
  Synced
</Badge>

// Error
<Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
  Error
</Badge>
```

### Confidence Indicators

```tsx
// High (90%+)
<div className="flex items-center gap-2">
  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
    <div className="h-full bg-green-500 rounded-full" style={{ width: '95%' }} />
  </div>
  <span className="text-xs text-muted-foreground">95%</span>
</div>

// Medium (70-89%)
<div className="h-full bg-yellow-500 rounded-full" style={{ width: '78%' }} />

// Low (<70%)
<div className="h-full bg-red-500 rounded-full" style={{ width: '45%' }} />
```

---

## Interaction Patterns

### Hover Reveals Actions

```tsx
// Row with hidden actions
<TableRow className="group">
  <TableCell>{/* content */}</TableCell>
  <TableCell>
    {/* Hidden until hover */}
    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
      <Button variant="ghost" size="sm">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  </TableCell>
</TableRow>
```

### Focus States

```tsx
// All focusable elements
focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
```

### Transitions

```tsx
// Default transition
transition-colors duration-150

// Opacity
transition-opacity duration-150

// All
transition-all duration-200
```

---

## Layout Patterns

### App Shell (Sidebar + Main Content)

```tsx
<div className="flex h-screen overflow-hidden bg-background">
  {/* Sidebar */}
  <aside className="w-60 bg-[hsl(220,7%,15%)] flex flex-col">
    {/* Logo */}
    <div className="h-14 flex items-center px-4">
      <Logo />
    </div>
    {/* Navigation (when workspace selected) */}
    <nav className="flex-1 p-2 overflow-auto">
      {/* Nav sections with mb-6 spacing */}
    </nav>
    {/* OR spacer (when no workspace selected) */}
    <div className="flex-1" />
    {/* Collapse — always pinned to bottom */}
    <div className="p-2">
      <CollapseButton />
    </div>
  </aside>

  {/* Main */}
  <main className="flex-1 overflow-auto">
    {/* Page Header with Breadcrumb */}
    <PageHeader />
    {/* Page Content */}
    <div className="p-6">
      {/* Content */}
    </div>
  </main>
</div>
```

### Page Layout

```tsx
<div className="flex flex-col h-full">
  {/* Header with breadcrumb */}
  <PageHeader
    breadcrumbs={[...]}
    actions={<ActionButtons />}
  />
  {/* Scrollable content */}
  <div className="flex-1 p-6 overflow-auto">
    <div className="max-w-5xl">
      {/* Page content */}
    </div>
  </div>
</div>
```

### Split View (Reconciliation)

```tsx
<div className="flex h-full">
  {/* Left pane */}
  <div className="w-1/2 border-r border-border overflow-auto">
    {/* Bank transactions */}
  </div>

  {/* Right pane */}
  <div className="w-1/2 overflow-auto">
    {/* QBO transactions */}
  </div>
</div>
```

---

## CSS Variables (Complete)

Copy to `globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Backgrounds */
    --background: 220 7% 12%;
    --background-secondary: 220 7% 15%;
    --background-tertiary: 220 7% 18%;

    /* Foreground */
    --foreground: 0 0% 100%;
    --foreground-muted: 220 5% 65%;

    /* Card */
    --card: 220 7% 15%;
    --card-foreground: 0 0% 100%;

    /* Popover */
    --popover: 220 7% 15%;
    --popover-foreground: 0 0% 100%;

    /* Primary (Entries Blue) */
    --primary: 214 99% 50%;
    --primary-foreground: 0 0% 100%;

    /* Secondary */
    --secondary: 220 7% 18%;
    --secondary-foreground: 0 0% 100%;

    /* Muted */
    --muted: 220 7% 18%;
    --muted-foreground: 220 5% 65%;

    /* Accent */
    --accent: 220 7% 18%;
    --accent-foreground: 0 0% 100%;

    /* Destructive */
    --destructive: 5 100% 70%;
    --destructive-foreground: 0 0% 100%;

    /* Border & Input */
    --border: 220 5% 20%;
    --input: 220 5% 20%;
    --ring: 214 99% 50%;

    /* Radius */
    --radius: 6px;

    /* Sidebar */
    --sidebar-background: 220 7% 15%;
    --sidebar-foreground: 0 0% 100%;
    --sidebar-border: 220 5% 20%;
    --sidebar-accent: 220 7% 18%;
    --sidebar-accent-foreground: 0 0% 100%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-family: var(--font-sans);
  }
}
```

---

## Icons

Use Lucide React icons consistently:

```tsx
import {
  // Navigation
  Home,
  Search,
  Activity,
  Plug,
  FileText,
  Sparkles,
  GitCompare,
  Tags,
  BookOpen,
  Building2,
  PanelLeft,
  PanelLeftClose,

  // Actions
  Check,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Plus,
  Filter,
  Upload,
  Download,
  RefreshCw,
  Settings,
  Eye,

  // Status
  AlertTriangle,
  Info,
  Clock,

  // Data
  Link2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,

  // UI
  Loader2,
  Send,
  User,
  ArrowRight,
  HelpCircle,
  ExternalLink,
} from 'lucide-react'

// Standard sizes
<Icon className="h-4 w-4" />  // Small (in buttons, inline)
<Icon className="h-5 w-5" />  // Default
<Icon className="h-6 w-6" />  // Large
<Icon className="h-8 w-8" />  // Empty states
```

---

## Quick Reference

### Do's ✓

- Use generous whitespace
- Reveal actions on hover
- Use subtle borders over shadows
- Keep animations fast (100-150ms)
- Use muted colors for secondary elements
- Maintain high contrast for primary text
- Show confidence on all AI suggestions
- Make everything explainable

### Don'ts ✗

- Don't use pure black (`#000000`) — use warm dark grays
- Don't use pure white (`#FFFFFF`) for large text areas — use 90% opacity
- Don't add shadows to everything — prefer borders
- Don't use slow animations (>300ms for UI)
- Don't use rounded corners larger than 12px (except avatars/pills)
- Don't use more than 2 font weights per element
- Don't auto-commit to QuickBooks without explicit user action

---

## File Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── layout/       # Shell, sidebar, header, search
│   │   ├── sidebar.tsx
│   │   ├── search-modal.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── page-header.tsx
│   │   ├── app-shell.tsx
│   │   └── index.ts
│   └── [feature]/    # Feature-specific components
├── lib/
│   └── utils.ts      # cn() helper
├── styles/
│   └── globals.css   # CSS variables, base styles
└── app/
    ├── (authenticated)/
    │   ├── layout.tsx      # App shell with sidebar
    │   ├── page.tsx        # Home (client list)
    │   └── workspace/
    │       └── [id]/
    │           ├── layout.tsx
    │           ├── event-feed/
    │           ├── connectors/
    │           ├── docs/
    │           ├── ai/
    │           ├── reconcile/
    │           ├── categorize/
    │           └── rules/
    └── login/
```

---

## Home Page Components

### Greeting Banner

Lighthearted, accounting-themed greeting that cycles on each page load.

```tsx
const greetings = [
  "Time to make the numbers sing.",
  "Let's balance those books.",
  "Ready to reconcile?",
  // ... more greetings
]

<div className="text-center py-12">
  <h1 className="text-[2.5rem] leading-[1.2] font-semibold tracking-tight">
    {greeting}
  </h1>
</div>
```

### Client List Row

Row-based list (not cards) showing client name, notification badge, and connected app logos.

```tsx
<div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
  {/* Left: Name + badge */}
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium">{name}</span>
    {pendingCount > 0 && (
      <span className="min-w-[20px] h-5 px-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
        {pendingCount}
      </span>
    )}
  </div>

  {/* Right: Connected app logos */}
  <div className="flex items-center gap-1">
    {connectors.map((c) => (
      <ConnectorLogo connector={c} size="sm" />
    ))}
  </div>
</div>
```

### Recent Activity Feed

Master event feed combining events from all workspaces.

```tsx
<div className="grid grid-cols-[auto_120px_auto_1fr_auto] items-center gap-4 px-4 py-3">
  <SourceIcon source={source} />           {/* ConnectorLogo or Sparkles */}
  <span className="font-medium">{clientName}</span>
  <span className="text-muted-foreground">{eventType}</span>
  <span className="truncate">{description}</span>
  <span className="text-muted-foreground text-xs">{timestamp}</span>
</div>
```

### Section Headers

Use sentence case h3 for section labels on the home page.

```tsx
<h3 className="text-sm font-medium text-muted-foreground">
  Clients
</h3>
```

---

## Connector Logos

Use the `ConnectorLogo` component to display logos for connected applications.

```tsx
import { ConnectorLogo } from '@/components/ui/connector-logo'

<ConnectorLogo connector="quickbooks" size="sm" />  // 24px
<ConnectorLogo connector="xero" size="md" />        // 40px
<ConnectorLogo connector="stripe" size="lg" />      // 56px
```

**Supported Connectors:**
- quickbooks, xero, stripe, plaid, chase, bankofamerica
- wells_fargo, mercury, brex, ramp, gusto, adp

Logos are fetched from logo.dev. Falls back to colored initials badge on error.

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-22 | 1.0.0 | Initial design system |
| 2026-01-28 | 1.1.0 | Added sidebar navigation, breadcrumb, page header, workspace switcher, and app shell components. Updated file structure. |
| 2026-01-28 | 1.2.0 | Added home page components: greeting banner, client list row, recent activity feed, section headers, connector logos. |
| 2026-01-28 | 1.3.0 | Sidebar refinements: sentence case section labels (removed uppercase), increased section spacing (mb-4 → mb-6), collapse button always pinned to bottom. |
| 2026-01-28 | 1.3.1 | Grouped Logo, Home, Search, and Workspace Switcher into a single top container with even internal spacing (gap-1). Consistent mb-6 spacing between top group and workspace nav sections. |
| 2026-01-28 | 1.3.2 | Removed all separator borders from sidebar (right border on aside, top border on collapse button). Sidebar now uses background color contrast alone for visual separation. |
| 2026-01-28 | 1.4.0 | Added search modal component (Cmd+K command palette). Search sidebar item is now a button that opens the modal. Updated home page section headers from overline/uppercase h2 to sentence case h3. |
