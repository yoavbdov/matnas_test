// A single class event block, absolutely positioned inside a DayColumn
import { timeToMinutes, minutesToPx } from "./calendarUtils";
import type { CalendarEventData } from "./calendarTypes";
import type { Class } from "@/lib/types";

interface Props extends CalendarEventData {
  colIndex: number; // which column within a day (for overlapping events)
  colCount: number; // total columns in this day
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export default function CalendarEvent({
  classItem, slot, teacher, room, hasConflict,
  colIndex, colCount, onClick, onContextMenu,
}: Props) {
  const startMin = timeToMinutes(slot.start_time);
  const endMin = timeToMinutes(slot.end_time);
  const top = minutesToPx(startMin);
  const height = Math.max(minutesToPx(endMin - startMin), 24);
  const widthPct = 100 / colCount;

  return (
    <div
      onClick={onClick}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e); }}
      className={`absolute rounded-md px-1.5 py-1 text-white text-xs cursor-pointer
        hover:brightness-95 overflow-hidden transition-all
        ${hasConflict ? "ring-2 ring-red-400 ring-offset-1" : ""}`}
      style={{
        top: top + 1,
        height: height - 2,
        left: `calc(${colIndex * widthPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        background: classItem.color ?? "#14b8a6",
        zIndex: 10,
      }}
    >
      {/* Class name — always shown */}
      <p className="font-semibold leading-tight truncate">{classItem.name}</p>

      {/* Time range — always shown */}
      <p className="opacity-90 truncate">{slot.start_time}–{slot.end_time}</p>

      {/* Teacher name — only if there's enough height */}
      {height > 52 && teacher && (
        <p className="opacity-80 truncate text-[10px]">
          {teacher.first_name} {teacher.last_name}
        </p>
      )}

      {/* Room — only if there's even more height */}
      {height > 72 && room && (
        <p className="opacity-80 truncate text-[10px]">{room.name}</p>
      )}

      {hasConflict && <span className="text-[10px] font-bold block">⚠ קונפליקט</span>}
    </div>
  );
}
