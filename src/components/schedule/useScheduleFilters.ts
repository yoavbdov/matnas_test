// Hook: builds filter option lists and computes which entities are visible
// based on the user's active filter selection

import { useState, useMemo } from "react";
import type { Class, Tournament, Enrollment, Room, Student, Teacher } from "@/lib/types";
import type { ActiveFilter, FilterOption } from "./ScheduleFilterBar";

interface Params {
  classes: Class[];
  tournaments: Tournament[];
  enrollments: Enrollment[];
  rooms: Room[];
  students: Student[];
  teachers: Teacher[];
}

export function useScheduleFilters({
  classes, tournaments, enrollments, rooms, students, teachers,
}: Params) {
  // Owns the active filter state — null means "show all"
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);
  // --- Dropdown option lists ---

  const studentOptions: FilterOption[] = useMemo(
    () => students.map((s) => ({ id: s.id, label: `${s.first_name} ${s.last_name}` })),
    [students],
  );

  const teacherOptions: FilterOption[] = useMemo(
    () => teachers.map((t) => ({ id: t.id, label: `${t.first_name} ${t.last_name}` })),
    [teachers],
  );

  const roomOptions: FilterOption[] = useMemo(
    () => rooms.map((r) => ({ id: r.id, label: r.name })),
    [rooms],
  );

  const classOptions: FilterOption[] = useMemo(
    () => classes.map((c) => ({ id: c.id, label: c.name })),
    [classes],
  );

  const tournamentOptions: FilterOption[] = useMemo(
    () => tournaments.map((t) => ({ id: t.id, label: t.name })),
    [tournaments],
  );

  // --- Visibility sets ---
  // null = show all; empty Set = show none; Set with IDs = show only those

  // Which class IDs should appear in the calendar
  const visibleClassIds: Set<string> | null = useMemo(() => {
    if (!activeFilter) return null;

    if (activeFilter.category === "class") {
      return new Set([activeFilter.option.id]);
    }
    if (activeFilter.category === "teacher") {
      return new Set(
        classes.filter((c) => c.teacher_id === activeFilter.option.id).map((c) => c.id),
      );
    }
    if (activeFilter.category === "room") {
      return new Set(
        classes
          .filter((c) => c.slots.some((s) => s.room_id === activeFilter.option.id))
          .map((c) => c.id),
      );
    }
    if (activeFilter.category === "student") {
      return new Set(
        enrollments
          .filter((e) => e.student_id === activeFilter.option.id && e.status === "פעיל")
          .map((e) => e.class_id),
      );
    }
    // tournament filter → hide all classes, show only that tournament
    if (activeFilter.category === "tournament") return new Set();

    return null;
  }, [activeFilter, classes, enrollments]);

  // Which tournament IDs should appear in the calendar
  const visibleTournamentIds: Set<string> | null = useMemo(() => {
    if (!activeFilter) return null;

    if (activeFilter.category === "tournament") {
      return new Set([activeFilter.option.id]);
    }
    if (activeFilter.category === "student") {
      return new Set(
        tournaments
          .filter((t) => t.participant_ids.includes(activeFilter.option.id))
          .map((t) => t.id),
      );
    }
    if (activeFilter.category === "teacher") {
      return new Set(
        tournaments.filter((t) => t.judge_id === activeFilter.option.id).map((t) => t.id),
      );
    }
    if (activeFilter.category === "room") {
      // Tournaments store the room as a free-text name, not an ID
      const roomName = rooms.find((r) => r.id === activeFilter.option.id)?.name ?? "";
      return new Set(
        tournaments
          .filter(
            (t) =>
              t.room === roomName ||
              (t.rounds ?? []).some((r) => r.location === roomName),
          )
          .map((t) => t.id),
      );
    }
    // class filter → tournaments are unrelated to a specific class
    return new Set();
  }, [activeFilter, tournaments, rooms]);

  return {
    // Active filter state
    activeFilter, setActiveFilter,
    // Dropdown option lists
    studentOptions,
    teacherOptions,
    roomOptions,
    classOptions,
    tournamentOptions,
    // Visibility sets for the calendar
    visibleClassIds,
    visibleTournamentIds,
  };
}
