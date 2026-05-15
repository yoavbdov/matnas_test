"use client";
/*
  AttendanceStudentRow — one student in the attendance sheet.
  3-state toggle: null (לא הוזן) → true (נכח) → false (לא נכח) → null
*/
import type { Student } from "@/types";

interface Props {
  student: Student;
  present: boolean | null; // null = not yet entered
  note: string;
  onToggle: () => void;
  onNoteChange: (note: string) => void;
}

// Visual config per state
function getStateStyle(present: boolean | null) {
  if (present === true)
    return {
      row: "bg-green-50 border-green-200",
      btn: "bg-green-500 text-white hover:bg-green-600",
      label: "✓ נכח",
    };
  if (present === false)
    return {
      row: "bg-red-50 border-red-100",
      btn: "bg-red-400 text-white hover:bg-red-500",
      label: "✗ לא נכח",
    };
  /* null */ return {
    row: "bg-gray-50 border-gray-200",
    btn: "bg-gray-300 text-gray-600 hover:bg-gray-400",
    label: "לא הוזן",
  };
}

export default function AttendanceStudentRow({
  student,
  present,
  note,
  onToggle,
  onNoteChange,
}: Props) {
  const style = getStateStyle(present);
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors ${style.row}`}
    >
      {/* Toggle button — cycles null → true → false → null */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-28 shrink-0 py-2 rounded-lg text-sm font-bold transition-colors ${style.btn}`}
      >
        {style.label}
      </button>

      {/* Student name + optional rating */}
      <div className="w-44 shrink-0">
        <p className="text-sm font-semibold text-gray-800">
          {student.first_name} {student.last_name}
        </p>
      </div>

      {/* Note input */}
      <input
        type="text"
        placeholder="הערה"
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        maxLength={120}
        className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-teal-400"
      />
    </div>
  );
}
