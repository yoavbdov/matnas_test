// The main scrollable calendar grid — sticky header + scrollable time+day columns
import { useRef, useEffect } from "react";
import { HOUR_HEIGHT, START_HOUR } from "./calendarUtils";
import TimeColumn from "./TimeColumn";
import DayColumn from "./DayColumn";
import DayHeaderRow from "./DayHeaderRow";
import type { DayData } from "./calendarTypes";
import type { Class, Tournament, Event, TournamentRound } from "@/lib/types";

interface Props {
  days: DayData[];
  onEventClick: (cls: Class) => void;
  onTournamentClick?: (t: Tournament, dateStr: string) => void;
  onEventItemClick?: (ev: Event) => void;
  onEventContextMenu?: (e: React.MouseEvent, cls: Class, dateStr: string) => void;
  onTournamentContextMenu?: (e: React.MouseEvent, t: Tournament, round: TournamentRound, dateStr: string) => void;
  onEventItemContextMenu?: (e: React.MouseEvent, ev: Event, dateStr: string) => void;
}

export default function CalendarGrid({
  days, onEventClick, onTournamentClick, onEventItemClick,
  onEventContextMenu, onTournamentContextMenu, onEventItemContextMenu,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // On first render, scroll to START_HOUR (default 8:00) so mornings are visible
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (START_HOUR - 0.5) * HOUR_HEIGHT;
    }
  }, []);

  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
      {/* Fixed day-name header row */}
      <DayHeaderRow days={days} />

      {/* Scrollable body — 14 hours visible by default (08:00–22:00), full 24h scrollable */}
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ maxHeight: `${HOUR_HEIGHT * 14}px` }}
      >
        {/* RTL: Sunday on the right, Saturday on the left, time column on the far left */}
        <div className="flex" dir="rtl">
          {days.map((day) => (
            <DayColumn
              key={day.dateStr} day={day}
              onEventClick={onEventClick}
              onTournamentClick={onTournamentClick}
              onEventItemClick={onEventItemClick}
              onEventContextMenu={onEventContextMenu}
              onTournamentContextMenu={onTournamentContextMenu}
              onEventItemContextMenu={onEventItemContextMenu}
            />
          ))}
          <TimeColumn />
        </div>
      </div>
    </div>
  );
}
