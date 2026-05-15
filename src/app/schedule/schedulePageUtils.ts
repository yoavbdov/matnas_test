// Helper functions used only by the Schedule page (not shared across the app)

// Check if two HH:MM time ranges overlap
export function timesOverlapLocal(
  s1: string,
  e1: string,
  s2: string,
  e2: string,
): boolean {
  const toMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return toMins(s1) < toMins(e2) && toMins(s2) < toMins(e1);
}

// Use local date parts — toISOString() returns UTC and shifts the date in UTC+2/3 (Israel)
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Returns the Set of date strings for the whole week that contains `date` (Sun–Sat)
export function weekOf(date: Date): Set<string> {
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - date.getDay()); // go back to Sunday
  sunday.setHours(0, 0, 0, 0);
  const set = new Set<string>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    set.add(toDateStr(d));
  }
  return set;
}
