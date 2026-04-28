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
      return slot.day === targetDay && diffDays(target, start) % 7 === 0;

    case "פעם בשבועיים":
      return slot.day === targetDay && diffDays(target, start) % 14 === 0;

    case "פעם בשלושה שבועות":
      return slot.day === targetDay && diffDays(target, start) % 21 === 0;

    case "פעם בחודש":
      return slot.day === targetDay && diffDays(target, start) % 28 === 0;

    default:
      return false;
  }
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
    const dateStr = d.toISOString().slice(0, 10);

    for (const cls of classes) {
      if (cls.status !== "פעיל") continue;
      for (const slot of cls.slots ?? []) {
        if (slotOccursOnDate(slot, dateStr)) {
          results.push({ classId: cls.id, slot, date: dateStr });
        }
      }
    }
  }

  return results;
}
