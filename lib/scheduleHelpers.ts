/*
  SCHEDULE CALCULATION HELPERS — pure functions, no Firebase, no UI.

  Functions:
  - slotOccursOnDate(slot, dateStr)
      → given a ScheduleSlot and a date string ("YYYY-MM-DD"),
        returns true if that slot has a session on that date.
      → handles all recurrence types:
          "חד פעמי"    — only on slot.once_date
          "יומי"       — every day from start_date
          "שבועי"      — every 7 days from start_date, on the right weekday
          "פעם בשבועיים"   — every 14 days
          "פעם בשלושה שבועות"  — every 21 days
          "פעם בחודש"      — same weekday, every 4 weeks
      → also checks: date is within slot's start_date and end_date_override

  - getSlotsForWeek(classes, weekStartDate)
      → given all classes and the start of a week (Sunday),
        returns a flat list of { classId, slot, date } for every session
        that falls in that 7-day window
      → used by the schedule page to render the calendar
*/
