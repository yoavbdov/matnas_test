/*
  SCHEDULE CARD — one session block rendered inside the calendar grid.

  Props:
  - classItem    : the Class this session belongs to
  - slot         : the ScheduleSlot
  - date         : the specific date this occurrence is on
  - teacher      : Teacher object (to show name)
  - room         : Room object (to show name)
  - enrollCount  : how many students enrolled
  - hasConflict  : if true, shows red border

  Positioned absolutely inside the day column based on start/end time.
  Color background comes from CLASS_COLORS (based on class index in list).

  Clicking the card could open the ViewExistingClassDetailModal (optional, handled by parent).
*/
