// טבלת המדריכים — כל שורה היא מדריך אחד
import Badge from "@/components/shared/Badge";
import type { Teacher, Class } from "@/lib/types";

interface Props {
  teachers: Teacher[];
  classes: Class[];
  onRowClick: (t: Teacher) => void;
}

export default function TeachersTable({ teachers, classes, onRowClick }: Props) {
  if (teachers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
        אין מדריכים להצגה
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs">
            <th className="text-right px-4 py-3 font-medium">שם מלא</th>
            <th className="text-right px-4 py-3 font-medium">תחום</th>
            <th className="text-right px-4 py-3 font-medium">טלפון</th>
            <th className="text-right px-4 py-3 font-medium">חוגים פעילים</th>
            <th className="text-right px-4 py-3 font-medium">הסמכות</th>
            <th className="text-right px-4 py-3 font-medium">סטטוס</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((t) => {
            const activeClasses = classes.filter((c) => c.teacher_id === t.id && c.status === "פעיל").length;
            return (
              <tr
                key={t.id}
                onClick={() => onRowClick(t)}
                className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium text-gray-800">{t.first_name} {t.last_name}</td>
                <td className="px-4 py-3 text-gray-500">{t.subject || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{t.phone || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{activeClasses}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(t.certifications ?? []).map((cert) => (
                      <span key={cert} className="text-xs bg-teal-50 text-teal-700 rounded-full px-2 py-0.5">
                        {cert}
                      </span>
                    ))}
                    {(t.certifications ?? []).length === 0 && <span className="text-gray-400">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge label={t.status} color={t.status === "פעיל" ? "green" : "gray"} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
