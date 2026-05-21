# Agent Prompt — Rebuild `/dashboard` Module

## Your role

You are a senior frontend developer rebuilding the `/dashboard` page of **Chess Nimbus** — a Hebrew-language, RTL dashboard for managing a chess school. You are rewriting the dashboard module from scratch: the page file and every component it owns. You must follow the project's design guide and coding structure rules exactly.

Before touching any code, read these two files in full:
- `DESIGN_GUIDE.md` — visual rules, color tokens, animation spec, RTL rules, coding structure guidelines
- `CLAUDE.md` — project conventions, validation rules, file-size limits, component rules

---

## What the dashboard is

The dashboard is the first page a user sees after login. It is a **read-only summary** of the chess school's current state. No data is created or deleted here. Its job is to answer: "What is happening right now, and how is the school doing overall?"

It has four sections, always in this order:

1. **KPI stat cards** — four numbers at a glance
2. **Rating distribution** — how students are spread across skill ranges (editable by admin)
3. **Today's sessions** — everything scheduled for today across all types
4. **Enrollment status** — which classes are filling up

---

## File structure to produce

```
src/app/dashboard/page.tsx                        ← composer only, < 60 lines
src/components/dashboard/DashboardStatCards.tsx   ← the 4 KPI cards
src/components/dashboard/RatingDistribution.tsx   ← rating buckets + edit mode
src/components/dashboard/RatingBucketEditCard.tsx ← single bucket in edit mode (split from RatingDistribution)
src/components/dashboard/TodaySessionsTable.tsx   ← unified table of today's events
src/components/dashboard/TodaySessionTypeBadge.tsx← colored badge (חוג / תחרות / אירוע)
src/components/dashboard/EnrollmentStatusList.tsx ← progress bars per active class
src/components/shared/StatCard.tsx                ← updated to match design guide
```

Do not create any other files. Do not touch any file outside this list.

---

## Data sources

All data comes from two hooks. Do not add Firebase calls directly into components.

```ts
const { students, classes, enrollments, tournaments, events, loading, error } = useData();
// from: @/context/DataContext

const { buckets: bucketConfigs, saveBuckets } = useRatingThresholds();
// from: @/firebase/hooks/useRatingThresholds
```

`useRatingThresholds` returns `bucketConfigs: RatingBucketConfig[]` where each config is:
```ts
{ label: string; min: number | null; max: number | null }
// min: null = no lower bound. max: null = no upper bound.
```
`saveBuckets(configs)` writes back to Firestore and returns a Promise.

Helper functions you will need:
- `slotOccursOnDate(slot, dateStr)` from `@/lib/schedule/scheduleHelpers`
- `eventOccursOnDate(event, dateStr)` from `@/lib/conflicts/eventHelpers`

---

## Section 1 — page.tsx

The page file is a **composer only**. All computation happens inside the components or in `useMemo` within the page. The page file must stay under 60 lines.

### Computed values (derive in page.tsx, pass down as props)

```ts
const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

const activeStudents = students.filter(s => s.status === "פעיל");
const activeClasses  = classes.filter(c  => c.status === "פעיל");

// Count distinct class slots that occur today
const todaySessionCount = activeClasses.reduce((n, cls) =>
  n + (cls.slots ?? []).filter(slot => slotOccursOnDate(slot, todayStr)).length, 0);

// Count tournaments scheduled today (see TodaySessionsTable spec for the exact logic)
const todayTournamentCount = tournaments.filter(t => {
  if (t.status === "בוטל") return false;
  if (t.is_recurring) return t.recurring_date === todayStr;
  return t.rounds.some(r => r.date === todayStr);
}).length;

// Students registered this calendar month
const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
const newThisMonth = students.filter(s => (s.created_at ?? "") >= monthStart).length;
```

### Loading state

While `loading === true`, render a centered spinner. Use:
```tsx
<div className="flex h-screen items-center justify-center">
  <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
</div>
```
No text needed. Do not show partial data.

### Error state

While `error` is set, render a centered error message:
```tsx
<div className="flex h-screen items-center justify-center">
  <p className="text-sm text-destructive text-center">{error}</p>
</div>
```

### Page layout

```tsx
<PageShell title="לוח בקרה">
  <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
    <DashboardStatCards ... />
    <RatingDistribution ... />
    <TodaySessionsTable />
    <EnrollmentStatusList />
  </div>
</PageShell>
```

The entrance animation wraps the whole content block once — not each section individually.

---

## Section 2 — StatCard (shared component update)

File: `src/components/shared/StatCard.tsx`

The current component uses a hardcoded `colorMap` with `teal/indigo/orange/red`. Replace with a design-guide-compliant version.

### Props interface (keep identical — other pages use this component)
```ts
interface StatCardProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  sub?: string;
  onClick?: () => void;
  color?: "blue" | "emerald" | "amber" | "red";
}
```
`"teal"` is renamed to `"emerald"`, `"indigo"` to `"blue"`. Update all callers in `DashboardStatCards.tsx` to use the new names. Do not update callers in other pages.

### Visual spec
```
Outer:            bg-card border border-border rounded-xl p-5
Start accent:     border-s-4 (blue=border-blue-500, emerald=border-emerald-500, amber=border-amber-500, red=border-red-500)
Icon container:   p-2.5 rounded-lg  (blue=bg-blue-50 text-blue-600, etc.)
Value:            text-2xl font-bold font-mono tabular-nums text-foreground
Label:            text-sm text-muted-foreground
Sub:              text-xs text-muted-foreground mt-0.5
Clickable hover:  hover:border-blue-300 dark:hover:border-blue-700 transition-colors duration-200
No shadow.
```

### DashboardStatCards.tsx — the 4 cards

| Card | Icon | Value | Label | Sub | Color | onClick |
|---|---|---|---|---|---|---|
| 1 | `Users` | `activeStudents.length` | `"שחקנים פעילים"` | `"X חדשים החודש"` (only if > 0) | `"blue"` | `router.push("/students?status=active")` |
| 2 | `BookOpen` | `activeClasses.length` | `"חוגים פעילים"` | — | `"emerald"` | `router.push("/classes?status=active")` |
| 3 | `Clock` | `todaySessionCount` | `"חוגים היום"` | — | `"amber"` | `router.push("/classes?today=true")` |
| 4 | `Trophy` | `todayTournamentCount` | `"תחרויות היום"` | — | `"blue"` | `router.push("/tournaments?today=true")` |

Grid: `grid grid-cols-2 gap-4 lg:grid-cols-4`

---

## Section 3 — RatingDistribution

File: `src/components/dashboard/RatingDistribution.tsx`

### Props
```ts
interface Props {
  buckets: { label: string; count: number; onClick?: () => void }[];
  withRating: number;
  withoutRating: number;
  bucketConfigs: RatingBucketConfig[];
  onSaveBuckets: (configs: RatingBucketConfig[]) => Promise<void>;
}
```

The parent (page.tsx) builds `buckets` from `bucketConfigs + activeStudents`:
```ts
const ratingData = useMemo(() => {
  const withRating = activeStudents.filter(s => s.israeli_rating);
  const buckets = bucketConfigs.map(cfg => {
    const count = withRating.filter(s => {
      const r = s.israeli_rating ?? 0;
      return (cfg.min === null || r >= cfg.min) && (cfg.max === null || r <= cfg.max);
    }).length;
    const params = new URLSearchParams({ status: "active" });
    if (cfg.min !== null) params.set("minRating", String(cfg.min));
    if (cfg.max !== null) params.set("maxRating", String(cfg.max));
    return { label: cfg.label, count, onClick: () => router.push(`/students?${params}`) };
  });
  return { buckets, withRating: withRating.length, withoutRating: activeStudents.length - withRating.length };
}, [activeStudents, bucketConfigs, router]);
```

### Display mode (default)

```
Card wrapper:   bg-card border border-border rounded-xl p-5
Header row:     flex items-center justify-between mb-4
  - Left (start in RTL): text-xs text-muted-foreground — "X שחקנים עם דירוג ישראלי · Y ללא דירוג"
  - End: ghost pencil icon button (Pencil, size 14) → opens edit mode

Bucket grid:    grid grid-cols-2 gap-3 lg:grid-cols-4
Each bucket:    bg-muted/50 rounded-lg p-4 text-center cursor-pointer
                hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border hover:border-blue-200 transition-colors duration-150
  Value:        text-xl font-bold font-mono tabular-nums text-foreground
  Label:        text-xs text-muted-foreground mt-0.5
```

### Edit mode

When the pencil is clicked, switch to edit mode. Each bucket renders a `RatingBucketEditCard`. State is a local draft copy of `bucketConfigs` — changes are not saved until "שמור" is clicked.

Saving: calls `onSaveBuckets(draft)`, then closes edit mode. On cancel: discard draft.

Footer buttons:
```
<Btn variant="primary" onClick={handleSave}>שמור</Btn>
<Btn variant="secondary" onClick={() => setEditing(false)}>ביטול</Btn>
```

### RatingBucketEditCard (separate file)

File: `src/components/dashboard/RatingBucketEditCard.tsx`

```ts
interface Props {
  config: RatingBucketConfig;
  count: number;
  onChange: (field: keyof RatingBucketConfig, value: string) => void;
}
```

```
Wrapper:   bg-blue-50 dark:bg-blue-500/10 border border-blue-200 rounded-lg p-3 flex flex-col gap-2
Count:     text-lg font-bold font-mono text-foreground text-center (read-only)
Label:     <Input> text-xs text-center h-7 placeholder="שם הטווח"
Min row:   "מ:" label + <Input type="number"> — empty string maps to null on save
Max row:   "עד:" label + <Input type="number"> — empty string maps to null on save
```

---

## Section 4 — TodaySessionsTable

File: `src/components/dashboard/TodaySessionsTable.tsx`

This component reads its own data from `useData()` — it does not accept props. It builds a unified list of everything scheduled today across three entity types, sorted by start time.

### Session types and their data rules

**Class (חוג):**
- Source: active classes (`status === "פעיל"`)
- Include: any class with a slot where `slotOccursOnDate(slot, todayStr) === true`
- One row per slot per class (a class can appear twice if it has two slots today)
- `name`: cls.name
- `startTime` / `endTime`: from the matching slot
- `extra`: room name + " | " + teacher full name (skip missing)
- `enrolled`: `"X / Y"` where X = active enrollments for this class, Y = cls.capacity

**Tournament (תחרות):**
- Exclude: `status === "בוטל"`
- **Recurring** (`is_recurring === true`): include if `t.recurring_date === todayStr`. One row, times from `t.recurring_start_time` / `t.recurring_end_time`, extra = `t.room ?? "—"`, enrolled = total participants count
- **Regular** (`is_recurring === false`): include one row per round where `round.date === todayStr`. Name = `"${t.name} — סיבוב ${round.round_number}"`, times from round, extra = `round.location ?? t.room ?? "—"`, enrolled = total participants count
- Total participants = `t.participant_ids.length + t.manual_participants.length`

**Event (אירוע):**
- Include: `eventOccursOnDate(ev, todayStr) === true`
- `extra`: ev.room ?? "—", enrolled: "—"

All sessions are sorted ascending by `startTime` (string compare, format "HH:MM").

### Enrollment color (classes only)

```ts
// ratio = enrolled / capacity
ratio >= 1   → text-red-600 font-semibold    (full)
ratio >= 0.8 → text-amber-600 font-medium    (nearly full — use amber, not orange)
default      → text-emerald-600              (normal)
```

### TodaySessionTypeBadge (separate file)

File: `src/components/dashboard/TodaySessionTypeBadge.tsx`

```tsx
// Design guide: badge shape = rounded-full px-2.5 py-0.5 text-xs font-medium
type SessionType = "חוג" | "תחרות" | "אירוע";
// חוג    → bg-blue-50 text-blue-700 border border-blue-200
// תחרות  → bg-amber-50 text-amber-700 border border-amber-200
// אירוע  → bg-emerald-50 text-emerald-700 border border-emerald-200
```

### Table visual spec

```
Section header:  text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3
                 includes today's date: new Date().toLocaleDateString("he-IL", { weekday:"long", day:"numeric", month:"long" })

Wrapper:         bg-card border border-border rounded-xl overflow-hidden
Header row:      bg-muted/40
Header cell:     px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground text-start
Columns:         שעה | סוג | שם | מיקום / מדריך | משתתפים
Time cell:       font-mono tabular-nums text-xs text-muted-foreground whitespace-nowrap
Data rows:       divide-y divide-border, cursor-pointer, hover:bg-muted/30 transition-colors duration-100

Empty state:     bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground
                 text: "אין מפגשים מתוכננים להיום"
```

### Row click — modal behavior

Clicking a row opens the corresponding read-only detail modal. The modals are imported from their existing locations — **do not modify them**.

```ts
// Class → ViewExistingClassDetailModal (from @/components/classes/ViewExistingClassDetailModal)
// Tournament → TournamentDetailModal (from @/components/tournaments/TournamentDetailModal)
// Event → EventDetailModal (from @/components/tournaments/events/EventDetailModal)
```

Use three separate `useState` values for which item is selected (one per type). Pass `onEdit={() => setSelectedX(null)}` — this dismisses the modal; the dashboard does not support editing.

---

## Section 5 — EnrollmentStatusList

File: `src/components/dashboard/EnrollmentStatusList.tsx`

Reads its own data from `useData()`. No props needed.

### Data logic

```ts
const items = classes
  .filter(c => c.status === "פעיל")
  .map(cls => {
    const enrolled = enrollments.filter(e => e.class_id === cls.id && e.status === "פעיל").length;
    const ratio = cls.capacity > 0 ? enrolled / cls.capacity : 0;
    return { cls, enrolled, ratio };
  })
  .sort((a, b) => b.ratio - a.ratio);  // fullest classes first
```

### Visual spec per row

```
Wrapper:     bg-card border border-border rounded-xl divide-y divide-border
Row:         px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors duration-100

Row layout:
  Line 1 — flex justify-between:
    - Class name: text-sm font-medium text-foreground
    - End group: status label (text-xs font-medium, colored) + count "X / Y" (text-xs text-muted-foreground font-mono)
  Line 2 — progress bar:
    - Track: h-2 bg-muted rounded-full overflow-hidden
    - Fill:  h-full rounded-full transition-all, width = min(ratio * 100, 100)%

Status theme by ratio:
  >= 1   → bar: bg-red-500,    label: "מלא",        text: text-red-600
  >= 0.8 → bar: bg-amber-400,  label: "כמעט מלא",   text: text-amber-600
  default → bar: bg-emerald-500, label: "רגיל",      text: text-emerald-600
```

Clicking a row opens `ViewExistingClassDetailModal`. Pass `onEdit={() => setSelectedClass(null)}`.

### Empty state

```
bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground
text: "אין חוגים פעילים"
```

### Section header

```
text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3
text: "מצב רישומים — חוגים פעילים"
```

---

## Constraints & rules

- **RTL:** `dir="rtl"` is on `<html>` — never add it to individual containers. Use logical properties: `border-s-`, `ms-`, `ps-`, `text-start`, `justify-start`.
- **File size:** each file must stay under 200 lines. If a component approaches 150 lines, extract a sub-component.
- **No hardcoded colors:** use only design-system tokens (`bg-card`, `text-muted-foreground`, etc.) or the approved status color classes from the design guide.
- **No shadows on cards:** border only (+ the `border-s-4` accent stripe on StatCard).
- **Monospace numbers:** every number displayed to the user — counts, ratings, capacity, time — must use `font-mono tabular-nums`.
- **Imports:** never import Firebase SDK directly in a component. Use `useData()` or `useRatingThresholds()`.
- **Do not modify** any modal components (`ViewExistingClassDetailModal`, `TournamentDetailModal`, `EventDetailModal`). They are outside your scope.
- **Comments:** only when the WHY is non-obvious (e.g. why null means "no bound"). Never explain what the code does.

---

## QA checklist — everything must pass before you are done

### Loading & error
- [ ] Spinner shows while `loading === true`, disappears once data arrives
- [ ] Error message shows when `error` is set; no partial content visible

### StatCards
- [ ] Four cards render with correct values
- [ ] "X חדשים החודש" sub-text appears only when `newThisMonth > 0`
- [ ] Clicking each card navigates to the correct filtered URL
- [ ] Hover state applies only to clickable cards

### RatingDistribution
- [ ] Correct student count per bucket based on `israeli_rating`
- [ ] Clicking a bucket navigates to `/students` with the correct `minRating`/`maxRating` params
- [ ] Pencil icon opens edit mode
- [ ] Edit mode shows current values; changes are reflected in draft only
- [ ] "שמור" saves and closes edit mode
- [ ] "ביטול" discards changes and closes edit mode
- [ ] Empty min/max fields save as `null` (no bound)

### TodaySessionsTable
- [ ] Shows only sessions for today's date
- [ ] Recurring tournaments appear if `recurring_date === today`
- [ ] Regular tournaments appear once per round scheduled today (with round number in name)
- [ ] Cancelled tournaments (`status === "בוטל"`) are excluded
- [ ] Events appear based on `eventOccursOnDate`
- [ ] Rows are sorted by start time ascending
- [ ] Time column is monospace
- [ ] Enrollment color is red when full, amber when ≥ 80%, emerald otherwise
- [ ] Clicking a class row opens class detail modal
- [ ] Clicking a tournament row opens tournament detail modal
- [ ] Clicking an event row opens event detail modal
- [ ] "—" displays for event participant count
- [ ] Empty state shows when no sessions today

### EnrollmentStatusList
- [ ] Only active classes appear
- [ ] Classes sorted by enrollment ratio, fullest first
- [ ] Progress bar width matches enrolled/capacity ratio, capped at 100%
- [ ] Status label and bar color match the threshold rules
- [ ] Clicking a row opens class detail modal
- [ ] Empty state shows when no active classes

### Visual
- [ ] No hardcoded `bg-white`, `text-gray-*`, `shadow-*` on any rebuilt component
- [ ] All numbers use `font-mono tabular-nums`
- [ ] `border-s-4` accent stripe appears on the correct (start/right) edge in RTL
- [ ] Entrance animation plays once on page load
- [ ] Dark mode: all surfaces and text are readable
