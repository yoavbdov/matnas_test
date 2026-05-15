"use client";
/*
  ExportCsvModal — asks the user which class to export, then triggers CSV download.
  Shown when the user clicks the "ייצוא CSV" button on the attendance page.
*/
import { useState } from "react";
import { exportAttendanceCsv } from "./exportAttendanceCsv";
import type { Class, Student, Enrollment, Attendance } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        <Select value={selectedClassId} onValueChange={(v: string) => setSelectedClassId(v)}>
          <SelectTrigger className="w-full mb-5">
            <SelectValue placeholder="— בחר חוג —" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-gray-600"
          >
            ביטול
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={!selectedClassId}
            className="bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-40"
          >
            ייצא CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
