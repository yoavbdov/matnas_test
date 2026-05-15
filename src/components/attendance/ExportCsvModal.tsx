"use client";
/*
  ExportCsvModal — asks the user which class to export, then triggers CSV download.
  Shown when the user clicks the "ייצוא CSV" button on the attendance page.
*/
import { useState } from "react";
import { exportAttendanceCsv } from "./exportAttendanceCsv";
import type { Class, Student, Enrollment, Attendance } from "@/types";

interface Props {
  classes: Class[];
  students: Student[];
  enrollments: Enrollment[];
  allAttendance: Attendance[];
  today: string;
  onClose: () => void;
}

export default function ExportCsvModal({
  classes,
  students,
  enrollments,
  allAttendance,
  today,
  onClose,
}: Props) {
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  function handleExport() {
    const cls = classes.find((c) => c.id === selectedClassId);
    if (!cls) return;
    exportAttendanceCsv({ cls, students, enrollments, allAttendance, today });
    onClose();
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      {/* Modal box */}
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-80"
        dir="rtl"
        onClick={(e) => e.stopPropagation()} // prevent backdrop click
      >
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          ייצוא נוכחות ל-CSV
        </h2>

        <label className="block text-sm text-gray-600 mb-1">בחר חוג</label>
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 mb-5"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
        >
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!selectedClassId}
            className="px-5 py-2 rounded-lg bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 disabled:opacity-40 transition-colors"
          >
            ייצא CSV
          </button>
        </div>
      </div>
    </div>
  );
}
