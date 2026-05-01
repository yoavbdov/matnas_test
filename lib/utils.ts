/*
  SMALL HELPER FUNCTIONS — pure, no side effects, no Firebase, no UI.
  Import and call anywhere.
*/

// Calculate full years of age from DOB string "YYYY-MM-DD"
export function calcAge(dob: string): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

// Build "First Last" display string
export function fullName(person: { first_name: string; last_name: string }): string {
  return `${person.first_name} ${person.last_name}`.trim();
}

// Format "YYYY-MM-DD" → "DD/MM/YY" for display
export function fmtDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y.slice(2)}`;
}

// Map age to Israeli school grade label
// Uses gradeFirstAge (age entering 1st grade) and gradeAdultAge thresholds
export function gradeFromDob(
  dob: string,
  gradeFirstAge = 6,
  gradeAdultAge = 18
): string {
  const age = calcAge(dob);
  if (age < gradeFirstAge) return "גן ילדים";
  if (age >= gradeAdultAge) return "מבוגר";
  const grade = age - gradeFirstAge + 1; // 1-based grade number
  const labels = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ז׳", "ח׳", "ט׳", "י׳", "י״א", "י״ב"];
  return `כיתה ${labels[grade - 1] ?? String(grade)}`;
}

// Return today as "YYYY-MM-DD"
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// Convert "HH:MM" time string to total minutes from midnight
export function timeToMins(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

// Cut a string to max length without throwing
export function clampString(val: string, max: number): string {
  return val.length > max ? val.slice(0, max) : val;
}

// Keep a number inside [min, max] bounds
export function clampNumber(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

// Strip non-digit characters and cap at 10 digits for Israeli phone numbers
export function formatPhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(0, 10);
}
