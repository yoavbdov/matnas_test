/*
  VALIDATION CONSTANTS & HELPERS — single source of truth for all form field limits.
  Import these in form components instead of hardcoding limits inline.

  Convention summary:
  - Name fields: 50 chars max
  - Description fields: 300 chars max
  - Notes fields: 300 chars max
  - Email: 40 chars max
  - Address: 50 chars max
  - Phone: exactly 10 digits, stored as "053-2422215"
  - Israeli ID (ת"ז): 9 digits only
  - Israeli chess ID: 6 digits only
  - FIDE ID: 9 digits only
  - Ratings (מד כושר): 0–9999 (4 digits)
  - Age: 0–120
*/

// Numeric limits for each field type
export const LIMITS = {
  NAME: 50,             // all name fields (student, teacher, class, group, event, etc.)
  DESCRIPTION: 300,     // all description/תיאור fields
  NOTES: 300,           // all notes/הערות fields
  EMAIL: 40,            // email addresses
  ADDRESS: 50,          // physical address
  PHONE: 10,            // phone numbers (digits only, must be exactly 10)
  AGE_MAX: 120,         // maximum age in years
  RATING_MAX: 9999,     // chess rating max (4 digits)
  ISRAELI_ID: 9,        // Israeli ID / ת"ז (digits only)
  ISRAELI_CHESS_ID: 6,  // Israeli chess player number (digits only)
  FIDE_ID: 9,           // FIDE player number (digits only)
  ATTENDANCE_NOTE: 120, // attendance session note (shorter, shown inline)
  SEARCH: 40,           // max characters in any search box
} as const;

// Uniform Hebrew error messages shown in toasts and field hints
export const VALIDATION_ERRORS = {
  PHONE: "מספר טלפון חייב להכיל בדיוק 10 ספרות(לדוגמא:0531234567",
  PARENT_PHONE: "טלפון הורה חייב להכיל בדיוק 10 ספרות",
  AGE: `גיל חייב להיות בין 0 ל-${LIMITS.AGE_MAX}`,
  NAME_TOO_LONG: `שם לא יכול לעלות על ${LIMITS.NAME} תווים`,
  EMAIL_TOO_LONG: `אימייל לא יכול לעלות על ${LIMITS.EMAIL} תווים`,
  TIME_RANGE: "שעת הסיום חייבת להיות אחרי שעת ההתחלה",
} as const;

// Strip non-digit characters and cap to maxDigits.
// Use this in onChange handlers for phone, ID, and chess number fields.
export function digitsOnly(value: string, maxDigits: number): string {
  return value.replace(/\D/g, "").slice(0, maxDigits);
}

// Format a phone number for storage and display.
// Input: "0532422215" → Output: "053-2422215"
// Also works with already-formatted input by stripping the dash first.
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === LIMITS.PHONE) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return digits; // return as-is if not exactly 10 digits
}

// Returns an error message if end time is not strictly after start time, or null if valid.
// Compares "HH:MM" strings directly — works because they sort lexicographically.
// An empty string for either field is considered not-yet-filled and returns null.
export function validateTimeRange(start: string, end: string): string | null {
  if (!start || !end) return null;
  if (end <= start) return VALIDATION_ERRORS.TIME_RANGE;
  return null;
}

// Returns an error message if phone is invalid, or null if OK.
// An empty/undefined phone is considered valid (field is optional).
export function validatePhone(phone: string | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== LIMITS.PHONE) return VALIDATION_ERRORS.PHONE;
  return null;
}
