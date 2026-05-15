"use client";
/*
  SessionList — middle panel of the attendance module.
  Lists all past session dates for the selected class.
  Each row shows:
    - The date (formatted in Hebrew)
    - ✓ green if attendance was already recorded
    - ⚠ amber if attendance is missing
  Clicking a session selects it for editing in the right panel.
*/
import type { Attendance } from "@/types";
import { formatHebrewDate } from "./attendanceHelpers";

interface Props {
  dates: string[]; // past session dates, newest first (YYYY-MM-DD)
  attendanceByDate: Map<string, Attendance>; // date → attendance doc (if exists)
  enrolledCount: number; // number of active students in this class
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

// A session is incomplete if: no doc, or doc has fewer records than enrolled students
function isIncomplete(date: string, attendanceByDate: Map<string, Attendance>, enrolledCount: number): boolean {
  const doc = attendanceByDate.get(date);
  return !doc || doc.records.length < enrolledCount;
}

export default function SessionList({ dates, attendanceByDate, enrolledCount, selectedDate, onSelect }: Props) {
  if (dates.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
          שיעורים
        </p>
        <p className="text-sm text-gray-400 px-2">אין שיעורים שעברו עדיין</p>
      </div>
    );
  }

  const missing = dates.filter((d) => isIncomplete(d, attendanceByDate, enrolledCount)).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          שיעורים ({dates.length})
        </p>
        {/* Summary badge: how many sessions are missing */}
        {missing > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
            {missing} חסרים
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {dates.map((date) => {
          const incomplete = isIncomplete(date, attendanceByDate, enrolledCount);
          const isSelected = date === selectedDate;

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              className={`w-full text-right px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                isSelected
                  ? "bg-teal-500 text-white"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {/* Status icon: ✓ = fully recorded, ⚠ = missing or partial */}
              <span className={`text-base shrink-0 ${isSelected ? "text-white" : incomplete ? "text-amber-500" : "text-green-500"}`}>
                {incomplete ? "⚠" : "✓"}
              </span>

              {/* Date label */}
              <span className="flex-1 truncate">{formatHebrewDate(date)}</span>

              {/* Attendance count if at least partially recorded */}
              {attendanceByDate.has(date) && (() => {
                const rec = attendanceByDate.get(date)!;
                const presentCount = rec.records.filter((r) => r.present).length;
                const total = rec.records.length;
                return (
                  <span className={`text-xs shrink-0 ${isSelected ? "text-teal-100" : "text-gray-400"}`}>
                    {presentCount}/{total}
                  </span>
                );
              })()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
