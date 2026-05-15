"use client";
/*
  ClassEnrollmentPanel — manage student enrollment inside the class form.
  Shows currently enrolled students, lets you add or remove them.
  Warns if a student is already in another class or tournament at the same time.
*/
import { useState } from "react";
import { slotsOverlapTime } from "@/lib/classHelpers";
import { timeToMins } from "@/lib/utils";
import type { Student, Enrollment, Class, Tournament, ScheduleSlot } from "@/types";

// Hebrew day names indexed by JS getDay() (0=Sunday)
const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

interface Props {
  students: Student[];
  allEnrollments: Enrollment[];   // all enrollments in the system
  allClasses: Class[];
  allTournaments: Tournament[];
  formSlots: ScheduleSlot[];      // slots currently set in the form
  currentClassId?: string;        // undefined when creating a new class
  // pendingAdd = student IDs queued to be enrolled on save
  pendingAdd: string[];
  // pendingRemove = enrollment IDs queued to be deleted on save
  pendingRemove: string[];
  onAddStudent: (studentId: string) => void;
  onRemoveEnrollment: (enrollmentId: string, studentId: string) => void;
  onUndoAdd: (studentId: string) => void;
}

// Check if two HH:MM time ranges overlap
function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return timeToMins(s1) < timeToMins(e2) && timeToMins(s2) < timeToMins(e1);
}

// Returns a warning message if the student has a schedule conflict with the form slots
function getConflictWarning(
  studentId: string,
  formSlots: ScheduleSlot[],
  allClasses: Class[],
  allEnrollments: Enrollment[],
  allTournaments: Tournament[],
  currentClassId?: string
): string | null {
  if (formSlots.length === 0) return null;

  // Check other classes the student is enrolled in
  const otherClassIds = allEnrollments
    .filter((e) => e.student_id === studentId && e.status === "פעיל" && e.class_id !== currentClassId)
    .map((e) => e.class_id);

  for (const classId of otherClassIds) {
    const cls = allClasses.find((c) => c.id === classId);
    if (!cls) continue;
    for (const slotA of formSlots) {
      for (const slotB of cls.slots ?? []) {
        if (slotsOverlapTime(slotA, slotB)) {
          return `רשום לחוג "${cls.name}" באותה שעה`;
        }
      }
    }
  }

  // Check tournaments the student participates in
  for (const t of allTournaments) {
    if (!(t.participant_ids ?? []).includes(studentId)) continue;

    if (t.is_recurring && t.recurring_date) {
      const [y, m, d] = t.recurring_date.split("-").map(Number);
      const tourDay = HEBREW_DAYS[new Date(y, m - 1, d).getDay()];
      for (const slot of formSlots) {
        if (
          slot.day === tourDay &&
          timesOverlap(slot.start_time, slot.end_time, t.recurring_start_time ?? "00:00", t.recurring_end_time ?? "01:00")
        ) {
          return `רשום לתחרות "${t.name}" באותה שעה`;
        }
      }
    } else {
      for (const round of t.rounds ?? []) {
        const [y, m, d] = round.date.split("-").map(Number);
        const roundDay = HEBREW_DAYS[new Date(y, m - 1, d).getDay()];
        for (const slot of formSlots) {
          if (
            slot.day === roundDay &&
            timesOverlap(slot.start_time, slot.end_time, round.start_time, round.end_time)
          ) {
            return `רשום לתחרות "${t.name}" באותה שעה`;
          }
        }
      }
    }
  }

  return null;
}

export default function ClassEnrollmentPanel({
  students,
  allEnrollments,
  allClasses,
  allTournaments,
  formSlots,
  currentClassId,
  pendingAdd,
  pendingRemove,
  onAddStudent,
  onRemoveEnrollment,
  onUndoAdd,
}: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // Currently saved active enrollments for this class (not yet removed)
  const savedEnrollments = allEnrollments.filter(
    (e) => e.class_id === currentClassId && e.status === "פעיל" && !pendingRemove.includes(e.id)
  );

  // All student IDs that will be enrolled after save
  const enrolledStudentIds = new Set([
    ...savedEnrollments.map((e) => e.student_id),
    ...pendingAdd,
  ]);

  // Students available to add (not already enrolled or pending add)
  const availableStudents = students.filter((s) => !enrolledStudentIds.has(s.id));

  function handleAdd() {
    if (!selectedStudentId) return;
    onAddStudent(selectedStudentId);
    setSelectedStudentId("");
  }

  // Build the display rows: saved enrollments first, then pending adds
  const rows: { label: string; warning: string | null; onRemove: () => void }[] = [
    ...savedEnrollments.map((enr) => {
      const student = students.find((s) => s.id === enr.student_id);
      return {
        label: student ? `${student.first_name} ${student.last_name}` : "—",
        warning: getConflictWarning(enr.student_id, formSlots, allClasses, allEnrollments, allTournaments, currentClassId),
        onRemove: () => onRemoveEnrollment(enr.id, enr.student_id),
      };
    }),
    ...pendingAdd.map((sid) => {
      const student = students.find((s) => s.id === sid);
      return {
        label: student ? `${student.first_name} ${student.last_name} (חדש)` : "—",
        warning: getConflictWarning(sid, formSlots, allClasses, allEnrollments, allTournaments, currentClassId),
        onRemove: () => onUndoAdd(sid),
      };
    }),
  ];

  return (
    <div dir="rtl">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        תלמידים ({rows.length})
      </p>

      {/* Enrolled list */}
      {rows.length > 0 && (
        <div className="mb-3 space-y-1">
          {rows.map((row, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                row.warning ? "bg-amber-50 border border-amber-200" : "bg-gray-50"
              }`}
            >
              <span className="flex-1 text-gray-800">{row.label}</span>
              {row.warning && (
                <span className="text-xs text-amber-600">⚠ {row.warning}</span>
              )}
              <button
                type="button"
                onClick={row.onRemove}
                className="text-xs text-red-400 hover:text-red-600 px-2 py-0.5 rounded"
              >
                הסר
              </button>
            </div>
          ))}
        </div>
      )}

      {rows.length === 0 && (
        <p className="text-sm text-gray-400 mb-3">אין תלמידים רשומים</p>
      )}

      {/* Add student row */}
      <div className="flex gap-2">
        <select
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
        >
          <option value="">בחר תלמיד להוספה...</option>
          {availableStudents.map((s) => (
            <option key={s.id} value={s.id}>
              {s.first_name} {s.last_name}
              {s.israeli_rating ? ` (${s.israeli_rating})` : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedStudentId}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          הוסף
        </button>
      </div>
    </div>
  );
}
