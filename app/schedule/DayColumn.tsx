// One day column in the calendar grid — draws hour lines and positions events
import { HOUR_HEIGHT, timeToMinutes } from "./calendarUtils";
import CalendarEvent from "./CalendarEvent";
import type { CalendarEventData, DayData } from "./calendarTypes";
import type { Class } from "@/lib/types";

interface Props {
  day: DayData;
  onEventClick: (cls: Class) => void;
}

// Greedy column assignment so overlapping events appear side-by-side
function layoutEvents(events: CalendarEventData[]) {
  const sorted = [...events].sort(
    (a, b) => timeToMinutes(a.slot.start_time) - timeToMinutes(b.slot.start_time)
  );

  const colEnds: number[] = []; // last end-minute of each column

  const assigned = sorted.map((ev) => {
    const start = timeToMinutes(ev.slot.start_time);
    const end = timeToMinutes(ev.slot.end_time);
    // find an existing column that has finished before this event starts
    const col = colEnds.findIndex((e) => e <= start);
    const colIndex = col === -1 ? colEnds.length : col;
    if (col === -1) colEnds.push(end);
    else colEnds[col] = end;
    return { ...ev, colIndex };
  });

  const colCount = colEnds.length || 1;
  return assigned.map((ev) => ({ ...ev, colCount }));
}

export default function DayColumn({ day, onEventClick }: Props) {
  const laid = layoutEvents(day.events);

  return (
    <div
      className={`relative flex-1 min-w-0 border-l border-gray-100 ${
        day.isToday ? "bg-blue-50/20" : "bg-white"
      }`}
      style={{ height: HOUR_HEIGHT * 24 }}
    >
      {/* Full-hour lines */}
      {Array.from({ length: 24 }, (_, h) => (
        <div
          key={h}
          className="absolute w-full border-t border-gray-100"
          style={{ top: h * HOUR_HEIGHT }}
        />
      ))}

      {/* Half-hour dashed lines */}
      {Array.from({ length: 24 }, (_, h) => (
        <div
          key={`half-${h}`}
          className="absolute w-full border-t border-gray-50 border-dashed"
          style={{ top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
        />
      ))}

      {/* Events */}
      {laid.map(({ classItem, slot, teacher, room, enrollCount, hasConflict, colIndex, colCount }) => (
        <CalendarEvent
          key={`${classItem.id}-${slot.id}`}
          classItem={classItem}
          slot={slot}
          teacher={teacher}
          room={room}
          enrollCount={enrollCount}
          hasConflict={hasConflict}
          colIndex={colIndex}
          colCount={colCount}
          onClick={() => onEventClick(classItem)}
        />
      ))}
    </div>
  );
}
