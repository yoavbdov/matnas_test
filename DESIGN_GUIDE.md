# Chess Nimbus — Design Guide

**Goal:** A professional dashboard that feels sharp, slightly futuristic, and enjoyable to use — without being flashy.  
**Stack:** Next.js + shadcn/ui + Tailwind CSS v4. Full RTL (Hebrew), light/dark theme toggle.

---

## 1. Color System

### Primary accent: Blue

All interactive elements use blue as the primary color. Update `globals.css`:

```css
:root {
  --primary: oklch(0.452 0.197 255.585);       /* Tailwind blue-600 */
  --primary-foreground: oklch(0.985 0 0);
  --ring: oklch(0.452 0.197 255.585);
}
.dark {
  --primary: oklch(0.623 0.214 259.815);       /* Tailwind blue-400 */
  --primary-foreground: oklch(0.145 0 0);
  --ring: oklch(0.623 0.214 259.815);
}
```

Everything else (background, card, border, muted, destructive) stays at the shadcn defaults — they already work well with blue.

### Status accent colors (icon backgrounds + badge tints)

| Role | Background | Text | Border |
|---|---|---|---|
| Success | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` |
| Warning | `bg-amber-50` | `text-amber-700` | `border-amber-200` |
| Error | `bg-red-50` | `text-red-700` | `border-red-200` |
| Info / primary | `bg-blue-50` | `text-blue-700` | `border-blue-200` |

Dark mode variants: use `/10` opacity on the background (e.g. `bg-emerald-500/10`).

---

## 2. Typography

```
Page title:       text-xl font-semibold text-foreground
Section header:   text-sm font-semibold text-muted-foreground uppercase tracking-wide
Stat value:       text-2xl font-bold font-mono tabular-nums text-foreground
Table header:     text-xs font-medium uppercase tracking-wide text-muted-foreground
Table cell:       text-sm text-foreground
Secondary info:   text-sm text-muted-foreground
Caption / hint:   text-xs text-muted-foreground
Numbers & IDs:    font-mono tabular-nums (ratings, counts, phone, dates)
```

**`font-mono tabular-nums` is the main "futuristic" touch.** Numbers that lock into columns, not float around.

---

## 3. Spacing & Layout

- Card padding: `p-5` or `p-6`
- Grid gap between cards: `gap-4` or `gap-5`
- Vertical section spacing: `space-y-6`
- Table cell: `px-4 py-3`
- Form field stack: `space-y-4` inside modals
- Page content: `px-6 py-6` via `PageShell`, capped at `max-w-screen-xl mx-auto`

---

## 4. RTL — Set Once, Use Logical Properties Everywhere

`dir="rtl"` is set on `<html>` in `layout.tsx`. **Never add it again on individual containers.**  
Text alignment, flex direction, and scroll direction all inherit automatically.

### Use Tailwind logical property utilities

Instead of physical (left/right) utilities, use directional-neutral ones:

| Physical (avoid) | Logical (use) |
|---|---|
| `ml-` / `mr-` | `ms-` / `me-` |
| `pl-` / `pr-` | `ps-` / `pe-` |
| `left-` / `right-` | `start-` / `end-` |
| `border-l-` / `border-r-` | `border-s-` / `border-e-` |
| `rounded-l-` / `rounded-r-` | `rounded-s-` / `rounded-e-` |
| `text-left` / `text-right` | `text-start` / `text-end` |

Example — stat card accent stripe:
```tsx
// Right side in RTL, left side in LTR — automatically correct
<div className="border-s-4 border-blue-500 rounded-xl ...">
```

### Directional icons
Arrows and chevrons point the wrong way in RTL. Flip them with the `rtl:` variant:
```tsx
<ChevronRight className="rtl:rotate-180 transition-transform" />
<ArrowLeft className="rtl:rotate-180" />
```

Icons that are not directional (Trophy, Users, Calendar) need nothing.

---

## 5. Component Patterns

### Sidebar
```
bg-slate-900  (stable dark anchor — never use bg-background here)
Active item:  bg-blue-600 text-white rounded-lg
Inactive:     text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors duration-150
Item:         px-3 py-2.5 flex items-center gap-3 text-sm
Logo area:    px-4 py-5 border-b border-slate-700/60
Logout:       border-t border-slate-700/60 at bottom
```

### StatCard
```
bg-card border border-border rounded-xl p-5
Left-edge accent:  border-s-4 (blue / emerald / amber / red per semantic meaning)
Icon container:    p-2.5 rounded-lg bg-blue-50 text-blue-600
Value:             text-2xl font-bold font-mono tabular-nums
Label:             text-sm text-muted-foreground
Clickable:         cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors duration-200
```

No shadow on cards. The `border-s-4` stripe + border is enough definition.

### Table
```
Wrapper:      bg-card border border-border rounded-xl overflow-hidden
Header row:   bg-muted/40
Header cell:  px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground text-start
Data row:     divide-y divide-border, hover:bg-muted/30 transition-colors duration-100 (if clickable)
Data cell:    px-4 py-3 text-sm
Empty state:  p-12 text-center text-sm text-muted-foreground
```

No alternating zebra rows.

### Buttons (Btn.tsx)

| Variant | shadcn | Notes |
|---|---|---|
| `primary` | `default` | Blue fill. One per toolbar/footer. |
| `secondary` | `outline` | Neutral border. Secondary actions. |
| `danger` | `destructive` | Red. Destructive actions only. |
| `ghost` | `ghost` | Low-emphasis. Icon buttons, utility links. |

### Badges
```
Shape:    rounded-full px-2.5 py-0.5 text-xs font-medium
Colors:   see Section 1 status color table + border
```

### Inputs & Fields
```
Border:   border border-input rounded-lg h-9
Focus:    ring-2 ring-blue-500/25 ring-offset-0  (soft glow, not a thick bar)
Disabled: opacity-50 cursor-not-allowed
RTL:      text-start (inherits from dir="rtl", no manual text-right needed)
```

### Modal
```
Overlay:  bg-black/40 backdrop-blur-sm
Panel:    bg-card border border-border rounded-2xl shadow-lg p-6 max-w-lg w-full
Title:    text-lg font-semibold mb-4
Footer:   flex justify-start gap-2  (start = right in RTL)
```

Max shadow on a modal: `shadow-lg`. Never `shadow-2xl`.

---

## 6. Animation System

**Rule:** Motion communicates state. If removing an animation doesn't confuse a user, remove it.

### Page / section entrance

Wrap the page's main content block once — not individual cards:

```tsx
// In each page.tsx or section component, wrap the output in:
<div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
  {/* cards, tables, etc. */}
</div>
```

The `tw-animate.css` utilities (`animate-in`, `fade-in-0`, `slide-in-from-bottom-2`) are already imported in `globals.css`.

### Micro-interactions (hover / active)

```
Clickable card:    hover:border-blue-300 dark:hover:border-blue-700 transition-colors duration-200
Table row:         hover:bg-muted/30 transition-colors duration-100
Button press:      active:scale-[0.98] transition-transform duration-75
Nav item:          transition-colors duration-150
Icon button:       hover:text-foreground transition-colors duration-150
Input focus:       ring-2 ring-blue-500/25 (handled by focus-visible in globals)
```

### What never animates

- Layout / size changes (`height`, `width`, `max-height`)
- Static text or labels
- The sidebar
- Anything that flashes or pulses unless it's a loading skeleton

---

## 7. DO / DON'T

| DO | DON'T |
|---|---|
| `border-s-4` for directional borders | `border-l-4` / `border-r-4` |
| `ms-` / `ps-` / `start-` utilities | `ml-` / `pl-` / `left-` utilities |
| `rtl:rotate-180` for directional icons | Manually swapping icon components per locale |
| `font-mono tabular-nums` for every number | Bold + colored numbers without mono |
| Semantic tokens (`bg-card`, `text-muted-foreground`) | Hardcoded colors (`bg-white`, `text-gray-600`) |
| `shadow-lg` max on modals, no shadow on cards | `shadow-xl`, `shadow-2xl` anywhere |
| `hover:bg-muted/30` on rows | `hover:scale-105` on rows or cards |
| `animate-in fade-in-0 slide-in-from-bottom-2` on content containers | Per-card or per-row entrance animations |
| One filled (primary) button per action group | Two filled buttons side by side |

---

## 8. Responsiveness

### Target device tiers

This is a management dashboard — the primary user is sitting at a desk. Design for desktop first, then make sure tablet works. Mobile is a graceful fallback, not a target.

| Breakpoint | Width | Expectation |
|---|---|---|
| Mobile `< sm` | `< 640px` | Usable but not optimized — sidebar hidden, content scrollable |
| Tablet `sm–lg` | `640–1023px` | Sidebar collapses, content reflows to 1–2 columns |
| Desktop `lg+` | `≥ 1024px` | Full layout — primary target |

### Sidebar behavior

```
lg+:   always visible (w-56, fixed left/right)
< lg:  hidden by default, opened via a hamburger button in the TopBar
       use a sheet/drawer (shadcn Sheet) sliding in from the start edge
```

The main content area uses `lg:ms-56` to offset for the sidebar on desktop. On mobile it takes full width.

### Grid layouts

Always start at 1 column and step up:

```tsx
// Stat cards
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// Two-column form or panel split
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">

// Three-column content (rare)
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
```

### Tables on small screens

Don't reflow tables into card lists — it's complex and rarely worth it for a management tool. Instead, wrap in a horizontal scroll container:

```tsx
<div className="overflow-x-auto rounded-xl border border-border">
  <table className="min-w-[600px] w-full">...</table>
</div>
```

The `min-w-[600px]` keeps the table readable on small screens while allowing it to scroll.

### Modals on small screens

Modals should go full-screen on mobile:

```tsx
// Panel class:
"fixed inset-0 sm:inset-auto sm:relative sm:max-w-lg sm:rounded-2xl rounded-none"
```

Or use shadcn's `Dialog` + a `DrawerDialog` pattern (Drawer on mobile, Dialog on desktop).

### Typography scaling

```
Page title:   text-lg sm:text-xl
Stat value:   text-xl sm:text-2xl
```

Only scale things that genuinely need more space. Most text sizes don't need to change.

### What NOT to do

- Don't hide important content on mobile with `hidden sm:block` unless it's truly secondary
- Don't use fixed pixel widths on any container — always `w-full max-w-[...]`
- Don't assume touch — hover states are fine, but don't rely on them for visibility of critical actions
- Don't add mobile-only components just to handle a layout shift — simplify the desktop layout instead

---

## 9. Coding Structure Guidelines

These rules exist so any developer can understand a file in 30 seconds, and adding a new feature never requires touching unrelated files.

### File size limits

- **Hard limit: 200 lines.** Start splitting at ~150.
- Split by responsibility, not just by line count — ask "what does this piece do?" before extracting.

### page.tsx is a composer, not a component

`page.tsx` should only:
1. Read from context / receive server props
2. Derive any needed state (one or two `useState` calls max)
3. Compose named section components
4. Render the page layout

It should read like a table of contents. Target: **under 60 lines**.

```tsx
// Good — page.tsx is a coordinator
export default function StudentsPage() {
  const { students } = useData();
  const [selected, setSelected] = useState<Student | null>(null);

  return (
    <PageShell title="שחקנים">
      <StudentsToolbar />
      <StudentsTable students={students} onSelect={setSelected} />
      {selected && <StudentDetailModal student={selected} onClose={() => setSelected(null)} />}
    </PageShell>
  );
}
```

### One component, one job

If you need the word "and" to describe what a component does — split it.

- `ClassFormModal` → handles form inputs and submission ✓
- `ClassFormModal` → handles form inputs, shows enrolled students, and has a CSV importer ✗  
  → split into `ClassFormModal`, `ClassEnrollmentPanel`, `ClassCsvImporter`

### Component location rules

| Type | Location | Rule |
|---|---|---|
| Atoms / shared primitives | `components/shared/` | Zero domain knowledge — no "student" or "class" in the logic |
| Domain-specific | `components/students/`, `components/classes/`, etc. | Used by one domain only |
| Layout chrome | `components/layout/` | Sidebar, TopBar, PageShell |

Before creating a new component, check `shared/` first. If something close exists, extend it with a prop — don't duplicate.

### Reuse checklist

Before building a new component, ask:
1. Does `shared/` have something that covers 80% of this?
2. Can an existing component accept a new optional prop instead?
3. Is this pattern used in ≥2 places? → `shared/`. Used in 1 place? → domain folder.

Duplication is fine when the two cases are likely to diverge. Abstraction is wrong when it adds a prop for every exception.

### State & data flow

- Data flows **down as props**, events flow **up as callbacks**
- If you find yourself passing props through 3+ levels → use a context or co-locate state closer to the usage
- No Firebase calls inside components — use hooks from `firebase/hooks/` or the `DataContext`
- No formatting or validation logic inside components — use `lib/utils.ts` and `lib/validators.ts`

### Naming conventions

```
Pages:          StudentsPage, ClassesPage (noun + "Page")
Modals:         StudentDetailModal, ClassFormModal (noun + action + "Modal")
Panels:         ClassEnrollmentPanel (sub-section within a page/modal)
Tables:         StudentsTable, ClassesTable
Toolbars:       StudentsToolbar, ClassesToolbar
Shared atoms:   Btn, Modal, Table, Badge, Field, StatCard (short, generic)
```

### Comments: only when the WHY is non-obvious

```tsx
// Good — explains a non-obvious constraint
// formatPhone() must run before every write — storage format is always "053-XXXXXXX"
const phone = formatPhone(formData.phone);

// Bad — explains the what, which the code already says
// Set the phone field
const phone = formData.phone;
```

Hebrew inline comments are fine for labeling sections in larger files.
