"use client";
import { useData } from "@/context/DataContext";
import { useMemo } from "react";

function enrollmentTheme(ratio: number) {
  if (ratio >= 1) return { bar: "bg-red-500", label: "מלא", text: "text-red-600" };
  if (ratio >= 0.8) return { bar: "bg-orange-400", label: "כמעט מלא", text: "text-orange-500" };
  return { bar: "bg-teal-500", label: "רגיל", text: "text-teal-600" };
}

export default function EnrollmentStatusList() {
  const { classes, enrollments } = useData();

  const items = useMemo(() => {
    return classes
      .filter((c) => c.status === "פעיל")
      .map((cls) => {
        const enrolled = enrollments.filter(
          (e) => e.class_id === cls.id && e.status === "פעיל"
        ).length;
        const ratio = cls.capacity > 0 ? enrolled / cls.capacity : 0;
        return { cls, enrolled, ratio };
      })
      .sort((a, b) => b.ratio - a.ratio);
  }, [classes, enrollments]);

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        מצב רישומים — חוגים פעילים
      </h2>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
          אין חוגים פעילים
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {items.map(({ cls, enrolled, ratio }) => {
            const { bar, label, text } = enrollmentTheme(ratio);
            return (
              <div key={cls.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">{cls.name}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${text}`}>{label}</span>
                    <span className="text-xs text-gray-400">
                      {enrolled} / {cls.capacity}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${bar}`}
                    style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
