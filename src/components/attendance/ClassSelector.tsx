"use client";
/*
  ClassSelector — left panel of the attendance module.
  Shows all active classes. Clicking one selects it.
  Shows a badge count of how many sessions are missing attendance.
*/
import type { Class, Attendance, Enrollment } from "@/types";
import { getPastSessionDates } from "./attendanceHelpers";

interface Props {
  classes: Class[];
  allAttendance: Attendance[];
  enrollments: Enrollment[]; // needed to detect partial sessions
  selectedClassId: string | null;
  today: string; // YYYY-MM-DD
  onSelect: (classId: string) => void;
}

// A session is "incomplete" if: no doc at all, OR doc has fewer records than enrolled students
function missingCount(classItem: Class, allAttendance: Attendance[], enrollments: Enrollment[], today: string): number {
  const pastDates = getPastSessionDates(classItem, today);
  const enrolledCount = enrollments.filter(
    (e) => e.class_id === classItem.id && e.status === "פעיל"
  ).length;
  const attendanceMap = new Map(
    allAttendance.filter((a) => a.class_id === classItem.id).map((a) => [a.date, a])
  );
  return pastDates.filter((d) => {
    const doc = attendanceMap.get(d);
    return !doc || doc.records.length < enrolledCount;
  }).length;
}

export default function ClassSelector({ classes, allAttendance, enrollments, selectedClassId, today, onSelect }: Props) {
  // Show active and planned classes (not cancelled/finished)
  const visibleClasses = classes.filter(
    (c) => c.status === "פעיל" || c.status === "מתוכנן"
  );

  return (
    <div className="flex flex-col h-full">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
        חוגים
      </p>

      <div className="flex-1 overflow-y-auto space-y-1">
        {visibleClasses.length === 0 && (
          <p className="text-sm text-gray-400 px-2">אין חוגים פעילים</p>
        )}

        {visibleClasses.map((cls) => {
          const missing = missingCount(cls, allAttendance, enrollments, today);
          const isSelected = cls.id === selectedClassId;

          return (
            <button
              key={cls.id}
              type="button"
              onClick={() => onSelect(cls.id)}
              className={`w-full text-right px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                isSelected
                  ? "bg-teal-500 text-white"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {/* Class color dot */}
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: cls.color ?? "#ccc" }}
              />

              {/* Class name */}
              <span className="flex-1 truncate font-medium">{cls.name}</span>

              {/* Missing sessions badge */}
              {missing > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                  isSelected ? "bg-white text-teal-600" : "bg-amber-100 text-amber-700"
                }`}>
                  {missing}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
