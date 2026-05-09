/*
  CLASS / SCHEDULE LOGIC — pure functions, no Firebase, no UI.
  Used by the classes page and the schedule page.
*/

import { timeToMins } from "./utils";
import type { ScheduleSlot, Class, PhysicalEquipment, Tournament, ResourceAssignment } from "./types";

// Hebrew day names indexed by JS getDay() (0=Sunday)
const HEBREW_DAYS_LOCAL = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

// Check if two slots occupy overlapping time on the same weekday
// (ignores room — used to detect teacher double-booking)
export function slotsOverlapTime(slotA: ScheduleSlot, slotB: ScheduleSlot): boolean {
  if (slotA.day !== slotB.day) return false;
  const aStart = timeToMins(slotA.start_time);
  const aEnd = timeToMins(slotA.end_time);
  const bStart = timeToMins(slotB.start_time);
  const bEnd = timeToMins(slotB.end_time);
  // Overlap exists when one starts before the other ends
  return aStart < bEnd && bStart < aEnd;
}

// Check if two slots truly conflict: same room AND overlapping time on the same day
export function slotsConflict(slotA: ScheduleSlot, slotB: ScheduleSlot): boolean {
  if (!slotA.room_id || slotA.room_id !== slotB.room_id) return false;
  return slotsOverlapTime(slotA, slotB);
}

// Helper: find how many units a class/event needs for a specific resource
function getAssignedQty(assignments: ResourceAssignment[] | undefined, resourceId: string): number {
  return assignments?.find((a) => a.resource_id === resourceId)?.quantity ?? 0;
}

// Count how many units of a resource are in use simultaneously across all classes AND tournaments.
// Caller compares returned number to resource.quantity to detect a shortage.
// Pass ignoreClassId to exclude a class being edited (so it doesn't conflict with itself).
export function calcResourceAvailability(
  resource: PhysicalEquipment,
  allClasses: Class[],
  ignoreClassId?: string,
  allTournaments: Tournament[] = []
): number {
  // Represent each usage as a pseudo-slot: { day, start_time, end_time, qty }
  const entries: { slot: ScheduleSlot; qty: number }[] = [];

  // Contributions from classes (by recurring weekly slot)
  for (const cls of allClasses) {
    if (cls.id === ignoreClassId) continue;
    const qty = getAssignedQty(cls.resource_assignments, resource.id);
    if (qty === 0) continue;
    for (const slot of cls.slots ?? []) {
      entries.push({ slot, qty });
    }
  }

  // Contributions from tournaments
  for (const t of allTournaments) {
    if (t.is_recurring) {
      // Recurring tournament: derive day-of-week from recurring_date
      const qty = getAssignedQty(t.recurring_resource_assignments, resource.id);
      if (qty === 0 || !t.recurring_date) continue;
      const [y, m, d] = t.recurring_date.split("-").map(Number);
      const day = HEBREW_DAYS_LOCAL[new Date(y, m - 1, d).getDay()];
      entries.push({
        qty,
        slot: {
          id: t.id,
          day,
          start_time: t.recurring_start_time ?? "00:00",
          end_time: t.recurring_end_time ?? "01:00",
          room_id: "",
          recurrence: "שבועי",
          start_date: t.recurring_date,
        },
      });
    } else {
      // Non-recurring tournament: push ONE entry per unique (day-of-week, time) slot.
      // Rounds on different calendar dates but the same weekday+time are NOT simultaneous —
      // they happen on separate dates, so de-duplicate to avoid inflating peak usage.
      const qty = getAssignedQty(t.resource_assignments, resource.id);
      if (qty === 0) continue;
      const seenSlots = new Set<string>();
      for (const round of t.rounds ?? []) {
        if (!round.date) continue;
        const [y, m, d] = round.date.split("-").map(Number);
        const day = HEBREW_DAYS_LOCAL[new Date(y, m - 1, d).getDay()];
        const slotKey = `${day}-${round.start_time}-${round.end_time}`;
        if (seenSlots.has(slotKey)) continue; // already accounted for this weekday+time
        seenSlots.add(slotKey);
        entries.push({
          qty,
          slot: {
            id: round.id,
            day,
            start_time: round.start_time,
            end_time: round.end_time,
            room_id: "",
            recurrence: "חד פעמי",
            start_date: round.date,
          },
        });
      }
    }
  }

  // For each entry, sum quantities of all overlapping entries — that is the peak simultaneous usage
  let peakUsage = 0;
  for (let i = 0; i < entries.length; i++) {
    let concurrent = 0;
    for (let j = 0; j < entries.length; j++) {
      if (slotsOverlapTime(entries[i].slot, entries[j].slot)) concurrent += entries[j].qty;
    }
    if (concurrent > peakUsage) peakUsage = concurrent;
  }

  return peakUsage;
}

// Returns the names of classes/tournaments that overlap in time and use this resource.
// Used to show "who else is using this" in the class form equipment section.
// Structural (day-of-week based) — no specific date needed.
export function getResourceConflictingEvents(
  resource: PhysicalEquipment,
  allClasses: Class[],
  ignoreClassId?: string,
  allTournaments: Tournament[] = []
): string[] {
  // Build the same entries list as calcResourceAvailability
  const entries: { slot: ScheduleSlot; qty: number; name: string }[] = [];

  for (const cls of allClasses) {
    if (cls.id === ignoreClassId) continue;
    const qty = getAssignedQty(cls.resource_assignments, resource.id);
    if (qty === 0) continue;
    for (const slot of cls.slots ?? []) {
      entries.push({ slot, qty, name: cls.name });
    }
  }

  for (const t of allTournaments) {
    if (t.is_recurring) {
      const qty = getAssignedQty(t.recurring_resource_assignments, resource.id);
      if (qty === 0 || !t.recurring_date) continue;
      const [y, m, d] = t.recurring_date.split("-").map(Number);
      const day = HEBREW_DAYS_LOCAL[new Date(y, m - 1, d).getDay()];
      entries.push({
        qty,
        name: t.name,
        slot: { id: t.id, day, start_time: t.recurring_start_time ?? "00:00", end_time: t.recurring_end_time ?? "01:00", room_id: "", recurrence: "שבועי", start_date: t.recurring_date },
      });
    } else {
      // Same de-duplication as calcResourceAvailability — rounds on different calendar dates
      // but the same weekday+time are not simultaneous, so only push one entry per unique slot.
      const qty = getAssignedQty(t.resource_assignments, resource.id);
      if (qty === 0) continue;
      const seenSlots = new Set<string>();
      for (const round of t.rounds ?? []) {
        if (!round.date) continue;
        const [y, m, d] = round.date.split("-").map(Number);
        const day = HEBREW_DAYS_LOCAL[new Date(y, m - 1, d).getDay()];
        const slotKey = `${day}-${round.start_time}-${round.end_time}`;
        if (seenSlots.has(slotKey)) continue;
        seenSlots.add(slotKey);
        entries.push({
          qty,
          name: t.name,
          slot: { id: round.id, day, start_time: round.start_time, end_time: round.end_time, room_id: "", recurrence: "חד פעמי", start_date: round.date },
        });
      }
    }
  }

  // Find all entries that overlap with any other entry — collect unique names
  const conflicting = new Set<string>();
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (slotsOverlapTime(entries[i].slot, entries[j].slot)) {
        conflicting.add(entries[i].name);
        conflicting.add(entries[j].name);
      }
    }
  }
  return [...conflicting];
}

// Returns the names of classes/tournaments using this resource at a specific date+time.
// Used to show "who else is using this" in the tournament form equipment section.
export function getResourceConflictingEventsOnDateTime(
  resource: PhysicalEquipment,
  date: string,
  startTime: string,
  endTime: string,
  allClasses: Class[],
  allTournaments: Tournament[],
  ignoreTournamentId?: string
): string[] {
  if (!date || !startTime || !endTime) return [];

  const dayName = HEBREW_DAYS_LOCAL[new Date(date).getDay()];

  function overlaps(s1: string, e1: string, s2: string, e2: string) {
    return timeToMins(s1) < timeToMins(e2) && timeToMins(s2) < timeToMins(e1);
  }

  const names: string[] = [];

  for (const cls of allClasses) {
    if (getAssignedQty(cls.resource_assignments, resource.id) === 0) continue;
    for (const slot of cls.slots ?? []) {
      if (slot.day === dayName && overlaps(startTime, endTime, slot.start_time, slot.end_time)) {
        names.push(cls.name);
        break; // count each class once
      }
    }
  }

  for (const t of allTournaments) {
    if (t.id === ignoreTournamentId) continue;
    if (t.is_recurring) {
      if (getAssignedQty(t.recurring_resource_assignments, resource.id) === 0) continue;
      if (
        t.recurring_date &&
        HEBREW_DAYS_LOCAL[new Date(...t.recurring_date.split("-").map(Number) as [number, number, number]).getDay()] === dayName &&
        overlaps(startTime, endTime, t.recurring_start_time ?? "00:00", t.recurring_end_time ?? "01:00")
      ) {
        names.push(t.name);
      }
    } else {
      if (getAssignedQty(t.resource_assignments, resource.id) === 0) continue;
      for (const round of t.rounds ?? []) {
        if (round.date === date && overlaps(startTime, endTime, round.start_time, round.end_time)) {
          names.push(t.name);
          break;
        }
      }
    }
  }

  return names;
}

// Hebrew day names indexed by JS getDay() (0=Sunday)
const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

// Count how many units of a resource are in use on a specific date+time range.
// Checks both class slots (by weekday match) and other tournament rounds (by exact date).
// Used to show availability hints in the tournament equipment selector.
export function calcResourceUsageOnDateTime(
  resource: PhysicalEquipment,
  date: string,        // YYYY-MM-DD
  startTime: string,   // HH:MM
  endTime: string,     // HH:MM
  allClasses: Class[],
  allTournaments: Tournament[],
  ignoreTournamentId?: string
): number {
  if (!date || !startTime || !endTime) return 0;

  // Get Hebrew day name for the given date (e.g. "ראשון")
  const dayName = HEBREW_DAYS[new Date(date).getDay()];

  // Helper: do two HH:MM time ranges overlap?
  function overlaps(s1: string, e1: string, s2: string, e2: string) {
    return timeToMins(s1) < timeToMins(e2) && timeToMins(s2) < timeToMins(e1);
  }

  let count = 0;

  // Sum quantities from classes whose recurring weekly slot matches the weekday and time
  for (const cls of allClasses) {
    const qty = getAssignedQty(cls.resource_assignments, resource.id);
    if (qty === 0) continue;
    for (const slot of cls.slots ?? []) {
      if (slot.day === dayName && overlaps(startTime, endTime, slot.start_time, slot.end_time)) {
        count += qty;
        break; // count each class once even if it has multiple overlapping slots
      }
    }
  }

  // Sum quantities from other tournament rounds on the exact same date that overlap
  for (const t of allTournaments) {
    if (t.id === ignoreTournamentId) continue;
    if (t.is_recurring) {
      // Match by day-of-week (not anchor date) — a recurring tournament on every Thursday
      // conflicts with any other Thursday, not just the anchor date
      const qty = getAssignedQty(t.recurring_resource_assignments, resource.id);
      if (qty === 0 || !t.recurring_date) continue;
      const [ry, rm, rd] = t.recurring_date.split("-").map(Number);
      const recurringDay = HEBREW_DAYS[new Date(ry, rm - 1, rd).getDay()];
      if (
        recurringDay === dayName &&
        overlaps(startTime, endTime, t.recurring_start_time ?? "", t.recurring_end_time ?? "")
      ) {
        count += qty;
      }
    } else {
      // Equipment for non-recurring tournaments is stored at tournament level (t.resource_assignments),
      // not per-round. Check each round for a date+time match, then count the tournament-level qty.
      const qty = getAssignedQty(t.resource_assignments, resource.id);
      if (qty === 0) continue;
      for (const r of t.rounds ?? []) {
        if (r.date === date && overlaps(startTime, endTime, r.start_time, r.end_time)) {
          count += qty;
          break; // count each tournament once even if multiple rounds somehow match
        }
      }
    }
  }

  return count;
}

/**
 * Compute class status automatically from slot dates — no manual input needed.
 *
 * Logic per slot:
 *   - מתוכנן  — all start_dates are in the future
 *   - הסתיים  — all slots have an end_date_override that is in the past
 *   - פעיל    — otherwise (at least one slot has started)
 *
 * A class with no slots defaults to "מתוכנן".
 */
export function computeClassStatus(cls: Class): Class["status"] {
  const today = new Date().toISOString().slice(0, 10);
  const slots = cls.slots ?? [];

  if (slots.length === 0) return "מתוכנן";

  // If ALL slots have an end_date_override that's already passed → finished
  const allEnded = slots.every(
    (s) => s.end_date_override && s.end_date_override < today
  );
  if (allEnded) return "הסתיים";

  // If ALL start_dates are in the future → not started yet
  const allFuture = slots.every((s) => s.start_date > today);
  if (allFuture) return "מתוכנן";

  return "פעיל";
}

// Return the IDs of all classes whose slots share a room + time with the target class
export function getConflictingClassIds(
  targetClass: Class,
  allClasses: Class[]
): string[] {
  const conflictIds: string[] = [];

  for (const other of allClasses) {
    if (other.id === targetClass.id) continue; // skip self

    let hasConflict = false;
    outer: for (const slotA of targetClass.slots ?? []) {
      for (const slotB of other.slots ?? []) {
        if (slotsConflict(slotA, slotB)) {
          hasConflict = true;
          break outer;
        }
      }
    }

    if (hasConflict) conflictIds.push(other.id);
  }

  return conflictIds;
}
