"use client";
import { useState, useMemo } from "react";
import PageShell from "@/components/shared/PageShell";
import CalendarGrid from "./CalendarGrid";
import MiniCalendar from "./MiniCalendar";
import ScheduleFilterBar, { type ActiveFilter, type FilterOption } from "./ScheduleFilterBar";
import ViewExistingClassDetailModal from "@/app/classes/ViewExistingClassDetailModal";
import ClassFormModal from "@/app/classes/ClassFormModal";
import TournamentDetailModal from "@/app/tournaments/TournamentDetailModal";
import TournamentFormModal from "@/app/tournaments/TournamentFormModal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { updateDocument, addDocument, deleteDocument } from "@/firebase/firestore";
import { getSlotsForDates } from "@/lib/scheduleHelpers";
import { getConflictingClassIds } from "@/lib/classHelpers";
import { getConflictingRoundIds, recurringTournamentOccursOnDate } from "@/lib/tournamentHelpers";
import {
  getClassIdsWithTournamentConflicts,
  getTournamentIdsWithClassConflicts,
} from "@/lib/crossConflictHelpers";
import type { Class, Tournament } from "@/lib/types";
import type { DayData } from "./calendarTypes";

// --- helpers ---

// Use local date parts — toISOString() returns UTC and shifts the date in UTC+2/3 (Israel)
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Returns the Set of date strings for the whole week that contains `date` (Sun–Sat) */
function weekOf(date: Date): Set<string> {
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - date.getDay()); // go to Sunday
  sunday.setHours(0, 0, 0, 0);
  const set = new Set<string>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    set.add(toDateStr(d));
  }
  return set;
}

// --- page ---

export default function SchedulePage() {
  const { classes, teachers, rooms, physicalEquipment, students, enrollments, settings, tournaments } = useData();

  // Selected dates — default: current week (Sun–Sat)
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => weekOf(new Date()));
  const [detailClass, setDetailClass] = useState<Class | null>(null);
  const [detailTournament, setDetailTournament] = useState<Tournament | null>(null);
  const [editTournament, setEditTournament] = useState<Tournament | null>(null);
  const [editTarget, setEditTarget] = useState<Class | null>(null);
  const [saving, setSaving] = useState(false);
  // Active filter — null means "show all"
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);
  const { showToast } = useToast();

  const todayStr = toDateStr(new Date());

  // Replace the selection with a dragged consecutive range (always at least 1 date)
  const selectRange = (dates: string[]) => {
    if (dates.length > 0) setSelectedDates(new Set(dates));
  };

  // Conflict detection — class-vs-class + class-vs-tournament
  const conflictIds = useMemo(() => {
    const ids = new Set<string>();

    // Class vs class (room + time same day-of-week)
    for (const cls of classes) {
      if (getConflictingClassIds(cls, classes).length > 0) ids.add(cls.id);
    }

    // Class vs tournament (room, teacher, students, equipment) on selected dates
    const crossConflicts = getClassIdsWithTournamentConflicts(
      classes, tournaments, rooms, enrollments, Array.from(selectedDates)
    );
    crossConflicts.forEach((id) => ids.add(id));

    return ids;
  }, [classes, tournaments, rooms, enrollments, selectedDates]);

  // Fetch slots for exactly the selected dates
  const slots = useMemo(
    () => getSlotsForDates(classes, Array.from(selectedDates)),
    [classes, selectedDates]
  );

  // Tournament IDs that conflict with any class on selected dates (cross-entity)
  const tournamentCrossConflictIds = useMemo(
    () => getTournamentIdsWithClassConflicts(
      tournaments, classes, rooms, enrollments, Array.from(selectedDates)
    ),
    [tournaments, classes, rooms, enrollments, selectedDates]
  );

  // Pre-compute conflicting round IDs for all tournaments (round-vs-class + round-vs-round)
  const tournamentConflictMap = useMemo(() => {
    const map = new Map<string, Set<string>>(); // tournamentId → Set<roundId>
    for (const t of tournaments) {
      map.set(t.id, getConflictingRoundIds(t, classes, tournaments));
    }
    return map;
  }, [tournaments, classes]);

  // ---- Filter option lists (for the filter bar dropdowns) ----

  const studentOptions: FilterOption[] = useMemo(() =>
    students.map((s) => ({ id: s.id, label: `${s.first_name} ${s.last_name}` })),
    [students]
  );

  const teacherOptions: FilterOption[] = useMemo(() =>
    teachers.map((t) => ({ id: t.id, label: `${t.first_name} ${t.last_name}` })),
    [teachers]
  );

  const roomOptions: FilterOption[] = useMemo(() =>
    rooms.map((r) => ({ id: r.id, label: r.name })),
    [rooms]
  );

  const classOptions: FilterOption[] = useMemo(() =>
    classes.map((c) => ({ id: c.id, label: c.name })),
    [classes]
  );

  const tournamentOptions: FilterOption[] = useMemo(() =>
    tournaments.map((t) => ({ id: t.id, label: t.name })),
    [tournaments]
  );

  // ---- Classes that match the active filter ----
  // Returns a Set of class IDs that should be visible.
  // null = show all, empty Set = show none.
  const visibleClassIds: Set<string> | null = useMemo(() => {
    if (!activeFilter) return null;

    if (activeFilter.category === "class") {
      return new Set([activeFilter.option.id]);
    }
    if (activeFilter.category === "teacher") {
      return new Set(classes.filter((c) => c.teacher_id === activeFilter.option.id).map((c) => c.id));
    }
    if (activeFilter.category === "room") {
      return new Set(
        classes
          .filter((c) => c.slots.some((s) => s.room_id === activeFilter.option.id))
          .map((c) => c.id)
      );
    }
    if (activeFilter.category === "student") {
      return new Set(
        enrollments
          .filter((e) => e.student_id === activeFilter.option.id && e.status === "פעיל")
          .map((e) => e.class_id)
      );
    }
    // tournament filter — hide all classes, show only that tournament
    if (activeFilter.category === "tournament") {
      return new Set(); // empty = no classes shown
    }

    return null;
  }, [activeFilter, classes, enrollments]);

  // ---- Tournaments that match the active filter ----
  // null = show all, empty Set = show none, Set with IDs = show only those.
  const visibleTournamentIds: Set<string> | null = useMemo(() => {
    if (!activeFilter) return null;

    if (activeFilter.category === "tournament") {
      // show only the selected tournament
      return new Set([activeFilter.option.id]);
    }

    if (activeFilter.category === "student") {
      // show tournaments the student participates in
      return new Set(
        tournaments.filter((t) => t.participant_ids.includes(activeFilter.option.id)).map((t) => t.id)
      );
    }

    if (activeFilter.category === "teacher") {
      // show tournaments where this teacher is the judge/arbiter
      return new Set(
        tournaments.filter((t) => t.judge_id === activeFilter.option.id).map((t) => t.id)
      );
    }

    if (activeFilter.category === "room") {
      // tournament.room is used for recurring tournaments; round.location for per-round ones.
      // Both store the room name as a free-text string (not a room_id).
      const roomName = rooms.find((r) => r.id === activeFilter.option.id)?.name ?? "";
      return new Set(
        tournaments
          .filter((t) =>
            t.room === roomName ||
            (t.rounds ?? []).some((r) => r.location === roomName)
          )
          .map((t) => t.id)
      );
    }

    // class filter — tournaments are unrelated to a specific class
    return new Set();
  }, [activeFilter, tournaments, rooms]);

  // Build DayData for the grid — sorted Sun→Sat; dir="rtl" on the grid puts Sunday on the right naturally
  const days: DayData[] = useMemo(() => {
    const sortedDates = Array.from(selectedDates).sort();
    return sortedDates.map((dateStr) => {
      const date = new Date(dateStr + "T00:00:00");

      // Class events for this date — apply visibleClassIds filter if set
      const events = slots
        .filter((s) => s.date === dateStr && (visibleClassIds === null || visibleClassIds.has(s.classId)))
        .map(({ classId, slot }) => {
          const classItem = classes.find((c) => c.id === classId);
          if (!classItem) return null;
          return {
            classItem,
            slot,
            teacher: teachers.find((t) => t.id === classItem.teacher_id),
            room: rooms.find((r) => r.id === slot.room_id),
            enrollCount: enrollments.filter(
              (e) => e.class_id === classId && e.status === "פעיל"
            ).length,
            hasConflict: conflictIds.has(classId),
          };
        })
        .filter(Boolean) as DayData["events"];

      // Tournament round events for this date — filtered by visibleTournamentIds
      const tournamentEvents: DayData["tournamentEvents"] = [];
      for (const t of tournaments) {
        // null = show all; empty set = show none; set with ids = show only those
        if (visibleTournamentIds !== null && !visibleTournamentIds.has(t.id)) {
          continue;
        }

        if (t.is_recurring) {
          // Recurring tournament: no rounds — show on every matching weekday
          if (recurringTournamentOccursOnDate(t, dateStr)) {
            // Build a synthetic round from recurring fields for rendering
            const syntheticRound = {
              id: `recurring-${t.id}-${dateStr}`,
              round_number: 0, // sentinel: means "recurring occurrence"
              date: dateStr,
              start_time: t.recurring_start_time ?? "00:00",
              end_time: t.recurring_end_time ?? "01:00",
              location: t.room,
            };
            tournamentEvents.push({ tournament: t, round: syntheticRound, hasConflict: tournamentCrossConflictIds.has(t.id), isRecurring: true });
          }
        } else {
          // Regular tournament with fixed rounds
          const conflictRounds = tournamentConflictMap.get(t.id) ?? new Set<string>();
          for (const round of t.rounds ?? []) {
            if (round.date === dateStr) {
              tournamentEvents.push({
                tournament: t,
                round,
                // Flag if the round conflicts with another round OR if the tournament conflicts with any class
                hasConflict: conflictRounds.has(round.id) || tournamentCrossConflictIds.has(t.id),
              });
            }
          }
        }
      }

      return { date, dateStr, isToday: dateStr === todayStr, events, tournamentEvents };
    });
  }, [selectedDates, slots, classes, teachers, rooms, enrollments, conflictIds, todayStr, tournaments, tournamentConflictMap, tournamentCrossConflictIds, visibleClassIds, visibleTournamentIds]);

  const totalEvents = days.reduce((n, d) => n + d.events.length + (d.tournamentEvents?.length ?? 0), 0);

  return (
    <PageShell title="לוח זמנים">

      {/* Filter bar */}
      <ScheduleFilterBar
        studentOptions={studentOptions}
        teacherOptions={teacherOptions}
        roomOptions={roomOptions}
        classOptions={classOptions}
        tournamentOptions={tournamentOptions}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Summary line */}
      <p className="text-xs text-gray-400 mb-3 text-right">
        {selectedDates.size === 1
          ? `תאריך אחד נבחר`
          : `${selectedDates.size} ימים נבחרו`}
        {" • "}
        {totalEvents} מפגשים
      </p>

      {/* Two-column layout: mini calendar (right) + grid (left) */}
      <div className="flex gap-4 items-start" dir="rtl">

        {/* Mini calendar sidebar */}
        <MiniCalendar
          selectedDates={selectedDates}
          onSelectRange={selectRange}
        />

        {/* Main calendar grid — takes remaining space */}
        <div className="flex-1 min-w-0">
          <CalendarGrid days={days} onEventClick={setDetailClass} onTournamentClick={setDetailTournament} />
        </div>

      </div>

      {/* Class detail modal */}
      {detailClass && (
        <ViewExistingClassDetailModal
          classItem={detailClass}
          teachers={teachers}
          rooms={rooms}
          physicalEquipment={physicalEquipment}
          students={students}
          enrollments={enrollments}
          allClasses={classes}
          allTournaments={tournaments}
          onClose={() => setDetailClass(null)}
          onEdit={(c) => { setEditTarget(c); setDetailClass(null); }}
        />
      )}

      {/* Tournament detail modal — opened by clicking a tournament round in the calendar */}
      {detailTournament && (
        <TournamentDetailModal
          tournament={detailTournament}
          allStudents={students}
          allTeachers={teachers}
          physicalEquipment={physicalEquipment}
          allClasses={classes}
          allTournaments={tournaments}
          onEdit={() => {
            setEditTournament(detailTournament);
            setDetailTournament(null);
          }}
          onDelete={async () => {
            try {
              await deleteDocument("tournaments", detailTournament.id);
              showToast("התחרות נמחקה בהצלחה", "success");
            } catch {
              showToast("שגיאה במחיקה, נסה שוב", "error");
            }
            setDetailTournament(null);
          }}
          onClose={() => setDetailTournament(null)}
        />
      )}

      {/* Tournament edit modal */}
      {editTournament && (
        <TournamentFormModal
          mode="edit"
          tournament={editTournament}
          allStudents={students}
          allClasses={classes}
          allTournaments={tournaments}
          allRooms={rooms}
          allTeachers={teachers}
          physicalEquipment={physicalEquipment}
          saving={saving}
          onClose={() => setEditTournament(null)}
          onSave={async (data) => {
            setSaving(true);
            try {
              await updateDocument("tournaments", editTournament.id, data);
              showToast("התחרות עודכנה בהצלחה", "success");
              setEditTournament(null);
            } catch { showToast("שגיאה בשמירה, נסה שוב", "error"); }
            finally { setSaving(false); }
          }}
        />
      )}

      {/* Edit class modal — נפתח בלחיצה על "עריכה" בחלון הפרטים */}
      {editTarget && (
        <ClassFormModal
          mode="edit"
          classItem={editTarget}
          teachers={teachers}
          rooms={rooms}
          physicalEquipment={physicalEquipment}
          students={students}
          enrollments={enrollments}
          allClasses={classes}
          allTournaments={tournaments}
          settings={settings}
          saving={saving}
          onClose={() => setEditTarget(null)}
          onSave={async (form, enrollmentChanges) => {
            if (!form.name.trim()) { showToast("שם החוג הוא שדה חובה", "error"); return; }
            if (!form.teacher_id) { showToast("יש לבחור מדריך", "error"); return; }
            setSaving(true);
            try {
              await updateDocument("classes", editTarget.id, form);
              const today = new Date().toISOString().slice(0, 10);
              await Promise.all(enrollmentChanges.toAdd.map((sid) =>
                addDocument("enrollments", { student_id: sid, class_id: editTarget.id, enrolled_at: today, status: "פעיל" })
              ));
              await Promise.all(enrollmentChanges.toRemove.map((eid) =>
                deleteDocument("enrollments", eid)
              ));
              showToast("החוג עודכן בהצלחה", "success");
              setEditTarget(null);
            } catch { showToast("שגיאה בשמירה, נסה שוב", "error"); }
            finally { setSaving(false); }
          }}
        />
      )}
    </PageShell>
  );
}
