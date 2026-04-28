/*
  DASHBOARD PAGE — first thing the admin sees after logging in.

  Composed of 3 sections:

  ── Section 1: Stat Cards (top row) ──
  Two StatCards:
  - Count of active students → clicking goes to /students?status=active
  - Count of active classes → clicking goes to /classes?status=active

  ── Section 2: Today's Sessions ──
  Lists all classes that have a scheduled slot occurring today.
  Each row shows: time range, room name, teacher name, enrolled / capacity.
  Sorted by start time.
  Uses slotOccursOnDate() from scheduleHelpers to figure out which slots are today.

  ── Section 3: Class Enrollment Status ──
  Lists all active classes with a progress bar showing enrolled / capacity.
  Bar color:
    teal   = normal
    orange = above CLASS_NEAR_FULL_THRESHOLD (almost full)
    red    = at capacity (full)

  All data comes from useData() context — no direct Firestore calls here.
*/
