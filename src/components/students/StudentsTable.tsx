// טבלת השחקנים — מציגה את כל השחקנים המסוננים עם מיון לפי עמודה
import Badge from "@/components/shared/Badge";
import { calcAge, gradeFromDob, formatPhone } from "@/lib/utils/utils";
import { computeStudentStatus } from "@/lib/helpers/studentHelpers";
import type {
  Student,
  Enrollment,
  Tournament,
  LeagueGroup,
  LeagueGroupMember,
} from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/config/config";

export type SortCol =
  | "name"
  | "age"
  | "grade"
  | "rating"
  | "tournaments"
  | "league"
  | "phone"
  | "classes"
  | "status";
export type SortDir = "asc" | "desc";

interface Props {
  students: Student[];
  enrollments: Enrollment[];
  tournaments: Tournament[];
  leagueGroups: LeagueGroup[];
  leagueGroupMembers: LeagueGroupMember[];
  onRowClick: (s: Student) => void;
  settings: typeof DEFAULT_SETTINGS;
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (col: SortCol) => void;
}

// Column header with sort indicator
function SortTh({
  label,
  col,
  active,
  dir,
  onSort,
}: {
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
        <span className="text-gray-400">
          {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </span>
    </th>
  );
}

// Map badge color to computed status
function statusBadgeColor(status: string): "green" | "blue" | "gray" {
  if (status === "פעיל") return "green";
  if (status === "ליגה בלבד") return "blue";
  return "gray";
}

export default function StudentsTable({
  students,
  enrollments,
  tournaments,
  leagueGroups,
  leagueGroupMembers,
  onRowClick,
  settings,
  sortCol,
  sortDir,
  onSort,
}: Props) {
  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
        אין שחקנים להצגה
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs">
            <SortTh
              label="שם מלא"
              col="name"
              active={sortCol === "name"}
              dir={sortDir}
              onSort={onSort}
            />
            <SortTh
              label="גיל"
              col="age"
              active={sortCol === "age"}
              dir={sortDir}
              onSort={onSort}
            />
            <SortTh
              label="כיתה"
              col="grade"
              active={sortCol === "grade"}
              dir={sortDir}
              onSort={onSort}
            />
            <SortTh
              label="דירוג ישראלי"
              col="rating"
              active={sortCol === "rating"}
              dir={sortDir}
              onSort={onSort}
            />
            <SortTh
              label="טלפון"
              col="phone"
              active={sortCol === "phone"}
              dir={sortDir}
              onSort={onSort}
            />
            <SortTh
              label="חוגים"
              col="classes"
              active={sortCol === "classes"}
              dir={sortDir}
              onSort={onSort}
            />
            <SortTh
              label="תחרויות"
              col="tournaments"
              active={sortCol === "tournaments"}
              dir={sortDir}
              onSort={onSort}
            />
            <SortTh
              label="קבוצת ליגה"
              col="league"
              active={sortCol === "league"}
              dir={sortDir}
              onSort={onSort}
            />
            <SortTh
              label="סטטוס"
              col="status"
              active={sortCol === "status"}
              dir={sortDir}
              onSort={onSort}
            />
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const age = s.dob ? calcAge(s.dob) : null;
            // Use manual override if set, otherwise compute from DOB
            const grade = s.grade_override
              ? s.grade_override
              : s.dob
                ? gradeFromDob(
                    s.dob,
                    settings.GRADE_FIRST_AGE,
                    settings.GRADE_ADULT_AGE,
                  )
                : "—";
            const classCount = enrollments.filter(
              (e) => e.student_id === s.id && e.status === "פעיל",
            ).length;
            // Status is always computed — never read from the stored field
            const status = computeStudentStatus(
              s.id,
              enrollments,
              tournaments,
              leagueGroupMembers,
            );

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
                  {s.grade_override && (
                    <span title="כיתה ידנית" className="ml-1 text-teal-400">
                      ✎
                    </span>
                  )}
                  {grade}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {s.israeli_rating ?? "—"}
                  {s.chess_title && (
                    <span className="mr-1 text-xs text-teal-600 font-medium">
                      {s.chess_title}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {s.phone ? formatPhone(s.phone) : "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">{classCount || "—"}</td>
                {/* כמה תחרויות השחקן רשום בהן */}
                <td className="px-4 py-3 text-gray-700">
                  {(() => {
                    const count = tournaments.filter((t) =>
                      t.participant_ids.includes(s.id),
                    ).length;
                    return count > 0 ? count : "—";
                  })()}
                </td>
                {/* קבוצת הליגה של השחקן (אם יש) */}
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {(() => {
                    const membership = leagueGroupMembers.find(
                      (m) => m.student_id === s.id,
                    );
                    if (!membership) return "—";
                    const group = leagueGroups.find(
                      (g) => g.id === membership.group_id,
                    );
                    return group ? group.name : "—";
                  })()}
                </td>
                <td className="px-4 py-3">
                  <Badge label={status} color={statusBadgeColor(status)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
