/*
  CLASS / SCHEDULE LOGIC — pure functions, no Firebase, no UI.
  Used by the classes page and the schedule page.
*/

import { timeToMins } from "./utils";
import { eventOccursOnDate } from "./eventHelpers";
import type { ScheduleSlot, Class, PhysicalEquipment, Tournament, ResourceAssignment, Event, Room } from "./types";

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

// Helper: do two HH:MM time ranges overlap?
function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return timeToMins(s1) < timeToMins(e2) && timeToMins(s2) < timeToMins(e1);
}

// ─── CORE: usage at a specific time window ────────────────────────────────────
//
// Count how many units of a resource are already committed by OTHER events
// during a specific (day-of-week + HH:MM range) window.
//
// Classes match by weekday (they recur weekly).
// Recurring tournaments match by weekday derived from their anchor date.
// Non-recurring tournaments match by weekday of any of their rounds.
//
// Pass ignoreClassId / ignoreTournamentId to exclude the event being edited.
export function calcUsedAtWindow(
  resourceId: string,
  day: string,       // Hebrew day name, e.g. "ראשון"
  startTime: string, // HH:MM
  endTime: string,   // HH:MM
  allClasses: Class[],
  ignoreClassId: string | undefined,
  allTournaments: Tournament[],
  ignoreTournamentId: string | undefined
): number {
  let count = 0;

  // Classes: recurring weekly — match by weekday
  for (const cls of allClasses) {
    if (cls.id === ignoreClassId) continue;
    const qty = getAssignedQty(cls.resource_assignments, resourceId);
    if (qty === 0) continue;
    for (const slot of cls.slots ?? []) {
      if (slot.day === day && timesOverlap(startTime, endTime, slot.start_time, slot.end_time)) {
        count += qty;
        break; // count each class once even if it has multiple overlapping slots
      }
    }
  }

  // Tournaments: match recurring by weekday, non-recurring by weekday of any round
  for (const t of allTournaments) {
    if (t.id === ignoreTournamentId) continue;
    if (t.is_recurring) {
      // Check both fields — the form saves to resource_assignments, but older data may use recurring_resource_assignments
      const qty = getAssignedQty(t.resource_assignments, resourceId) ||
                  getAssignedQty(t.recurring_resource_assignments, resourceId);
      if (qty === 0 || !t.recurring_date) continue;
      const [y, m, d] = t.recurring_date.split("-").map(Number);
      const tDay = HEBREW_DAYS_LOCAL[new Date(y, m - 1, d).getDay()];
      if (tDay === day && timesOverlap(startTime, endTime, t.recurring_start_time ?? "00:00", t.recurring_end_time ?? "01:00")) {
        count += qty;
      }
    } else {
      const qty = getAssignedQty(t.resource_assignments, resourceId);
      if (qty === 0) continue;
      // Only count future/ongoing rounds — past rounds are over and no longer consume equipment
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      for (const round of t.rounds ?? []) {
        if (!round.date || round.date < todayStr) continue; // skip past rounds
        const [y, m, d] = round.date.split("-").map(Number);
        const rDay = HEBREW_DAYS_LOCAL[new Date(y, m - 1, d).getDay()];
        if (rDay === day && timesOverlap(startTime, endTime, round.start_time, round.end_time)) {
          count += qty;
          break;
        }
      }
    }
  }

  return count;
}

// ─── CORE: exact-date usage ───────────────────────────────────────────────────
//
// Count how many units are in use on a SPECIFIC date (YYYY-MM-DD) and time range.
// Classes match by weekday of that date. Non-recurring tournaments match by exact date.
// Used in the tournament form where rounds have specific dates.
export function calcUsedOnDate(
  resourceId: string,
  date: string,      // YYYY-MM-DD
  startTime: string, // HH:MM
  endTime: string,   // HH:MM
  allClasses: Class[],
  allTournaments: Tournament[],
  ignoreTournamentId: string | undefined
): number {
  if (!date || !startTime || !endTime) return 0;

  const dayName = HEBREW_DAYS_LOCAL[new Date(date).getDay()];
  let count = 0;

  // Classes: match by weekday
  for (const cls of allClasses) {
    const qty = getAssignedQty(cls.resource_assignments, resourceId);
    if (qty === 0) continue;
    for (const slot of cls.slots ?? []) {
      if (slot.day === dayName && timesOverlap(startTime, endTime, slot.start_time, slot.end_time)) {
        count += qty;
        break;
      }
    }
  }

  // Tournaments
  for (const t of allTournaments) {
    if (t.id === ignoreTournamentId) continue;
    if (t.is_recurring) {
      // Recurring: match by weekday — check both fields (form saves to resource_assignments)
      const qty = getAssignedQty(t.resource_assignments, resourceId) ||
                  getAssignedQty(t.recurring_resource_assignments, resourceId);
      if (qty === 0 || !t.recurring_date) continue;
      const [y, m, d] = t.recurring_date.split("-").map(Number);
      const tDay = HEBREW_DAYS_LOCAL[new Date(y, m - 1, d).getDay()];
      if (tDay === dayName && timesOverlap(startTime, endTime, t.recurring_start_time ?? "00:00", t.recurring_end_time ?? "01:00")) {
        count += qty;
      }
    } else {
      // Non-recurring: match by exact date
      const qty = getAssignedQty(t.resource_assignments, resourceId);
      if (qty === 0) continue;
      for (const r of t.rounds ?? []) {
        if (r.date === date && timesOverlap(startTime, endTime, r.start_time, r.end_time)) {
          count += qty;
          break;
        }
      }
    }
  }

  return count;
}

// ─── FOR CLASS FORM: worst case across all class slots ───────────────────────
//
// A class runs on multiple slots (e.g. Monday + Wednesday).
// Returns the maximum usage across all slots — the worst-case scenario.
// This is how many units are already committed during the busiest slot.
export function calcUsedDuringClassSlots(
  resourceId: string,
  classSlots: ScheduleSlot[],   // the slots of the class being edited
  allClasses: Class[],
  ignoreClassId: string | undefined,
  allTournaments: Tournament[]
): number {
  let maxUsage = 0;
  for (const slot of classSlots) {
    const usage = calcUsedAtWindow(
      resourceId, slot.day, slot.start_time, slot.end_time,
      allClasses, ignoreClassId, allTournaments, undefined
    );
    if (usage > maxUsage) maxUsage = usage;
  }
  return maxUsage;
}

// ─── CONFLICTING EVENT NAMES ──────────────────────────────────────────────────
//
// Same logic as calcUsedAtWindow but returns event names instead of counts.
// Used to display "who else is using this resource" warnings.
export function getConflictingNamesAtWindow(
  resourceId: string,
  day: string,
  startTime: string,
  endTime: string,
  allClasses: Class[],
  ignoreClassId: string | undefined,
  allTournaments: Tournament[],
  ignoreTournamentId: string | undefined
): string[] {
  const names: string[] = [];

  for (const cls of allClasses) {
    if (cls.id === ignoreClassId) continue;
    if (getAssignedQty(cls.resource_assignments, resourceId) === 0) continue;
    for (const slot of cls.slots ?? []) {
      if (slot.day === day && timesOverlap(startTime, endTime, slot.start_time, slot.end_time)) {
        names.push(cls.name);
        break;
      }
    }
  }

  for (const t of allTournaments) {
    if (t.id === ignoreTournamentId) continue;
    if (t.is_recurring) {
      // Check both fields — same reason as in calcUsedAtWindow
      const hasQty = getAssignedQty(t.resource_assignments, resourceId) > 0 ||
                     getAssignedQty(t.recurring_resource_assignments, resourceId) > 0;
      if (!hasQty) continue;
      if (!t.recurring_date) continue;
      const [y, m, d] = t.recurring_date.split("-").map(Number);
      const tDay = HEBREW_DAYS_LOCAL[new Date(y, m - 1, d).getDay()];
      if (tDay === day && timesOverlap(startTime, endTime, t.recurring_start_time ?? "00:00", t.recurring_end_time ?? "01:00")) {
        names.push(t.name);
      }
    } else {
      if (getAssignedQty(t.resource_assignments, resourceId) === 0) continue;
      // Only consider future/ongoing rounds — past rounds are no longer active
      const today2 = new Date();
      const todayStr2 = `${today2.getFullYear()}-${String(today2.getMonth() + 1).padStart(2, "0")}-${String(today2.getDate()).padStart(2, "0")}`;
      for (const round of t.rounds ?? []) {
        if (!round.date || round.date < todayStr2) continue; // skip past rounds
        const [y, m, d] = round.date.split("-").map(Number);
        const rDay = HEBREW_DAYS_LOCAL[new Date(y, m - 1, d).getDay()];
        if (rDay === day && timesOverlap(startTime, endTime, round.start_time, round.end_time)) {
          names.push(t.name);
          break;
        }
      }
    }
  }

  return names;
}

// Names of conflicting events on a specific date (used in tournament form).
export function getConflictingNamesOnDate(
  resourceId: string,
  date: string,
  startTime: string,
  endTime: string,
  allClasses: Class[],
  allTournaments: Tournament[],
  ignoreTournamentId: string | undefined
): string[] {
  if (!date || !startTime || !endTime) return [];
  const dayName = HEBREW_DAYS_LOCAL[new Date(date).getDay()];
  const names: string[] = [];

  for (const cls of allClasses) {
    if (getAssignedQty(cls.resource_assignments, resourceId) === 0) continue;
    for (const slot of cls.slots ?? []) {
      if (slot.day === dayName && timesOverlap(startTime, endTime, slot.start_time, slot.end_time)) {
        names.push(cls.name);
        break;
      }
    }
  }

  for (const t of allTournaments) {
    if (t.id === ignoreTournamentId) continue;
    if (t.is_recurring) {
      if (getAssignedQty(t.recurring_resource_assignments, resourceId) === 0) continue;
      if (!t.recurring_date) continue;
      const [y, m, d] = t.recurring_date.split("-").map(Number);
      const tDay = HEBREW_DAYS_LOCAL[new Date(y, m - 1, d).getDay()];
      if (tDay === dayName && timesOverlap(startTime, endTime, t.recurring_start_time ?? "00:00", t.recurring_end_time ?? "01:00")) {
        names.push(t.name);
      }
    } else {
      if (getAssignedQty(t.resource_assignments, resourceId) === 0) continue;
      for (const r of t.rounds ?? []) {
        if (r.date === date && timesOverlap(startTime, endTime, r.start_time, r.end_time)) {
          names.push(t.name);
          break;
        }
      }
    }
  }

  return names;
}

// For a class: collect conflicting event names across ALL slots (union).
export function getConflictingNamesDuringClassSlots(
  resourceId: string,
  classSlots: ScheduleSlot[],
  allClasses: Class[],
  ignoreClassId: string | undefined,
  allTournaments: Tournament[]
): string[] {
  const nameSet = new Set<string>();
  for (const slot of classSlots) {
    const names = getConflictingNamesAtWindow(
      resourceId, slot.day, slot.start_time, slot.end_time,
      allClasses, ignoreClassId, allTournaments, undefined
    );
    names.forEach((n) => nameSet.add(n));
  }
  return [...nameSet];
}

// ─── LEGACY ALIASES (kept for TournamentDetailModal / ViewExistingClassDetailModal) ──
// These two callers check if an event's equipment is overbooked AT ITS OWN TIME.

// For a tournament detail view: is this resource overbooked during any of its rounds?
// occurrenceDate: for recurring tournaments, check a specific date instead of day-of-week.
//   Pass the calendar date being viewed so the result is accurate for that day only.
export function isTournamentResourceOverbooked(
  resource: PhysicalEquipment,
  tournament: Tournament,
  qty: number,
  allClasses: Class[],
  allTournaments: Tournament[],
  occurrenceDate?: string
): boolean {
  if (tournament.is_recurring) {
    if (!tournament.recurring_date) return false;

    if (occurrenceDate) {
      // Exact-date check: only count equipment used by others on this specific date
      const used = calcUsedOnDate(
        resource.id, occurrenceDate,
        tournament.recurring_start_time ?? "00:00",
        tournament.recurring_end_time ?? "01:00",
        allClasses, allTournaments, tournament.id
      );
      return qty + used > resource.quantity;
    }

    // Fallback: structural check by day-of-week (used when no specific date is known)
    const [y, m, d] = tournament.recurring_date.split("-").map(Number);
    const day = HEBREW_DAYS_LOCAL[new Date(y, m - 1, d).getDay()];
    const used = calcUsedAtWindow(
      resource.id, day,
      tournament.recurring_start_time ?? "00:00",
      tournament.recurring_end_time ?? "01:00",
      allClasses, undefined, allTournaments, tournament.id
    );
    return qty + used > resource.quantity;
  } else {
    // Check only future/ongoing rounds — past rounds are done and can't be overbooked
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    for (const round of tournament.rounds ?? []) {
      if (!round.date || round.date < todayStr) continue; // skip past rounds
      const used = calcUsedOnDate(
        resource.id, round.date, round.start_time, round.end_time,
        allClasses, allTournaments, tournament.id
      );
      if (qty + used > resource.quantity) return true;
    }
    return false;
  }
}

// Backward-compat alias used by AvailabilityCheckerModal (accepts resource object, not just ID)
export function calcResourceUsageOnDateTime(
  resource: PhysicalEquipment,
  date: string,
  startTime: string,
  endTime: string,
  allClasses: Class[],
  allTournaments: Tournament[],
  ignoreTournamentId?: string
): number {
  return calcUsedOnDate(resource.id, date, startTime, endTime, allClasses, allTournaments, ignoreTournamentId);
}

// For a class detail view: is this resource overbooked during any of the class's slots?
export function isClassResourceOverbooked(
  resource: PhysicalEquipment,
  cls: Class,
  qty: number,
  allClasses: Class[],
  allTournaments: Tournament[]
): boolean {
  const used = calcUsedDuringClassSlots(resource.id, cls.slots ?? [], allClasses, cls.id, allTournaments);
  return qty + used > resource.quantity;
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

/**
 * Returns IDs of classes that conflict (room + time + day-of-week) with any event.
 * Used in the schedule page to mark classes with event conflicts.
 */
export function getClassIdsConflictingWithEvents(
  allClasses: Class[],
  allEvents: Event[],
  rooms: Room[]
): Set<string> {
  const conflictIds = new Set<string>();

  // Helper: resolve a room_id to its display name
  const roomName = (roomId: string) => rooms.find((r) => r.id === roomId)?.name ?? "";

  for (const cls of allClasses) {
    let hasConflict = false;
    outer: for (const slot of cls.slots ?? []) {
      const slotRoom = roomName(slot.room_id);
      if (!slotRoom) continue;

      for (const ev of allEvents) {
        if (ev.room !== slotRoom) continue;
        if (!timesOverlap(slot.start_time, slot.end_time, ev.start_time, ev.end_time)) continue;

        // Check if the event ever occurs on this slot's day-of-week
        const slotDow = HEBREW_DAYS_LOCAL.indexOf(slot.day);
        if (ev.recurrence_type === "חד פעמי") {
          if (!ev.date) continue;
          const [y, m, d] = ev.date.split("-").map(Number);
          if (new Date(y, m - 1, d).getDay() === slotDow) { hasConflict = true; break outer; }
        } else {
          // Recurring event — check if any of its days match the slot's day
          const evDows = (ev.days_of_week ?? []).map((day) => HEBREW_DAYS_LOCAL.indexOf(day));
          if (evDows.includes(slotDow)) { hasConflict = true; break outer; }
        }
      }
    }
    if (hasConflict) conflictIds.add(cls.id);
  }

  return conflictIds;
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
