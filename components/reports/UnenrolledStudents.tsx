import type { Child } from "@/lib/types";

export default function UnenrolledStudents({ students }: { students: Child[] }) {
  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center text-sm text-gray-400">
        כל התלמידים הפעילים רשומים לחוג
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs">
            <th className="text-right px-4 py-3 font-medium">שם</th>
            <th className="text-right px-4 py-3 font-medium">טלפון</th>
            <th className="text-right px-4 py-3 font-medium">הורה</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} className="border-b border-gray-50 last:border-0">
              <td className="px-4 py-3 font-medium text-gray-800">{s.first_name} {s.last_name}</td>
              <td className="px-4 py-3 text-gray-500">{s.phone || "—"}</td>
              <td className="px-4 py-3 text-gray-500">{s.parent_name || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
