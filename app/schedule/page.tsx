"use client";
import { useState, useMemo } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { useData } from "@/context/DataContext";
import { getSlotsForWeek } from "@/lib/scheduleHelpers";
import { DAYS } from "@/lib/constants";

function getMondaySunday(date: Date): Date {
  // Week starts on Sunday in Israel
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // go to Sunday
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export default function SchedulePage() {
  const { classes, teachers, rooms } = useData();
  const [weekStart, setWeekStart] = useState(() => getMondaySunday(new Date()));

  const weekDates = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const slots = useMemo(() =>
    getSlotsForWeek(classes, formatDate(weekStart)),
    [classes, weekStart]
  );

  function prevWeek() { setWeekStart((d) => addDays(d, -7)); }
  function nextWeek() { setWeekStart((d) => addDays(d, 7)); }
  function goToday() { setWeekStart(getMondaySunday(new Date())); }

  const todayStr = formatDate(new Date());

  const weekLabel = `${weekDates[0].toLocaleDateString("he-IL", { day: "numeric", month: "long" })} – ${weekDates[6].toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })}`;

  return (
    <PageShell title="לוח זמנים">
      {/* Week navigation */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={prevWeek} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
          <ChevronRight size={16} />
        </button>
        <button onClick={nextWeek} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-gray-700">{weekLabel}</span>
        <button onClick={goToday} className="mr-2 text-xs text-teal-600 hover:text-teal-800 border border-teal-200 rounded-lg px-2.5 py-1">
          היום
        </button>
        <span className="text-xs text-gray-400 mr-auto">{slots.length} מפגשים השבוע</span>
      </div>

      {/* Weekly grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date) => {
          const dateStr = formatDate(date);
          const dayName = DAYS[date.getDay()];
          const isToday = dateStr === todayStr;
          const daySlots = slots
            .filter((s) => s.date === dateStr)
            .sort((a, b) => a.slot.start_time.localeCompare(b.slot.start_time));

          return (
            <div key={dateStr} className={`min-h-50 rounded-xl border ${isToday ? "border-teal-400 bg-teal-50/40" : "border-gray-100 bg-white"} p-2`}>
              {/* Day header */}
              <div className={`text-center mb-2 pb-2 border-b ${isToday ? "border-teal-200" : "border-gray-100"}`}>
                <p className={`text-xs font-semibold ${isToday ? "text-teal-700" : "text-gray-500"}`}>{dayName}</p>
                <p className={`text-lg font-bold ${isToday ? "text-teal-600" : "text-gray-700"}`}>
                  {date.getDate()}
                </p>
              </div>

              {/* Slots */}
              <div className="space-y-1.5">
                {daySlots.length === 0 && (
                  <p className="text-center text-xs text-gray-300 mt-4">—</p>
                )}
                {daySlots.map(({ classId, slot }) => {
                  const cls = classes.find((c) => c.id === classId);
                  if (!cls) return null;
                  const teacher = teachers.find((t) => t.id === cls.teacher_id);
                  const room = rooms.find((r) => r.id === slot.room_id);
                  return (
                    <div
                      key={`${classId}-${slot.id}`}
                      className="rounded-lg p-2 text-white text-xs"
                      style={{ background: cls.color ?? "#14b8a6" }}
                    >
                      <p className="font-semibold truncate">{cls.name}</p>
                      <p className="opacity-90">{slot.start_time}–{slot.end_time}</p>
                      {teacher && <p className="opacity-80 truncate">{teacher.first_name} {teacher.last_name}</p>}
                      {room && <p className="opacity-80 truncate">{room.name}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
