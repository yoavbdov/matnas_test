/*
  EVENT HELPERS — pure functions, no Firebase, no UI.
  Handles conflict detection for events against classes, tournaments, and other events.
*/

import { timeToMins } from "./utils";
import { slotOccursOnDate } from "./scheduleHelpers";
import { recurringTournamentOccursOnDate } from "./tournamentHelpers";
import { DAYS } from "./constants";
import type { Event, Class, Tournament, Room } from "./types";

// Maps Hebrew day names to JS Date.getDay() (0=Sunday)
const DAY_TO_INDEX: Record<string, number> = {
  "ראשון": 0, "שני": 1, "שלישי": 2, "רביעי": 3, "חמישי": 4, "שישי": 5, "שבת": 6,
};

/** Check if two HH:MM time ranges overlap */
function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return timeToMins(s1) < timeToMins(e2) && timeToMins(s2) < timeToMins(e1);
}

/**
 * Returns true if the given event should appear on a specific date.
 * - One-time: must match event.date exactly.
 * - Recurring: date must be within the active range AND fall on a matching day-of-week.
 */
export function eventOccursOnDate(event: Event, dateStr: string): boolean {
  if (event.recurrence_type === "חד פעמי") {
    return event.date === dateStr;
  }

  // Recurring checks
  if (!event.days_of_week?.length || !event.start_date) return false;
  if (dateStr < event.start_date) return false;
  if (!event.is_permanent && event.end_date && dateStr > event.end_date) return false;

  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return event.days_of_week.some((day) => DAY_TO_INDEX[day] === dow);
}

/**
 * Builds a list of conflict descriptions for a draft event (before saving).
 * Checks room + time overlaps against classes, tournaments, and other events.
 *
 * For ONE-TIME events: checks the specific date.
 * For RECURRING events: checks structurally by day-of-week pattern.
 *
 * Returns an array of human-readable conflict strings, e.g. "חוג: שחמט לילדים".
 */
export function getEventConflicts(
  draft: Omit<Event, "id">,
  allClasses: Class[],
  allTournaments: Tournament[],
  allEvents: Event[],
  rooms: Room[],
  ignoreEventId?: string
): string[] {
  const { start_time, end_time, room } = draft;
  if (!room || !start_time || !end_time) return [];

  const conflicts: string[] = [];

  // Helper: resolve a room_id to its display name
  const roomName = (roomId: string) => rooms.find((r) => r.id === roomId)?.name ?? "";

  // Determine if we're doing date-exact or structural checks
  const isOneTime = draft.recurrence_type === "חד פעמי";
  const checkDate = isOneTime ? draft.date : undefined;

  // Day-of-week indices for structural (recurring) checks
  const daysToCheck = isOneTime
    ? [] // not used
    : (draft.days_of_week ?? []).map((day) => DAY_TO_INDEX[day]);

  // --- Check classes ---
  for (const cls of allClasses) {
    if (cls.status === "בוטל" || cls.status === "הסתיים") continue;
    let found = false;
    for (const slot of cls.slots ?? []) {
      if (roomName(slot.room_id) !== room) continue;
      if (!timesOverlap(start_time, end_time, slot.start_time, slot.end_time)) continue;

      if (checkDate) {
        // One-time: does this slot run on that exact date?
        if (slotOccursOnDate(slot, checkDate)) { found = true; break; }
      } else {
        // Recurring: does the slot share any day-of-week with our pattern?
        if (daysToCheck.includes(DAY_TO_INDEX[slot.day])) { found = true; break; }
      }
    }
    if (found) conflicts.push(`חוג: ${cls.name}`);
  }

  // --- Check tournaments ---
  for (const t of allTournaments) {
    if (t.status === "בוטל") continue;
    if (!t.room || t.room !== room) continue;

    if (checkDate) {
      // One-time: does the tournament run on this date with overlapping time?
      let tStart: string | undefined;
      let tEnd: string | undefined;
      if (t.is_recurring) {
        if (recurringTournamentOccursOnDate(t, checkDate)) {
          tStart = t.recurring_start_time;
          tEnd = t.recurring_end_time;
        }
      } else {
        const round = (t.rounds ?? []).find((r) => r.date === checkDate);
        if (round) { tStart = round.start_time; tEnd = round.end_time; }
      }
      if (tStart && tEnd && timesOverlap(start_time, end_time, tStart, tEnd)) {
        conflicts.push(`תחרות: ${t.name}`);
      }
    } else {
      // Recurring: structural check by day-of-week
      let found = false;
      if (t.is_recurring && t.recurring_date && t.recurring_start_time && t.recurring_end_time) {
        const [ty, tm, td] = t.recurring_date.split("-").map(Number);
        const tDow = new Date(ty, tm - 1, td).getDay();
        if (daysToCheck.includes(tDow) && timesOverlap(start_time, end_time, t.recurring_start_time, t.recurring_end_time)) {
          found = true;
        }
      } else {
        for (const round of t.rounds ?? []) {
          const [ry, rm, rd] = round.date.split("-").map(Number);
          const rDow = new Date(ry, rm - 1, rd).getDay();
          if (daysToCheck.includes(rDow) && timesOverlap(start_time, end_time, round.start_time, round.end_time)) {
            found = true;
            break;
          }
        }
      }
      if (found) conflicts.push(`תחרות: ${t.name}`);
    }
  }

  // --- Check other events ---
  for (const ev of allEvents) {
    if (ev.id === ignoreEventId) continue;
    if (ev.room !== room) continue;
    if (!timesOverlap(start_time, end_time, ev.start_time, ev.end_time)) continue;

    if (checkDate) {
      if (eventOccursOnDate(ev, checkDate)) conflicts.push(`אירוע: ${ev.name}`);
    } else {
      // Both recurring — check if any day-of-week overlaps
      if (ev.recurrence_type === "חד פעמי") {
        if (ev.date) {
          const [y, m, d] = ev.date.split("-").map(Number);
          const evDow = new Date(y, m - 1, d).getDay();
          if (daysToCheck.includes(evDow)) conflicts.push(`אירוע: ${ev.name}`);
        }
      } else {
        const evDays = (ev.days_of_week ?? []).map((day) => DAY_TO_INDEX[day]);
        if (daysToCheck.some((d) => evDays.includes(d))) conflicts.push(`אירוע: ${ev.name}`);
      }
    }
  }

  // Remove duplicates
  return [...new Set(conflicts)];
}

/**
 * Returns a human-readable summary of when a recurring event repeats.
 * Example: "כל ראשון ורביעי, מ-2025-01-01 עד 2025-06-30"
 */
export function formatRecurringEventSummary(event: Event): string {
  if (event.recurrence_type === "חד פעמי") return event.date ?? "";

  const days = (event.days_of_week ?? [])
    .sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b))
    .join(", ");

  const range = event.is_permanent
    ? "ללא הגבלת זמן"
    : `עד ${event.end_date ?? "?"}`;

  return `כל ${days} — ${range}`;
}
