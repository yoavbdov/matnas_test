"use client";
/*
  AttendanceSheet — right panel of the attendance module.
  Shows all enrolled students for the selected class + session date.
  Each student has a present/absent toggle and an optional note.
  One "שמור" button saves the entire session.
  Automatically loads existing data if this session was already saved.
*/
import { useState, useEffect } from "react";
import AttendanceStudentRow from "./AttendanceStudentRow";
import { formatHebrewDate } from "./attendanceHelpers";
import { addDocument, updateDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import type {
  Student,
  Enrollment,
  Attendance,
  AttendanceRecord,
} from "@/lib/types";

interface Props {
  classId: string;
  date: string; // YYYY-MM-DD
  students: Student[];
  enrollments: Enrollment[];
  existing: Attendance | null; // existing doc for this date, if any
  onSaved: () => void;
}

// Per-student local state — present=null means "not yet entered"
type RowState = { present: boolean | null; note: string };

export default function AttendanceSheet({
  classId,
  date,
  students,
  enrollments,
  existing,
  onSaved,
}: Props) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  // Only students actively enrolled in this class
  const enrolledStudents = students.filter((s) =>
    enrollments.some(
      (e) =>
        e.class_id === classId && e.student_id === s.id && e.status === "פעיל",
    ),
  );

  // Build initial row states from existing doc.
  // If a student has no saved record yet → null (לא הוזן).
  function buildRows(): Record<string, RowState> {
    const init: Record<string, RowState> = {};
    for (const s of enrolledStudents) {
      const saved = existing?.records.find((r) => r.student_id === s.id);
      init[s.id] = {
        present: saved ? saved.present : null,
        note: saved?.note ?? "",
      };
    }
    return init;
  }

  const [rows, setRows] = useState<Record<string, RowState>>(buildRows);

  // Re-initialize when the selected date or existing data changes
  useEffect(() => {
    setRows(buildRows());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, existing]);

  // Cycle: null → true → false → null
  function togglePresent(studentId: string) {
    setRows((prev) => {
      const cur = prev[studentId].present;
      const next = cur === null ? true : cur === true ? false : null;
      return { ...prev, [studentId]: { ...prev[studentId], present: next } };
    });
  }

  function setNote(studentId: string, note: string) {
    setRows((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], note },
    }));
  }

  // Bulk mark — only sets true/false (null is cleared by clicking the button)
  function markAll(present: boolean) {
    setRows((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) next[id] = { ...next[id], present };
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Only save records that have been explicitly set (not null)
      const records: AttendanceRecord[] = enrolledStudents
        .filter((s) => rows[s.id]?.present !== null)
        .map((s) => ({
          student_id: s.id,
          present: rows[s.id].present as boolean,
          ...(rows[s.id]?.note ? { note: rows[s.id].note } : {}),
        }));

      if (existing) {
        await updateDocument("attendance", existing.id, { records });
      } else {
        await addDocument("attendance", {
          class_id: classId,
          date,
          records,
          created_at: new Date().toISOString(),
        });
      }

      showToast("הנוכחות נשמרה בהצלחה", "success");
      onSaved();
    } catch {
      showToast("שגיאה בשמירה, נסה שוב", "error");
    } finally {
      setSaving(false);
    }
  }

  if (enrolledStudents.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-sm text-gray-400">אין תלמידים רשומים לחוג זה.</p>
      </div>
    );
  }

  const presentCount = Object.values(rows).filter(
    (r) => r.present === true,
  ).length;
  const enteredCount = Object.values(rows).filter(
    (r) => r.present !== null,
  ).length;
  const total = enrolledStudents.length;

  return (
    <div dir="rtl" className="flex flex-col h-full">
      {/* Header: date + summary + bulk actions */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <p className="text-base font-semibold text-gray-800">
            {formatHebrewDate(date)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {existing
              ? "✓ שיעור מתועד — ניתן לעדכון"
              : "⚠ שיעור לא מתועד עדיין"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Present count out of entered (not null) */}
          <span className="text-sm text-gray-500">
            נכחו <strong className="text-gray-800">{presentCount}</strong> /{" "}
            {enteredCount} הוזנו ({total} סה"כ)
          </span>

          {/* Bulk mark buttons */}
          <button
            type="button"
            onClick={() => markAll(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium"
          >
            כולם נכחו
          </button>
          <button
            type="button"
            onClick={() => markAll(false)}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 font-medium"
          >
            כולם נעדרו
          </button>
        </div>
      </div>

      {/* Student rows — scrollable */}
      <div className="flex-1 overflow-y-auto space-y-2 pl-1">
        {enrolledStudents.map((student) => (
          <AttendanceStudentRow
            key={student.id}
            student={student}
            present={rows[student.id]?.present ?? null}
            note={rows[student.id]?.note ?? ""}
            onToggle={() => togglePresent(student.id)}
            onNoteChange={(note) => setNote(student.id, note)}
          />
        ))}
      </div>

      {/* Save button — pinned to bottom */}
      <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-2.5 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:opacity-50 transition-colors"
        >
          {saving ? "מעדכן..." : "שמור"}
        </button>
      </div>
    </div>
  );
}
