"use client";
import { useState, useMemo } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import ScheduleCard from "./ScheduleCard";
import ViewExistingClassDetailModal from "@/app/classes/ViewExistingClassDetailModal";
import { useData } from "@/context/DataContext";
import { getSlotsForWeek } from "@/lib/scheduleHelpers";
import { getConflictingClassIds } from "@/lib/classHelpers";
import { DAYS } from "@/lib/constants";
import type { Class } from "@/lib/types";

function getMondayOfWeek(date: Date): Date {
  // Week starts on Sunday in Israel
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // go to Sunday
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export default function SchedulePage() {
  const { classes, teachers, rooms, resources, students, enrollments } = useData();
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()));
  const [detailClass, setDetailClass] = useState<Class | null>(null);

  const weekDates = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const slots = useMemo(() =>
    getSlotsForWeek(classes, weekStart.toISOString().slice(0, 10)),
    [classes, weekStart]
  );

  // Build conflict set for all classes
  const conflictIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cls of classes) {
      const conflicting = getConflictingClassIds(cls, classes);
      if (conflicting.length > 0) ids.add(cls.id);
    }
    return ids;
  }, [classes]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const weekLabel = `${weekDates[0].toLocaleDateString("he-IL", { day: "numeric", month: "long" })} – ${
    weekDates[6].toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })
  }`;

  return (
    <PageShell title="לוח זמנים">
      {/* Navigation bar */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setWeekStart((d) => addDays(d, -7))} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
          <ChevronRight size={16} />
        </button>
        <button onClick={() => setWeekStart((d) => addDays(d, 7))} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-gray-700">{weekLabel}</span>
        <button
          onClick={() => setWeekStart(getMondayOfWeek(new Date()))}
          className="mr-2 text-xs text-teal-600 hover:text-teal-800 border border-teal-200 rounded-lg px-2.5 py-1"
        >
          היום
        </button>
        <span className="text-xs text-gray-400 mr-auto">{slots.length} מפגשים השבוע</span>
      </div>

      {/* 7-day grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date) => {
          const dateStr = date.toISOString().slice(0, 10);
          const dayName = DAYS[date.getDay()];
          const isToday = dateStr === todayStr;

          const daySlots = slots
            .filter((s) => s.date === dateStr)
            .sort((a, b) => a.slot.start_time.localeCompare(b.slot.start_time));

          return (
            <div
              key={dateStr}
              className={`min-h-[180px] rounded-xl border p-2 ${
                isToday ? "border-teal-400 bg-teal-50/40" : "border-gray-100 bg-white"
              }`}
            >
              {/* Day header */}
              <div className={`text-center mb-2 pb-2 border-b ${isToday ? "border-teal-200" : "border-gray-100"}`}>
                <p className={`text-xs font-semibold ${isToday ? "text-teal-700" : "text-gray-500"}`}>{dayName}</p>
                <p className={`text-lg font-bold ${isToday ? "text-teal-600" : "text-gray-700"}`}>{date.getDate()}</p>
              </div>

              {/* Slot cards */}
              <div className="space-y-1.5">
                {daySlots.length === 0 && (
                  <p className="text-center text-xs text-gray-300 mt-4">—</p>
                )}
                {daySlots.map(({ classId, slot }) => {
                  const cls = classes.find((c) => c.id === classId);
                  if (!cls) return null;
                  const teacher = teachers.find((t) => t.id === cls.teacher_id);
                  const room = rooms.find((r) => r.id === slot.room_id);
                  const enrolled = enrollments.filter((e) => e.class_id === classId && e.status === "פעיל").length;

                  return (
                    <ScheduleCard
                      key={`${classId}-${slot.id}`}
                      classItem={cls}
                      slot={slot}
                      teacher={teacher}
                      room={room}
                      enrollCount={enrolled}
                      hasConflict={conflictIds.has(classId)}
                      onClick={() => setDetailClass(cls)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Class detail modal (opened by clicking a card) */}
      {detailClass && (
        <ViewExistingClassDetailModal
          classItem={detailClass}
          teachers={teachers}
          rooms={rooms}
          resources={resources}
          students={students}
          enrollments={enrollments}
          allClasses={classes}
          onClose={() => setDetailClass(null)}
          onEdit={() => setDetailClass(null)} // edit opens in classes page
        />
      )}
    </PageShell>
  );
}
