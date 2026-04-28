/*
  // החלק בטופס החוג שבו קובעים מתי החוג מתקיים — באיזה יום, באיזו שעה, באיזה חדר ועד מתי.
  CLASS SCHEDULE SLOTS — manage the time slots for a class.

  Props: slots[], rooms[], allClasses[], onChange(slots[])

  For each slot:
  - יום בשבוע    (dropdown from DAYS)
  - שעת התחלה   (time input HH:MM)
  - שעת סיום    (time input HH:MM)
  - חדר          (dropdown of rooms)
  - חזרה         (dropdown: חד פעמי, שבועי, דו שבועי, etc.)
  - אם חד פעמי  : show specific date picker
  - תאריך התחלה (date picker)
  - תאריך סיום מקומי (optional override)
  - "הוסף משבצת" button adds another slot row
  - X button on each row removes it

  Conflict warning:
  - After each change, calls slotsConflict() from classHelpers
  - If same room + overlapping time with another class:
      show yellow warning banner "קונפליקט עם חוג [שם]"
  - Warning only — does not block saving
*/
