import type { Class } from "@/lib/types";

interface Item { cls: Class; enrolled: number; ratio: number; teacherName: string; }

function barColor(ratio: number) {
  return ratio >= 1 ? "bg-red-500" : ratio >= 0.8 ? "bg-orange-400" : "bg-teal-500";
}

export default function EnrollmentByClass({ items }: { items: Item[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
      {items.length === 0 && <p className="p-6 text-center text-sm text-gray-400">אין חוגים פעילים</p>}
      {items.map(({ cls, enrolled, ratio, teacherName }) => (
        <div key={cls.id} className="px-5 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cls.color ?? "#ccc" }} />
              <span className="text-sm font-medium text-gray-800">{cls.name}</span>
              <span className="text-xs text-gray-400">{teacherName}</span>
            </div>
            <span className="text-xs text-gray-500">{enrolled} / {cls.capacity}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${barColor(ratio)}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
