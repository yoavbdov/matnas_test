/*
  // החלק בטופס החוג שבו ממלאים את הפרטים הבסיסיים: שם החוג, מי המדריך, כמה משתתפים, טווח גילאים ותאריך סיום.
  CLASS BASIC FIELDS — the simple fields section of the class form.

  Props: form state + onChange handlers from ClassFormModal

  Fields:
  - שם החוג    (required, maxLength MAX_STRING_LENGTH)
  - מדריך      (required, dropdown of all teachers)
  - קיבולת     (1 – MAX_INT_INPUT)
  - גיל מינימלי / גיל מקסימלי  (0 – MAX_AGE)
  - דירוג מינימלי / דירוג מקסימלי (0 – 3000, for isreali chess rating filter)
  - סטטוס      (פעיל / לא פעיל — only shown in edit mode)
  - תאריך סיום (optional date picker, or preset: month / 3mo / 6mo / year / 2yr / 3yr)
*/
