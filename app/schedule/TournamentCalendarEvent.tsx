// A tournament round block in the calendar — visually distinct from class events
import { timeToMinutes, minutesToPx } from "./calendarUtils";
import type { TournamentEventData } from "./calendarTypes";

interface Props extends TournamentEventData {
  colIndex: number;
  colCount: number;
  onClick: () => void;
  isRecurring?: boolean;
}

export default function TournamentCalendarEvent({
  tournament, round, hasConflict, isRecurring, colIndex, colCount, onClick,
}: Props) {
  const startMin = timeToMinutes(round.start_time);
  const endMin = timeToMinutes(round.end_time);
  const top = minutesToPx(startMin);
  const height = Math.max(minutesToPx(endMin - startMin), 24);
  const widthPct = 100 / colCount;
  const color = tournament.color ?? "#f97316"; // orange default for tournaments

  return (
    <div
      onClick={onClick}
      className={`absolute rounded-md px-1.5 py-1 text-white text-xs cursor-pointer
        hover:brightness-95 overflow-hidden transition-all border-2 border-dashed border-white/40
        ${hasConflict ? "ring-2 ring-red-400 ring-offset-1" : ""}`}
      style={{
        top: top + 1,
        height: height - 2,
        left: `calc(${colIndex * widthPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        background: color,
        zIndex: 10,
        opacity: 0.9,
      }}
    >
      {/* Trophy icon + tournament name */}
      <p className="font-semibold leading-tight truncate">🏆 {tournament.name}</p>

      {/* Round info: recurring tournaments show "שבועי", others show round number */}
      <p className="opacity-90 truncate">
        {isRecurring ? "שבועי" : `סיבוב ${round.round_number}`} • {round.start_time}–{round.end_time}
      </p>

      {/* Location if enough height */}
      {height > 52 && round.location && (
        <p className="opacity-80 truncate text-[10px]">📍 {round.location}</p>
      )}

      {hasConflict && <span className="text-[10px] font-bold block">⚠ התנגשות</span>}
    </div>
  );
}
