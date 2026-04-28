/*
  CLASS / SCHEDULE LOGIC — pure functions, no Firebase, no UI.
  Used by the classes page and the schedule page.

  Functions:
  - slotsConflict(slotA, slotB)
      → true if both slots use the same room AND their times overlap on the same day
        (accounts for recurrence — weekly, biweekly, etc.)

  - slotsOverlapTime(slotA, slotB)
      → true if the time ranges overlap on the same day (ignores room)
        used to warn about a teacher being double-booked

  - calcResourceAvailability(resource, allClasses, ignoreClassId)
      → looks at all classes that use this resource at overlapping times
      → returns how many units are used at peak simultaneously
      → caller compares that to resource.quantity to know if there's a shortage

  - getConflictingClassIds(targetClass, allClasses)
      → returns IDs of classes that conflict with the target class (room + time)
*/
