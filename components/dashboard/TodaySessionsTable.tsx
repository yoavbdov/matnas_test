"use client";
import { useData } from "@/context/DataContext";
import { slotOccursOnDate } from "@/lib/scheduleHelpers";
import { useMemo } from "react";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function enrollmentColor(ratio: number) {
  if (ratio >= 1) return "text-red-600 font-semibold";
  if (ratio >= 0.8) return "text-orange-500 font-medium";
  return "text-teal-600";
}

export default function TodaySessionsTable() {
  const { classes, teachers, rooms, enrollments } = useData();
  const todayStr = today();

  const activeClasses = useMemo(() => classes.filter((c) => c.status === "פעיל"), [classes]);

  const sessions = useMemo(() => {
    const results: Array<{
      id: string;
      clsName: string;
      slotStartTime: string;
      slotEndTime: string;
      roomName: string;
      teacherName: string;
      enrolled: number;
      capacity: number;
    }> = [];

    for (const cls of activeClasses) {
      for (const slot of cls.slots ?? []) {
        if (slotOccursOnDate(slot, todayStr)) {
          const room = rooms.find((r) => r.id === slot.room_id);
          const teacher = teachers.find((t) => t.id === cls.teacher_id);
          const enrolled = enrollments.filter(
            (e) => e.class_id === cls.id && e.status === "פעיל"
          ).length;
          results.push({
            id: `${cls.id}-${slot.start_time}`,
            clsName: cls.name,
            slotStartTime: slot.start_time,
            slotEndTime: slot.end_time,
            roomName: room?.name ?? "—",
            teacherName: teacher ? `${teacher.first_name} ${teacher.last_name}` : "—",
            enrolled,
            capacity: cls.capacity,
          });
        }
      }
    }

    return results.sort((a, b) => a.slotStartTime.localeCompare(b.slotStartTime));
  }, [activeClasses, rooms, teachers, enrollments, todayStr]);

  const dateLabel = new Date().toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        מפגשים היום — {dateLabel}
      </h2>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
          אין מפגשים מתוכננים להיום
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs">
                <th className="text-right px-4 py-3 font-medium">שעה</th>
                <th className="text-right px-4 py-3 font-medium">חוג</th>
                <th className="text-right px-4 py-3 font-medium">חדר</th>
                <th className="text-right px-4 py-3 font-medium">מדריך</th>
                <th className="text-right px-4 py-3 font-medium">רישומים</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(({ id, clsName, slotStartTime, slotEndTime, roomName, teacherName, enrolled, capacity }) => {
                const ratio = capacity > 0 ? enrolled / capacity : 0;
                return (
                  <tr key={id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                      {slotStartTime}–{slotEndTime}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{clsName}</td>
                    <td className="px-4 py-3 text-gray-500">{roomName}</td>
                    <td className="px-4 py-3 text-gray-500">{teacherName}</td>
                    <td className={`px-4 py-3 ${enrollmentColor(ratio)}`}>
                      {enrolled} / {capacity}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
