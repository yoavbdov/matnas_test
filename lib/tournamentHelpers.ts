/*
  TOURNAMENT HELPERS — pure functions, no Firebase, no UI.
  Handles conflict detection between tournament rounds, classes, and other tournaments.
*/

import { timeToMins } from "./utils";
import { slotOccursOnDate } from "./scheduleHelpers";
import type { Tournament, TournamentRound, Class } from "./types";

/** Check if two time ranges overlap (exclusive boundaries) */
function timesOverlap(
  startA: string, endA: string,
  startB: string, endB: string
): boolean {
  const a1 = timeToMins(startA);
  const a2 = timeToMins(endA);
  const b1 = timeToMins(startB);
  const b2 = timeToMins(endB);
  return a1 < b2 && b1 < a2;
}

/**
 * Returns true if a tournament round conflicts with any class slot on that date.
 * A conflict means: the class has a slot that occurs on the round's date AND the times overlap.
 */
export function roundConflictsWithClasses(
  round: TournamentRound,
  allClasses: Class[]
): boolean {
  for (const cls of allClasses) {
    for (const slot of cls.slots ?? []) {
      // Does this slot recur on the round's date?
      if (!slotOccursOnDate(slot, round.date)) continue;
      if (timesOverlap(round.start_time, round.end_time, slot.start_time, slot.end_time)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Returns true if a round conflicts with any round in other tournaments.
 * ignoreTournamentId — skip the tournament being edited (so it doesn't conflict with itself).
 */
export function roundConflictsWithTournaments(
  round: TournamentRound,
  allTournaments: Tournament[],
  ignoreTournamentId?: string
): boolean {
  for (const t of allTournaments) {
    if (t.id === ignoreTournamentId) continue;
    for (const other of t.rounds ?? []) {
      if (other.date !== round.date) continue;
      if (timesOverlap(round.start_time, round.end_time, other.start_time, other.end_time)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * For a given tournament, returns the set of round IDs that have any conflict
 * (either with a class or with another tournament round).
 */
export function getConflictingRoundIds(
  tournament: Tournament,
  allClasses: Class[],
  allTournaments: Tournament[]
): Set<string> {
  const conflictIds = new Set<string>();
  for (const round of tournament.rounds ?? []) {
    const classConflict = roundConflictsWithClasses(round, allClasses);
    const tournamentConflict = roundConflictsWithTournaments(round, allTournaments, tournament.id);
    if (classConflict || tournamentConflict) {
      conflictIds.add(round.id);
    }
  }
  return conflictIds;
}

/**
 * Returns true if a recurring tournament (is_recurring=true) should appear on a given date.
 * Recurrence rule: weekly, every 7 days, starting from recurring_date.
 * The tournament is shown on any date that is >= recurring_date AND shares the same day-of-week.
 */
export function recurringTournamentOccursOnDate(
  tournament: Tournament,
  dateStr: string
): boolean {
  if (!tournament.is_recurring || !tournament.recurring_date) return false;

  const [ty, tm, td] = tournament.recurring_date.split("-").map(Number);
  const start = new Date(ty, tm - 1, td);

  const [dy, dm, dd] = dateStr.split("-").map(Number);
  const target = new Date(dy, dm - 1, dd);

  if (target < start) return false;

  // Must fall on the same day-of-week as the anchor date
  return target.getDay() === start.getDay();
}

/**
 * Format a Date object as YYYY-MM-DD using LOCAL time (not UTC).
 * Using toISOString() would give UTC, which shifts the date back 1 day in UTC+2/+3 (Israel).
 */
function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Compute tournament status automatically from dates (no manual input needed).
 *
 * Rounds tournament:
 *   - מתוכנן  — first round hasn't started yet
 *   - פעיל    — first round started, last round not yet finished
 *   - הסתיים  — last round date is in the past
 *
 * Recurring tournament (no rounds):
 *   - מתוכנן  — recurring_date is in the future (first occurrence hasn't happened)
 *   - פעיל    — recurring_date is today or past (tournament is ongoing)
 *   — never reaches הסתיים (recurring = indefinite)
 */
export function computeTournamentStatus(t: Tournament): Tournament["status"] {
  // Local YYYY-MM-DD today string (avoids UTC shift)
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  if (t.is_recurring) {
    if (!t.recurring_date) return "מתוכנן";
    return t.recurring_date <= today ? "פעיל" : "מתוכנן";
  }

  // Rounds tournament — look at sorted dates only
  const dates = (t.rounds ?? []).map((r) => r.date).filter(Boolean).sort();
  if (dates.length === 0) return "מתוכנן";

  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  if (firstDate > today) return "מתוכנן";
  if (lastDate < today) return "הסתיים";
  return "פעיל";
}

/**
 * Auto-fill rounds with 1-week intervals starting from a given round index.
 * Rounds before startFromIndex are left untouched.
 * The anchor round (startFromIndex) keeps its existing date and sets the baseline.
 *
 * @param rounds          All tournament rounds
 * @param anchorDate      Date of the anchor round (YYYY-MM-DD)
 * @param startTime       Start time to apply to all filled rounds
 * @param endTime         End time to apply to all filled rounds
 * @param location        If provided, copy to all filled rounds
 * @param startFromIndex  0-based index of the first round to fill (default: 0)
 */
export function autoFillRoundDates(
  rounds: TournamentRound[],
  anchorDate: string,
  startTime: string,
  endTime: string,
  location?: string,
  startFromIndex: number = 0
): TournamentRound[] {
  return rounds.map((round, i) => {
    // Leave rounds before the anchor untouched
    if (i < startFromIndex) return round;

    const weeksOffset = i - startFromIndex;
    // Use noon to avoid DST edge-case where adding days crosses midnight
    const d = new Date(anchorDate + "T12:00:00");
    d.setDate(d.getDate() + weeksOffset * 7);
    const dateStr = toLocalDateString(d);

    return {
      ...round,
      date: dateStr,
      start_time: startTime || round.start_time,
      end_time: endTime || round.end_time,
      ...(location !== undefined ? { location } : {}),
    };
  });
}
