// טבלת החוגים — כל שורה היא חוג אחד, כל כותרת עמודה ניתנת למיון
import Badge from "@/components/shared/Badge";
import type { Class, Teacher, Enrollment } from "@/lib/types";

export type SortCol = "name" | "teacher" | "enrolled" | "capacity" | "days" | "status";
export type SortDir = "asc" | "desc";

interface Props {
  classes: Class[];
  teachers: Teacher[];
  enrollments: Enrollment[];
  onRowClick: (c: Class) => void;
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (col: SortCol) => void;
}

// כותרת עמודה עם חץ מיון
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
        <span className="text-gray-400">{active ? (dir === "asc" ? "↑" : "↓") : "↕"}</span>
      </span>
    </th>
  );
}

function enrollColor(ratio: number) {
  if (ratio >= 1) return "text-red-600 font-semibold";
  if (ratio >= 0.8) return "text-orange-500 font-medium";
  return "text-teal-600";
}

export default function ClassesTable({ classes, teachers, enrollments, onRowClick, sortCol, sortDir, onSort }: Props) {
  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
        אין חוגים להצגה
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs">
            {/* עמודת נקודת צבע — לא ניתנת למיון */}
            <th className="px-4 py-3 w-4" />
            <SortTh label="שם החוג"  col="name"     active={sortCol === "name"}     dir={sortDir} onSort={onSort} />
            <SortTh label="מדריך"    col="teacher"  active={sortCol === "teacher"}  dir={sortDir} onSort={onSort} />
            <th className="text-right px-4 py-3 font-medium">גילאים</th>
            <th className="text-right px-4 py-3 font-medium">דירוגים</th>
            <SortTh label="רשומים"   col="enrolled" active={sortCol === "enrolled"} dir={sortDir} onSort={onSort} />
            <SortTh label="קיבולת"   col="capacity" active={sortCol === "capacity"} dir={sortDir} onSort={onSort} />
            <SortTh label="ימים"     col="days"     active={sortCol === "days"}     dir={sortDir} onSort={onSort} />
            <SortTh label="סטטוס"    col="status"   active={sortCol === "status"}   dir={sortDir} onSort={onSort} />
          </tr>
        </thead>
        <tbody>
          {classes.map((cls) => {
            const teacher = teachers.find((t) => t.id === cls.teacher_id);
            const enrolled = enrollments.filter((e) => e.class_id === cls.id && e.status === "פעיל").length;
            const ratio = cls.capacity > 0 ? enrolled / cls.capacity : 0;
            const days = [...new Set((cls.slots ?? []).map((s) => s.day))].join(", ");

            return (
              <tr
                key={cls.id}
                onClick={() => onRowClick(cls)}
                className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: cls.color ?? "#ccc" }} />
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{cls.name}</td>
                <td className="px-4 py-3 text-gray-500">
                  {teacher ? `${teacher.first_name} ${teacher.last_name}` : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {cls.age_min !== undefined && cls.age_max !== undefined ? `${cls.age_min}–${cls.age_max}` : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {cls.rating_min !== undefined && cls.rating_max !== undefined ? `${cls.rating_min}–${cls.rating_max}` : "—"}
                </td>
                <td className={`px-4 py-3 ${enrollColor(ratio)}`}>{enrolled}</td>
                <td className="px-4 py-3 text-gray-500">{cls.capacity}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{days || "—"}</td>
                <td className="px-4 py-3">
                  <Badge label={cls.status} color={cls.status === "פעיל" ? "green" : "gray"} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
