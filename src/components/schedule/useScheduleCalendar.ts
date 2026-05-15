// Hook: owns selectedDates state + computes conflicts + builds DayData
// These three concerns share state (selectedDates) so they live together.

import { useState, useMemo } from "react";
import { getSlotsForDates, slotOccursOnDate } from "@/lib/scheduleHelpers";
import { getConflictingClassIds, getClassIdsConflictingWithEvents } from "@/lib/classHelpers";
import { getConflictingRoundIds, recurringTournamentOccursOnDate } from "@/lib/tournamentHelpers";
import {
  getClassIdsWithTournamentConflicts,
  getTournamentIdsWithClassConflicts,
} from "@/lib/crossConflictHelpers";
import { eventOccursOnDate } from "@/lib/eventHelpers";
import { timesOverlapLocal, toDateStr, weekOf } from "./schedulePageUtils";
import type { Class, Tournament, Event, Enrollment, Room, Teacher } from "@/types";
import type { DayData } from "./calendarTypes";

interface Params {
  classes: Class[];
  tournaments: Tournament[];
  events: Event[];
  enrollments: Enrollment[];
  rooms: Room[];
  teachers: Teacher[];
  todayStr: string;
  visibleClassIds: Set<string> | null;
  visibleTournamentIds: Set<string> | null;
}

// Check if a recurring tournament conflicts with another on a specific date.
// Non-recurring: only the round on that exact date can conflict.
function recurringHasConflictOnDate(t: Tournament, dateStr: string, all: Tournament[]): boolean {
  if (!t.room || !t.recurring_start_time || !t.recurring_end_time) return false;
  for (const other of all) {
    if (other.id === t.id || other.status === "בוטל") continue;
    if (other.is_recurring) {
      if (!recurringTournamentOccursOnDate(other, dateStr)) continue;
      if (other.room !== t.room) continue;
      if (timesOverlapLocal(
        t.recurring_start_time, t.recurring_end_time,
        other.recurring_start_time ?? "", other.recurring_end_time ?? "",
      )) return true;
    } else {
      for (const round of other.rounds ?? []) {
        if (round.date !== dateStr) continue;
        const roundRoom = round.location || other.room;
        if (roundRoom && roundRoom !== t.room) continue;
        if (timesOverlapLocal(
          t.recurring_start_time, t.recurring_end_time,
          round.start_time, round.end_time,
        )) return true;
      }
    }
  }
  return false;
}

export function useScheduleCalendar({
  classes, tournaments, events, enrollments, rooms, teachers,
  todayStr, visibleClassIds, visibleTournamentIds,
}: Params) {
  // ── Selected dates — default: current week (Sun–Sat) ──
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => weekOf(new Date()));

  function selectRange(dates: string[]) {
    if (dates.length > 0) setSelectedDates(new Set(dates));
  }

  // ── Conflict detection ──

  // Class IDs that conflict with another class, tournament, or event
  const conflictIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cls of classes) {
      if (getConflictingClassIds(cls, classes).length > 0) ids.add(cls.id);
    }
    getClassIdsWithTournamentConflicts(
      classes, tournaments, rooms, enrollments, Array.from(selectedDates),
    ).forEach((id) => ids.add(id));
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

  // Per-tournament map of conflicting round IDs
  const tournamentConflictMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const t of tournaments) {
      map.set(t.id, getConflictingRoundIds(t, classes, tournaments, events));
    }
    return map;
  }, [tournaments, classes, events]);

  // ── Slots for the selected dates ──
  const slots = useMemo(
    () => getSlotsForDates(classes, Array.from(selectedDates)),
    [classes, selectedDates],
  );

  // ── Build DayData for the calendar grid ──
  const days: DayData[] = useMemo(() => {
    const sortedDates = Array.from(selectedDates).sort();

    return sortedDates.map((dateStr) => {
      const date = new Date(dateStr + "T00:00:00");

      // Class events for this day
      const classEvents = slots
        .filter((s) => s.date === dateStr && (visibleClassIds === null || visibleClassIds.has(s.classId)))
        .map(({ classId, slot }) => {
          const classItem = classes.find((c) => c.id === classId);
          if (!classItem) return null;
          return {
            classItem,
            slot,
            teacher: teachers.find((t) => t.id === classItem.teacher_id),
            room: rooms.find((r) => r.id === slot.room_id),
            enrollCount: enrollments.filter((e) => e.class_id === classId && e.status === "פעיל").length,
            hasConflict: conflictIds.has(classId),
          };
        })
        .filter(Boolean) as DayData["events"];

      // Tournament events for this day
      const tournamentEvents: DayData["tournamentEvents"] = [];
      for (const t of tournaments) {
        if (visibleTournamentIds !== null && !visibleTournamentIds.has(t.id)) continue;
        if (t.is_recurring) {
          if (recurringTournamentOccursOnDate(t, dateStr)) {
            const syntheticRound = {
              id: `recurring-${t.id}-${dateStr}`,
              round_number: 0,
              date: dateStr,
              start_time: t.recurring_start_time ?? "00:00",
              end_time: t.recurring_end_time ?? "01:00",
              location: t.room,
            };
            tournamentEvents.push({
              tournament: t,
              round: syntheticRound,
              hasConflict:
                tournamentCrossConflictIds.has(t.id) ||
                recurringHasConflictOnDate(t, dateStr, tournaments),
              isRecurring: true,
            });
          }
        } else {
          const conflictRounds = tournamentConflictMap.get(t.id) ?? new Set<string>();
          for (const round of t.rounds ?? []) {
            if (round.date === dateStr) {
              tournamentEvents.push({
                tournament: t,
                round,
                hasConflict: conflictRounds.has(round.id) || tournamentCrossConflictIds.has(t.id),
              });
            }
          }
        }
      }

      // General events for this day
      const eventItems = events
        .filter((ev) => eventOccursOnDate(ev, dateStr))
        .map((ev) => {
          const conflictsWithClass = classes.some((cls) =>
            (cls.slots ?? []).some((slot) => {
              if (rooms.find((r) => r.id === slot.room_id)?.name !== ev.room) return false;
              if (!slotOccursOnDate(slot, dateStr)) return false;
              return timesOverlapLocal(ev.start_time, ev.end_time, slot.start_time, slot.end_time);
            }),
          );
          const conflictsWithTournament = tournaments.some((t) => {
            if (t.status === "בוטל" || t.room !== ev.room) return false;
            if (t.is_recurring) {
              return (
                recurringTournamentOccursOnDate(t, dateStr) &&
                timesOverlapLocal(ev.start_time, ev.end_time, t.recurring_start_time ?? "", t.recurring_end_time ?? "")
              );
            }
            return (t.rounds ?? []).some(
              (r) => r.date === dateStr && timesOverlapLocal(ev.start_time, ev.end_time, r.start_time, r.end_time),
            );
          });
          const conflictsWithEvent = events.some((other) => {
            if (other.id === ev.id || other.room !== ev.room) return false;
            if (!eventOccursOnDate(other, dateStr)) return false;
            return timesOverlapLocal(ev.start_time, ev.end_time, other.start_time, other.end_time);
          });
          return { event: ev, hasConflict: conflictsWithClass || conflictsWithTournament || conflictsWithEvent };
        });

      return { date, dateStr, isToday: dateStr === todayStr, events: classEvents, tournamentEvents, eventItems };
    });
  }, [
    selectedDates, slots, classes, teachers, rooms, enrollments, conflictIds, todayStr,
    tournaments, tournamentConflictMap, tournamentCrossConflictIds,
    visibleClassIds, visibleTournamentIds, events,
  ]);

  return { selectedDates, selectRange, days };
}
