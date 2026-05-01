// טבלת התלמידים — מציגה את כל התלמידים המסוננים
import Badge from "@/components/shared/Badge";
import { calcAge, gradeFromDob } from "@/lib/utils";
import type { Child, Enrollment, AppSettings } from "@/lib/types";

interface Props {
  students: Child[];
  enrollments: Enrollment[];
  onRowClick: (s: Child) => void;
  settings: Required<AppSettings>;
}

export default function StudentsTable({ students, enrollments, onRowClick, settings }: Props) {
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
            <th className="text-right px-4 py-3 font-medium">שם מלא</th>
            <th className="text-right px-4 py-3 font-medium">גיל / כיתה</th>
            <th className="text-right px-4 py-3 font-medium">דירוג ישראלי</th>
            <th className="text-right px-4 py-3 font-medium">טלפון הורה</th>
            <th className="text-right px-4 py-3 font-medium">חוגים</th>
            <th className="text-right px-4 py-3 font-medium">סטטוס</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const age = s.dob ? calcAge(s.dob) : null;
            const grade = s.dob ? gradeFromDob(s.dob, settings.GRADE_FIRST_AGE, settings.GRADE_ADULT_AGE) : "—";
            const classCount = enrollments.filter((e) => e.child_id === s.id && e.status === "פעיל").length;

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
                  {age !== null ? `${age} ` : ""}{grade}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {s.israeli_rating ?? "—"}
                  {s.chess_title && (
                    <span className="mr-1 text-xs text-teal-600 font-medium">{s.chess_title}</span>
                  )}
                </td>
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
