// Left column in the calendar grid — shows hour labels (00:00 – 23:00)
import { HOUR_HEIGHT } from "./calendarUtils";

export default function TimeColumn() {
  return (
    <div
      className="w-16 flex-shrink-0 relative select-none bg-white"
      style={{ height: HOUR_HEIGHT * 24 }}
    >
      {Array.from({ length: 24 }, (_, h) => (
        <div
          key={h}
          className="absolute w-full text-xs text-gray-400 text-right pr-3"
          // offset by -8px so the label sits above the grid line
          style={{ top: h * HOUR_HEIGHT - 8 }}
        >
          {/* skip 00:00 — it clutters the very top */}
          {h > 0 && `${String(h).padStart(2, "0")}:00`}
        </div>
      ))}
    </div>
  );
}
