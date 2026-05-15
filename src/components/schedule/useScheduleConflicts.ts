// Hook: detects scheduling conflicts between classes, tournaments, and events
// Returns sets of conflicting IDs so the calendar can highlight them

import { useMemo } from "react";
import { getConflictingClassIds, getClassIdsConflictingWithEvents } from "@/lib/schedule/classHelpers";
import { getConflictingRoundIds, recurringTournamentOccursOnDate } from "@/lib/conflicts/tournamentHelpers";
import {
  getClassIdsWithTournamentConflicts,
  getTournamentIdsWithClassConflicts,
} from "@/lib/conflicts/crossConflictHelpers";
import type { Class, Tournament, Event, Enrollment, Room } from "@/types";

interface Params {
  classes: Class[];
  tournaments: Tournament[];
  events: Event[];
  rooms: Room[];
  enrollments: Enrollment[];
  selectedDates: Set<string>;
}

export function useScheduleConflicts({
  classes, tournaments, events, rooms, enrollments, selectedDates,
}: Params) {
  // Class IDs that conflict with another class, tournament, or event
  const conflictIds = useMemo(() => {
    const ids = new Set<string>();

    // Class vs class (same room + time on same weekday)
    for (const cls of classes) {
      if (getConflictingClassIds(cls, classes).length > 0) ids.add(cls.id);
    }

    // Class vs tournament on selected dates
    getClassIdsWithTournamentConflicts(
      classes, tournaments, rooms, enrollments, Array.from(selectedDates),
    ).forEach((id) => ids.add(id));

    // Class vs event (same room + time + weekday)
    getClassIdsConflictingWithEvents(classes, events, rooms)
      .forEach((id) => ids.add(id));

    return ids;
  }, [classes, tournaments, rooms, enrollments, selectedDates, events]);

  // Tournament IDs that conflict with a class on selected dates
  const tournamentCrossConflictIds = useMemo(
    () => getTournamentIdsWithClassConflicts(
      tournaments, classes, rooms, enrollments, Array.from(selectedDates),
    ),
    [tournaments, classes, rooms, enrollments, selectedDates],
  );

  // Per-tournament map of conflicting round IDs (round vs round / round vs class / round vs event)
  const tournamentConflictMap = useMemo(() => {
    const map = new Map<string, Set<string>>(); // tournamentId → Set<roundId>
    for (const t of tournaments) {
      map.set(t.id, getConflictingRoundIds(t, classes, tournaments, events));
    }
    return map;
  }, [tournaments, classes, events]);

  return { conflictIds, tournamentCrossConflictIds, tournamentConflictMap };
}
