// Sticky header row above the calendar grid — shows day name + date number
import { DAYS } from "@/lib/config/constants";
import type { DayData } from "./calendarTypes";

interface Props {
  days: DayData[];
}

export default function DayHeaderRow({ days }: Props) {
  return (
    // RTL: Sunday on the right, Saturday on the left
    <div className="flex border-b border-gray-200 bg-white sticky top-0 z-20" dir="rtl">
      {days.map((day) => {
        const dayName = DAYS[day.date.getDay()];
        return (
          <div
            key={day.dateStr}
            className={`flex-1 text-center py-2 border-l border-gray-100 ${
              day.isToday ? "bg-blue-50" : ""
            }`}
          >
            {/* Hebrew day name */}
            <p className={`text-xs font-medium ${day.isToday ? "text-blue-600" : "text-gray-500"}`}>
              {dayName}
            </p>

            {/* Date number — circle highlight for today */}
            <div
              className={`mx-auto mt-0.5 w-8 h-8 flex items-center justify-center rounded-full
                text-sm font-bold ${day.isToday ? "bg-blue-600 text-white" : "text-gray-700"}`}
            >
              {day.date.getDate()}
            </div>
          </div>
        );
      })}

      {/* Empty cell aligned with TimeColumn on the left */}
      <div className="w-16 flex-shrink-0 border-l border-gray-100" />
    </div>
  );
}
