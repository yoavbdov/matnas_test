import { DAYS } from "./constants";
import type { Class, ScheduleSlot } from "./types";

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

export function slotOccursOnDate(slot: ScheduleSlot, dateStr: string): boolean {
  const target = parseDate(dateStr);
  const targetDay = DAYS[target.getDay()]; // getDay(): 0=Sun, 1=Mon, …

  if (!slot.start_date) return false;
  const start = parseDate(slot.start_date);
  if (target < start) return false;

  if (slot.end_date_override) {
    const end = parseDate(slot.end_date_override);
    if (target > end) return false;
  }

  switch (slot.recurrence) {
    case "חד פעמי":
      return slot.once_date === dateStr;

    case "יומי":
      return true;

    case "שבועי":
      // Any week on or after start_date is valid — just check the day name
      return slot.day === targetDay;

    case "פעם בשבועיים": {
      // Must land on the same day-of-week AND be an even number of weeks from start
      if (slot.day !== targetDay) return false;
      // Find the first occurrence on or after start that matches the day
      const startDay = start.getDay();
      const targetDayIndex = DAYS.indexOf(targetDay);
      const offsetToFirst = (targetDayIndex - startDay + 7) % 7;
      const firstOccurrence = new Date(start);
      firstOccurrence.setDate(start.getDate() + offsetToFirst);
      return diffDays(target, firstOccurrence) % 14 === 0;
    }

    case "פעם בשלושה שבועות": {
      if (slot.day !== targetDay) return false;
      const startDay = start.getDay();
      const targetDayIndex = DAYS.indexOf(targetDay);
      const offsetToFirst = (targetDayIndex - startDay + 7) % 7;
      const firstOccurrence = new Date(start);
      firstOccurrence.setDate(start.getDate() + offsetToFirst);
      return diffDays(target, firstOccurrence) % 21 === 0;
    }

    case "פעם בחודש": {
      if (slot.day !== targetDay) return false;
      const startDay = start.getDay();
      const targetDayIndex = DAYS.indexOf(targetDay);
      const offsetToFirst = (targetDayIndex - startDay + 7) % 7;
      const firstOccurrence = new Date(start);
      firstOccurrence.setDate(start.getDate() + offsetToFirst);
      return diffDays(target, firstOccurrence) % 28 === 0;
    }

    default:
      return false;
  }
}

/** Returns slots for an arbitrary list of dates (used when dates are non-consecutive) */
export function getSlotsForDates(
  classes: Class[],
  dateStrs: string[]
): Array<{ classId: string; slot: ScheduleSlot; date: string }> {
  const results: Array<{ classId: string; slot: ScheduleSlot; date: string }> = [];
  for (const dateStr of dateStrs) {
    for (const cls of classes) {
      // Show active and upcoming classes; skip finished/cancelled ones
      if (cls.status === "הסתיים" || cls.status === "בוטל") continue;
      for (const slot of cls.slots ?? []) {
        if (slotOccursOnDate(slot, dateStr)) {
          results.push({ classId: cls.id, slot, date: dateStr });
        }
      }
    }
  }
  return results;
}

export function getSlotsForWeek(
  classes: Class[],
  weekStartDate: string
): Array<{ classId: string; slot: ScheduleSlot; date: string }> {
  const results: Array<{ classId: string; slot: ScheduleSlot; date: string }> = [];
  const start = parseDate(weekStartDate);

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    // Use local date parts — toISOString() would give UTC and shift the date in UTC+2/3
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    for (const cls of classes) {
      // Show active and upcoming classes; skip finished/cancelled ones
      if (cls.status === "הסתיים" || cls.status === "בוטל") continue;
      for (const slot of cls.slots ?? []) {
        if (slotOccursOnDate(slot, dateStr)) {
          results.push({ classId: cls.id, slot, date: dateStr });
        }
      }
    }
  }

  return results;
}
