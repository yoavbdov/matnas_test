/*
  exportAttendanceCsv — builds and downloads a CSV file for a single class.

  Format:
    Row 1:  "שם תלמיד" | date1 | date2 | ...  (dates oldest → newest, DD.M.YYYY)
    Row 2+: "שם פרטי שם משפחה" | "נכח" / "לא נכח" / ""

  Dates come from getPastSessionDates (newest-first) — we reverse them for the export.
  We only include sessions that appear in the attendance collection (recorded sessions).
*/
import type { Student, Enrollment, Attendance, Class } from "@/lib/types";
import { getPastSessionDates } from "./attendanceHelpers";

// Format YYYY-MM-DD → DD.M.YYYY (Israeli convention, no leading zero on month/day)
function formatDateForCsv(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${Number(d)}.${Number(m)}.${y}`;
}

// Escape a CSV cell: wrap in quotes if it contains a comma or quote
function escapeCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Build and trigger download of the CSV file
export function exportAttendanceCsv(params: {
  cls: Class;
  students: Student[];
  enrollments: Enrollment[];
  allAttendance: Attendance[];
  today: string;
}): void {
  const { cls, students, enrollments, allAttendance, today } = params;

  // All past session dates for this class (oldest first for the export)
  const sessionDates = getPastSessionDates(cls, today).reverse();

  // Only include sessions that have been recorded
  const recordedDates = sessionDates.filter((date) =>
    allAttendance.some((a) => a.class_id === cls.id && a.date === date)
  );

  if (recordedDates.length === 0) {
    alert("לא נמצאו שיעורים מתועדים לחוג זה.");
    return;
  }

  // Students enrolled in this class
  const enrolledStudents = students.filter((s) =>
    enrollments.some(
      (e) => e.class_id === cls.id && e.student_id === s.id && e.status === "פעיל"
    )
  );

  // Build lookup: date → attendance doc
  const attendanceMap = new Map<string, Attendance>();
  for (const a of allAttendance) {
    if (a.class_id === cls.id) attendanceMap.set(a.date, a);
  }

  // Header row: "שם תלמיד" + one column per date
  const header = ["שם תלמיד", ...recordedDates.map(formatDateForCsv)];
  const rows: string[][] = [header];

  // One row per student
  for (const student of enrolledStudents) {
    const name = `${student.first_name} ${student.last_name}`;
    const cells = recordedDates.map((date) => {
      const doc = attendanceMap.get(date);
      if (!doc) return ""; // session not recorded
      const record = doc.records.find((r) => r.student_id === student.id);
      if (!record) return ""; // student not in this session's records
      return record.present ? "נכח" : "לא נכח";
    });
    rows.push([name, ...cells]);
  }

  // Join rows into CSV string
  const csv = rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");

  // Add BOM so Excel opens Hebrew text correctly
  const bom = "﻿";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `נוכחות_${cls.name}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
