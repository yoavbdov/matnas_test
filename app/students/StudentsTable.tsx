// טבלת התלמידים — מציגה את כל התלמידים המסוננים עם מיון לפי עמודה
import Badge from "@/components/shared/Badge";
import { calcAge, gradeFromDob } from "@/lib/utils";
import type { Student, Enrollment, AppSettings } from "@/lib/types";

export type SortCol = "name" | "age" | "grade" | "rating" | "fide_rating" | "phone" | "classes" | "status";
export type SortDir = "asc" | "desc";

interface Props {
  students: Student[];
  enrollments: Enrollment[];
  onRowClick: (s: Student) => void;
  settings: Required<AppSettings>;
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (col: SortCol) => void;
}

// Column header with sort indicator
function SortTh({ label, col, active, dir, onSort }: {
  label: string;
  col: SortCol;
  active: boolean;
  dir: SortDir;
  onSort: (col: SortCol) => void;
}) {
  return (
    <th
      className="text-right px-4 py-3 font-medium cursor-pointer select-none hover:text-teal-600 transition-colors"
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {/* Show sort arrow only on active column */}
        <span className="text-gray-400">{active ? (dir === "asc" ? "↑" : "↓") : "↕"}</span>
      </span>
    </th>
  );
}

export default function StudentsTable({ students, enrollments, onRowClick, settings, sortCol, sortDir, onSort }: Props) {
  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
        אין תלמידים להצגה
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs">
            <SortTh label="שם מלא"        col="name"    active={sortCol === "name"}    dir={sortDir} onSort={onSort} />
            <SortTh label="גיל"           col="age"     active={sortCol === "age"}     dir={sortDir} onSort={onSort} />
            <SortTh label="כיתה"          col="grade"   active={sortCol === "grade"}   dir={sortDir} onSort={onSort} />
            <SortTh label="דירוג ישראלי"  col="rating"      active={sortCol === "rating"}      dir={sortDir} onSort={onSort} />
            <SortTh label="דירוג FIDE"    col="fide_rating" active={sortCol === "fide_rating"} dir={sortDir} onSort={onSort} />
            <SortTh label="טלפון הורה"    col="phone"       active={sortCol === "phone"}        dir={sortDir} onSort={onSort} />
            <SortTh label="חוגים"         col="classes" active={sortCol === "classes"} dir={sortDir} onSort={onSort} />
            <SortTh label="סטטוס"         col="status"  active={sortCol === "status"}  dir={sortDir} onSort={onSort} />
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const age = s.dob ? calcAge(s.dob) : null;
            // Use manual override if set, otherwise compute from DOB
            const grade = s.grade_override
              ? s.grade_override
              : s.dob
              ? gradeFromDob(s.dob, settings.GRADE_FIRST_AGE, settings.GRADE_ADULT_AGE)
              : "—";
            const classCount = enrollments.filter((e) => e.student_id === s.id && e.status === "פעיל").length;

            return (
              <tr
                key={s.id}
                onClick={() => onRowClick(s)}
                className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium text-gray-800">
                  {s.first_name} {s.last_name}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {age !== null ? `${age}` : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {/* Show indicator if grade was manually overridden */}
                  {s.grade_override && <span title="כיתה ידנית" className="ml-1 text-teal-400">✎</span>}
                  {grade}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {s.israeli_rating ?? "—"}
                  {s.chess_title && (
                    <span className="mr-1 text-xs text-teal-600 font-medium">{s.chess_title}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{s.fide_rating ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{s.parent_phone || s.phone || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{classCount || "—"}</td>
                <td className="px-4 py-3">
                  <Badge label={s.status} color={s.status === "פעיל" ? "green" : "gray"} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
