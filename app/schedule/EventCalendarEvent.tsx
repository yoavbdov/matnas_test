// בלוק אירוע בלוח הזמנים — עיצוב שונה מחוג ומתחרות
import { timeToMinutes, minutesToPx } from "./calendarUtils";
import type { EventCalendarData } from "./calendarTypes";

interface Props extends EventCalendarData {
  colIndex: number;
  colCount: number;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export default function EventCalendarEvent({ event, hasConflict, colIndex, colCount, onClick, onContextMenu }: Props) {
  const startMin = timeToMinutes(event.start_time);
  const endMin = timeToMinutes(event.end_time);
  const top = minutesToPx(startMin);
  const height = Math.max(minutesToPx(endMin - startMin), 24);
  const widthPct = 100 / colCount;
  const color = event.color ?? "#8b5cf6"; // violet כצבע ברירת מחדל לאירועים

  return (
    <div
      onClick={onClick}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e); }}
      className={`absolute rounded-md px-1.5 py-1 text-white text-xs cursor-pointer hover:brightness-95 overflow-hidden transition-all border-2 border-dotted border-white/50
        ${hasConflict ? "ring-2 ring-red-400 ring-offset-1" : ""}`}
      style={{
        top: top + 1,
        height: height - 2,
        left: `calc(${colIndex * widthPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        background: color,
        zIndex: 10,
        opacity: 0.85,
      }}
    >
      {/* אזהרת התנגשות */}
      {hasConflict && <span className="text-[10px] font-bold block">⚠ התנגשות</span>}

      {/* שם האירוע */}
      <p className="font-semibold leading-tight truncate">📅 {event.name}</p>

      {/* שעות + חדר */}
      <p className="opacity-90 truncate">
        {event.start_time}–{event.end_time}
        {event.room ? ` • ${event.room}` : ""}
      </p>

      {/* סוג (חוזר / חד-פעמי) — רק אם יש מקום */}
      {height > 52 && (
        <p className="opacity-75 truncate text-[10px]">
          {event.recurrence_type === "חוזר" ? "🔁 קבוע" : "חד-פעמי"}
        </p>
      )}
    </div>
  );
}
