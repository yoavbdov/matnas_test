/*
  SCHEDULE PAGE — weekly calendar view of all class sessions.

  Layout:
  - 7 columns (ראשון to שבת)
  - Time axis: 08:00 – 22:00 by default; toggle to show full 00:00–24:00
  - Each class session = a colored card, positioned at the right time slot
  - Card shows: class name, time range, room, teacher, enrolled/capacity

  Navigation:
  - "שבוע קודם" / "שבוע הבא" / "השבוע הנוכחי" buttons(always show all of them, if im currently watching the current week and i press השבוע הנוכחי - do nothing)
  - Header shows the date range of the current week

  Filters (any combination):
  - By room
  - By teacher
  - By student (shows only classes that student is enrolled in)
  - By class

  Conflict indicator:
  - If two classes share the same room at the same time:
      red badge in the corner with a count ("2 קונפליקטים")
      conflicting cards get a red border

  Uses getSlotsForWeek() from scheduleHelpers to compute what sessions appear.
*/
