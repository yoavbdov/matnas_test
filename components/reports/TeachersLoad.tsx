import type { Teacher } from "@/lib/types";

interface Item { teacher: Teacher; classCount: number; totalEnrolled: number; }

export default function TeachersLoad({ items }: { items: Item[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs">
            <th className="text-right px-4 py-3 font-medium">מדריך</th>
            <th className="text-right px-4 py-3 font-medium">חוגים פעילים</th>
            <th className="text-right px-4 py-3 font-medium">סה״כ תלמידים</th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ teacher, classCount, totalEnrolled }) => (
            <tr key={teacher.id} className="border-b border-gray-50 last:border-0">
              <td className="px-4 py-3 font-medium text-gray-800">{teacher.first_name} {teacher.last_name}</td>
              <td className="px-4 py-3 text-gray-600">{classCount}</td>
              <td className="px-4 py-3 text-gray-600">{totalEnrolled}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">אין מדריכים פעילים</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
