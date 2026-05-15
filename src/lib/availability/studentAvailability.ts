/*
  STUDENT AVAILABILITY — pure functions, no Firebase, no UI.

  Given a date + time window, returns which students are free vs. busy.
  A student is "busy" if:
    - They are enrolled in a class with a slot that occurs on the date and overlaps the time range
    - They are registered in a tournament with a round (or recurring date) that overlaps the window
*/

import { timeToMins } from "@/lib/utils/utils";
import { slotOccursOnDate } from "@/lib/schedule/scheduleHelpers";
import type { Student, Class, Tournament, Enrollment } from "@/types";

export interface StudentConflict {
  label: string;       // e.g. "חוג שחמט" or "תחרות קיץ"
  type: "חוג" | "תחרות";
  start_time: string;
  end_time: string;
}

export interface StudentAvailabilityResult {
  student: Student;
  conflicts: StudentConflict[];
}

export interface StudentAvailabilityReport {
  free: Student[];
  busy: StudentAvailabilityResult[];
}

function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return timeToMins(s1) < timeToMins(e2) && timeToMins(s2) < timeToMins(e1);
}

export function checkStudentAvailability(
  students: Student[],
  enrollments: Enrollment[],
  classes: Class[],
  tournaments: Tournament[],
  date: string,      // YYYY-MM-DD
  startTime: string, // HH:MM
  endTime: string,   // HH:MM
): StudentAvailabilityReport {
  const free: Student[] = [];
  const busy: StudentAvailabilityResult[] = [];

  for (const student of students) {
    const conflicts: StudentConflict[] = [];

    // ── חוגים ──
    const myEnrollments = enrollments.filter(
      (e) => e.student_id === student.id && e.status === "פעיל"
    );
    for (const enr of myEnrollments) {
      const cls = classes.find((c) => c.id === enr.class_id);
      if (!cls || cls.status === "בוטל" || cls.status === "הסתיים") continue;
      // Skip cancelled dates
      if ((cls.cancelled_dates ?? []).includes(date)) continue;
      for (const slot of cls.slots ?? []) {
        if (!slotOccursOnDate(slot, date)) continue;
        if (timesOverlap(slot.start_time, slot.end_time, startTime, endTime)) {
          conflicts.push({ label: cls.name, type: "חוג", start_time: slot.start_time, end_time: slot.end_time });
        }
      }
    }

    // ── תחרויות ──
    const myTournaments = tournaments.filter(
      (t) => t.participant_ids.includes(student.id) && t.status !== "בוטל"
    );
    for (const t of myTournaments) {
      if ((t.cancelled_dates ?? []).includes(date)) continue;
      if (t.is_recurring) {
        if (t.recurring_date === date) {
          const s = t.recurring_start_time ?? "";
          const e = t.recurring_end_time ?? "";
          if (s && e && timesOverlap(s, e, startTime, endTime)) {
            conflicts.push({ label: t.name, type: "תחרות", start_time: s, end_time: e });
          }
        }
      } else {
        for (const round of t.rounds ?? []) {
          if (round.date === date && timesOverlap(round.start_time, round.end_time, startTime, endTime)) {
            conflicts.push({ label: `${t.name} (סיבוב ${round.round_number})`, type: "תחרות", start_time: round.start_time, end_time: round.end_time });
          }
        }
      }
    }

    if (conflicts.length === 0) {
      free.push(student);
    } else {
      busy.push({ student, conflicts });
    }
  }

  return { free, busy };
}
