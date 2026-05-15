/*
  TEACHER AVAILABILITY — pure functions, no Firebase, no UI.

  Given a date + time window, returns which teachers are free vs. busy.
  A teacher is "busy" if any of their active classes has a slot that:
    1. Occurs on the given date (respects recurrence pattern)
    2. Overlaps with the requested time range
*/

import { timeToMins } from "./utils";
import { slotOccursOnDate } from "./scheduleHelpers";
import type { Teacher, Class } from "@/types";

export interface TeacherAvailabilityResult {
  teacher: Teacher;
  // The class(es) that block this teacher during the requested window
  conflictingClasses: { className: string; start_time: string; end_time: string }[];
}

export interface AvailabilityReport {
  free: Teacher[];
  busy: TeacherAvailabilityResult[];
}

// Returns true if [s1,e1) overlaps [s2,e2) where times are "HH:MM"
function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return timeToMins(s1) < timeToMins(e2) && timeToMins(s2) < timeToMins(e1);
}

export function checkTeacherAvailability(
  teachers: Teacher[],
  classes: Class[],
  date: string,       // YYYY-MM-DD
  startTime: string,  // HH:MM
  endTime: string,    // HH:MM
): AvailabilityReport {
  const free: Teacher[] = [];
  const busy: TeacherAvailabilityResult[] = [];

  // Only check active teachers
  const activeTeachers = teachers.filter((t) => t.status === "פעיל");

  for (const teacher of activeTeachers) {
    // All active/planned classes for this teacher
    const myClasses = classes.filter(
      (c) => c.teacher_id === teacher.id && c.status !== "בוטל" && c.status !== "הסתיים"
    );

    const conflicts: TeacherAvailabilityResult["conflictingClasses"] = [];

    for (const cls of myClasses) {
      for (const slot of cls.slots ?? []) {
        // Check if this slot occurs on the requested date
        if (!slotOccursOnDate(slot, date)) continue;
        // Check if the slot's time overlaps with the requested window
        if (timesOverlap(slot.start_time, slot.end_time, startTime, endTime)) {
          conflicts.push({
            className: cls.name,
            start_time: slot.start_time,
            end_time: slot.end_time,
          });
        }
      }
    }

    if (conflicts.length === 0) {
      free.push(teacher);
    } else {
      busy.push({ teacher, conflictingClasses: conflicts });
    }
  }

  return { free, busy };
}
