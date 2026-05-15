/*
  CROSS-CONFLICT DETECTION: class slots ↔ tournament occurrences.
  Covers 4 conflict types: room, teacher, students, equipment.

  Two usage modes:
  1. Calendar (exact dates) — detectSlotTournamentConflictsOnDate
  2. Form warning (structural, day-of-week based) — detectStructuralSlotTournamentConflicts
*/

import { timeToMins } from "@/lib/utils/utils";
import { slotOccursOnDate } from "@/lib/schedule/scheduleHelpers";
import { recurringTournamentOccursOnDate } from "./tournamentHelpers";
import type { Class, Tournament, Room, ScheduleSlot, Enrollment, ResourceAssignment } from "@/types";

// Hebrew day names indexed by JS getDay() (0=Sunday)
const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export type ConflictType = "חדר" | "מדריך" | "תלמידים" | "ציוד";

function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return timeToMins(s1) < timeToMins(e2) && timeToMins(s2) < timeToMins(e1);
}

// Resolve the room name of a class slot by looking up its room_id
function slotRoomName(slot: ScheduleSlot, rooms: Room[]): string | null {
  if (!slot.room_id) return null;
  return rooms.find((r) => r.id === slot.room_id)?.name ?? null;
}

// ──────────────────────────────────────────────────────
// MODE 1: Exact-date conflict (used in the calendar)
// ──────────────────────────────────────────────────────

/**
 * Check all 4 conflict types between a class slot and a tournament on a specific date.
 * Returns an array of conflict labels found (empty = no conflict).
 */
export function detectSlotTournamentConflictsOnDate(
  slot: ScheduleSlot,
  date: string,
  classTeacherId: string,
  enrolledStudentIds: string[],
  classEquipment: ResourceAssignment[],
  tournament: Tournament,
  rooms: Room[]
): ConflictType[] {
  // Does the slot occur on this date?
  if (!slotOccursOnDate(slot, date)) return [];

  // Does the tournament occur on this date? Get its time window.
  let tourStart: string;
  let tourEnd: string;
  let tourRoom: string | null = null;

  if (tournament.is_recurring) {
    if (!recurringTournamentOccursOnDate(tournament, date)) return [];
    tourStart = tournament.recurring_start_time ?? "00:00";
    tourEnd = tournament.recurring_end_time ?? "01:00";
    tourRoom = tournament.room ?? null;
  } else {
    const round = (tournament.rounds ?? []).find((r) => r.date === date);
    if (!round) return [];
    tourStart = round.start_time;
    tourEnd = round.end_time;
    tourRoom = round.location ?? null;
  }

  // Do the times overlap?
  if (!timesOverlap(slot.start_time, slot.end_time, tourStart, tourEnd)) return [];

  const conflicts: ConflictType[] = [];

  // 1. Room conflict — both use the same named room
  const classRoom = slotRoomName(slot, rooms);
  if (classRoom && tourRoom && classRoom === tourRoom) {
    conflicts.push("חדר");
  }

  // 2. Teacher conflict — class instructor is also the tournament judge
  if (classTeacherId && classTeacherId === tournament.judge_id) {
    conflicts.push("מדריך");
  }

  // 3. Student conflicts — students enrolled in the class are also in the tournament
  const participantIds = tournament.participant_ids ?? [];
  if (enrolledStudentIds.length > 0 && participantIds.length > 0) {
    const shared = enrolledStudentIds.filter((id) => participantIds.includes(id));
    if (shared.length > 0) conflicts.push("תלמידים");
  }

  // 4. Equipment conflict — both use the same piece of equipment
  const tourEquipment = tournament.is_recurring
    ? (tournament.recurring_resource_assignments ?? [])
    : (tournament.resource_assignments ?? []);
  if (classEquipment.length > 0 && tourEquipment.length > 0) {
    const classResIds = new Set(classEquipment.map((a) => a.resource_id));
    if (tourEquipment.some((a) => classResIds.has(a.resource_id))) {
      conflicts.push("ציוד");
    }
  }

  return conflicts;
}

/**
 * Returns the Set of class IDs that have any cross-conflict with any tournament
 * on any of the given calendar dates.
 */
export function getClassIdsWithTournamentConflicts(
  classes: Class[],
  tournaments: Tournament[],
  rooms: Room[],
  enrollments: Enrollment[],
  dates: string[]
): Set<string> {
  const conflictIds = new Set<string>();

  for (const cls of classes) {
    if (conflictIds.has(cls.id)) continue; // already flagged

    const enrolledIds = enrollments
      .filter((e) => e.class_id === cls.id && e.status === "פעיל")
      .map((e) => e.student_id);

    outer: for (const slot of cls.slots ?? []) {
      for (const date of dates) {
        for (const tournament of tournaments) {
          const c = detectSlotTournamentConflictsOnDate(
            slot, date,
            cls.teacher_id, enrolledIds,
            cls.resource_assignments ?? [],
            tournament, rooms
          );
          if (c.length > 0) {
            conflictIds.add(cls.id);
            break outer;
          }
        }
      }
    }
  }

  return conflictIds;
}

/**
 * Returns the Set of tournament IDs that have any cross-conflict with any class
 * on any of the given calendar dates.
 */
export function getTournamentIdsWithClassConflicts(
  tournaments: Tournament[],
  classes: Class[],
  rooms: Room[],
  enrollments: Enrollment[],
  dates: string[]
): Set<string> {
  const conflictIds = new Set<string>();

  for (const tournament of tournaments) {
    if (conflictIds.has(tournament.id)) continue;

    outer: for (const cls of classes) {
      const enrolledIds = enrollments
        .filter((e) => e.class_id === cls.id && e.status === "פעיל")
        .map((e) => e.student_id);

      for (const slot of cls.slots ?? []) {
        for (const date of dates) {
          const c = detectSlotTournamentConflictsOnDate(
            slot, date,
            cls.teacher_id, enrolledIds,
            cls.resource_assignments ?? [],
            tournament, rooms
          );
          if (c.length > 0) {
            conflictIds.add(tournament.id);
            break outer;
          }
        }
      }
    }
  }

  return conflictIds;
}

// ──────────────────────────────────────────────────────
// MODE 2: Structural conflict (used in class form editor)
// Checks day-of-week + time + room/teacher — no specific date needed.
// ──────────────────────────────────────────────────────

/**
 * For a slot being edited in the form, find tournament conflicts by matching
 * day-of-week, time overlap, and room/teacher — without needing a specific date.
 * Returns the name of the first conflicting tournament + what types of conflict.
 */
export function findStructuralTournamentConflict(
  slot: ScheduleSlot,
  teacherId: string,
  allTournaments: Tournament[],
  rooms: Room[]
): { tournamentName: string; types: ConflictType[] } | null {
  const slotRoom = slotRoomName(slot, rooms);

  for (const t of allTournaments) {
    let tourDay: string | null = null;
    let tourStart: string;
    let tourEnd: string;
    let tourRoom: string | null = null;

    if (t.is_recurring && t.recurring_date) {
      // Derive the day-of-week from the recurring anchor date
      const [y, m, d] = t.recurring_date.split("-").map(Number);
      tourDay = HEBREW_DAYS[new Date(y, m - 1, d).getDay()];
      tourStart = t.recurring_start_time ?? "00:00";
      tourEnd = t.recurring_end_time ?? "01:00";
      tourRoom = t.room ?? null;
    } else {
      // Check any round that falls on the same day-of-week as the slot
      for (const round of t.rounds ?? []) {
        const [y, m, d] = round.date.split("-").map(Number);
        const roundDay = HEBREW_DAYS[new Date(y, m - 1, d).getDay()];
        if (roundDay !== slot.day) continue;
        tourDay = roundDay;
        tourStart = round.start_time;
        tourEnd = round.end_time;
        tourRoom = round.location ?? null;
        break;
      }
    }

    // No matching day-of-week
    if (!tourDay || tourDay !== slot.day) continue;

    // No time overlap
    if (!timesOverlap(slot.start_time, slot.end_time, tourStart!, tourEnd!)) continue;

    const types: ConflictType[] = [];

    if (slotRoom && tourRoom && slotRoom === tourRoom) types.push("חדר");
    if (teacherId && teacherId === t.judge_id) types.push("מדריך");

    if (types.length > 0) return { tournamentName: t.name, types };
  }

  return null;
}
