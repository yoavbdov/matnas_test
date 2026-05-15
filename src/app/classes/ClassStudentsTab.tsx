"use client";
/*
  ClassStudentsTab — manage enrolled students inside the class form.
  Uses the "להוספת תלמידים לחץ כאן" button pattern (same as TournamentPlayersPanel)
  which opens AddStudentsModal for a rich search + multi-select experience.
*/
import { useState } from "react";
import { X, UserPlus, AlertTriangle } from "lucide-react";
import CsvExportBtn from "@/components/shared/CsvExportBtn";
import AddStudentsModal from "./AddStudentsModal";
import { slotsOverlapTime } from "@/lib/classHelpers";
import { timeToMins } from "@/lib/utils";
import type { Student, Enrollment, Class, Tournament, ScheduleSlot } from "@/lib/types";

const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

interface Props {
  className: string; // for CSV filename
  students: Student[];
  allEnrollments: Enrollment[];
  allClasses: Class[];
  allTournaments: Tournament[];
  formSlots: ScheduleSlot[];
  currentClassId?: string;
  pendingAdd: string[];
  pendingRemove: string[];
  onAddStudent: (studentId: string) => void;
  onRemoveEnrollment: (enrollmentId: string) => void;
  onUndoAdd: (studentId: string) => void;
}

// Returns a conflict label if student's schedule clashes with the class slots
function getConflict(
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
        if (slotsOverlapTime(slotA, slotB)) return `חוג: ${cls.name}`;
      }
    }
  }

  // Check recurring tournaments
  for (const t of allTournaments) {
    if (!(t.participant_ids ?? []).includes(studentId)) continue;
    if (t.is_recurring && t.recurring_date) {
      const [y, m, d] = t.recurring_date.split("-").map(Number);
      const tourDay = HEBREW_DAYS[new Date(y, m - 1, d).getDay()];
      for (const slot of formSlots) {
        const s1 = timeToMins(slot.start_time);
        const e1 = timeToMins(slot.end_time);
        const s2 = timeToMins(t.recurring_start_time ?? "00:00");
        const e2 = timeToMins(t.recurring_end_time ?? "01:00");
        if (slot.day === tourDay && s1 < e2 && s2 < e1) return `תחרות: ${t.name}`;
      }
    }
  }

  return null;
}

// Export enrolled students to CSV and trigger download
function exportToCSV(enrolledStudents: Student[], className: string) {
  const headers = ["שם פרטי", "שם משפחה", "טלפון", "אימייל", "דירוג ישראלי", "דירוג FIDE", "סטטוס"];
  const rows = enrolledStudents.map((s) => [
    s.first_name, s.last_name, s.phone ?? "", s.email ?? "",
    String(s.israeli_rating ?? ""), String(s.fide_rating ?? ""), s.status ?? "",
  ]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [
    "﻿" + headers.map(escape).join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `תלמידים_${className}.csv`;
  a.click();
}

export default function ClassStudentsTab({
  className,
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
  const [showAddModal, setShowAddModal] = useState(false);

  // Saved active enrollments not queued for removal
  const savedEnrollments = allEnrollments.filter(
    (e) => e.class_id === currentClassId && e.status === "פעיל" && !pendingRemove.includes(e.id)
  );

  const enrolledStudentIds = new Set([
    ...savedEnrollments.map((e) => e.student_id),
    ...pendingAdd,
  ]);

  const totalCount = enrolledStudentIds.size;

  // Resolve enrolled students for CSV export
  const enrolledStudents = [...enrolledStudentIds]
    .map((id) => students.find((s) => s.id === id))
    .filter(Boolean) as Student[];

  // Called from AddStudentsModal — may add multiple at once
  function handleAddMultiple(ids: string[]) {
    for (const id of ids) onAddStudent(id);
  }

  return (
    <div className="space-y-5" dir="rtl">

      {/* Header — count + CSV export + add button */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-500 font-medium">
          {totalCount === 0 ? "אין תלמידים רשומים" : `${totalCount} תלמידים רשומים`}
        </span>
        <div className="flex items-center gap-2">
          {/* Export enrolled list — visible when there are enrollments */}
          {totalCount > 0 && (
            <CsvExportBtn onClick={() => exportToCSV(enrolledStudents, className)} />
          )}
          {/* Opens the rich search + multi-select modal */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <UserPlus size={15} />
            להוספת תלמידים לחץ כאן
          </button>
        </div>
      </div>

      {/* Saved enrolled students */}
      {savedEnrollments.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">תלמידים רשומים</p>
          <div className="space-y-1.5">
            {savedEnrollments.map((enr) => {
              const student = students.find((s) => s.id === enr.student_id);
              const conflict = student
                ? getConflict(student.id, formSlots, allClasses, allEnrollments, allTournaments, currentClassId)
                : null;
              return (
                <div
                  key={enr.id}
                  className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm ${
                    conflict ? "bg-amber-50 border border-amber-100" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {conflict && (
                      <span title={conflict}>
                        <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                      </span>
                    )}
                    <span className="font-medium text-gray-800">
                      {student ? `${student.first_name} ${student.last_name}` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{student?.israeli_rating ?? "—"}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveEnrollment(enr.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending new enrollments — not yet saved */}
      {pendingAdd.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">ממתינים לשמירה</p>
          <div className="space-y-1.5">
            {pendingAdd.map((sid) => {
              const student = students.find((s) => s.id === sid);
              const conflict = student
                ? getConflict(sid, formSlots, allClasses, allEnrollments, allTournaments, currentClassId)
                : null;
              return (
                <div
                  key={sid}
                  className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm border ${
                    conflict ? "bg-amber-50 border-amber-200" : "bg-teal-50 border-teal-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {conflict && (
                      <span title={conflict}>
                        <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                      </span>
                    )}
                    <span className="font-medium text-gray-800">
                      {student ? `${student.first_name} ${student.last_name}` : "—"}
                      <span className="text-xs text-teal-500 mr-1">(חדש)</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{student?.israeli_rating ?? "—"}</span>
                    <button
                      type="button"
                      onClick={() => onUndoAdd(sid)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="py-10 text-center text-gray-300">
          <UserPlus size={36} className="mx-auto mb-3" />
          <p className="text-sm">לחץ על הכפתור למעלה כדי להוסיף תלמידים</p>
        </div>
      )}

      {/* Add students modal */}
      {showAddModal && (
        <AddStudentsModal
          className={className}
          allStudents={students}
          alreadyAddedIds={[...enrolledStudentIds]}
          formSlots={formSlots}
          allClasses={allClasses}
          allEnrollments={allEnrollments}
          allTournaments={allTournaments}
          currentClassId={currentClassId}
          onAdd={handleAddMultiple}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
