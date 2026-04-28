/*
  SMALL HELPER FUNCTIONS — pure, no side effects, no Firebase, no UI.
  Import and call anywhere.

  Functions:
  - calcAge(dob)           → how old is this person today (in full years)
  - fullName(person)       → "First Last" string
  - fmtDate(dateStr)       → "YYYY-MM-DD" → "DD/MM/YY" for display
  - gradeFromDob(dob)      → "גן ילדים" / "כיתה א'" ... "כיתה י"ב" / "מבוגר"
  - todayStr()             → today as "YYYY-MM-DD"
  - timeToMins(time)       → "HH:MM" → total minutes (for comparing times)
  - clampString(val, max)  → cut string if too long
  - clampNumber(val,mn,mx) → keep number inside bounds
  - formatPhone(phone)     → normalize phone to 10-digit string
*/
