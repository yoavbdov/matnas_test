// One day column in the calendar grid — draws hour lines and positions events
// Renders class events, tournament round events, and event items, laid out side-by-side when they overlap.
import { HOUR_HEIGHT, timeToMinutes } from "./calendarUtils";
import CalendarEvent from "./CalendarEvent";
import TournamentCalendarEvent from "./TournamentCalendarEvent";
import EventCalendarEvent from "./EventCalendarEvent";
import type { CalendarEventData, TournamentEventData, EventCalendarData, DayData } from "./calendarTypes";
import type { Class, Tournament, Event, TournamentRound } from "@/types";

interface Props {
  day: DayData;
  onEventClick: (cls: Class) => void;
  onTournamentClick?: (t: Tournament, dateStr: string) => void;
  onEventItemClick?: (ev: Event) => void;
  // right-click handlers — receive the native mouse event + data about the item
  onEventContextMenu?: (e: React.MouseEvent, cls: Class, dateStr: string) => void;
  onTournamentContextMenu?: (e: React.MouseEvent, t: Tournament, round: TournamentRound, dateStr: string) => void;
  onEventItemContextMenu?: (e: React.MouseEvent, ev: Event, dateStr: string) => void;
}

// Each item in the unified layout has a kind + start/end for sorting/overlap detection
type LayoutClass = { kind: "class" } & CalendarEventData;
type LayoutTournament = { kind: "tournament" } & TournamentEventData;
type LayoutEventItem = { kind: "event" } & EventCalendarData;
type LayoutItem = LayoutClass | LayoutTournament | LayoutEventItem;

function getTime(item: LayoutItem): { start: number; end: number } {
  if (item.kind === "class") {
    return { start: timeToMinutes(item.slot.start_time), end: timeToMinutes(item.slot.end_time) };
  }
  if (item.kind === "tournament") {
    return { start: timeToMinutes(item.round.start_time), end: timeToMinutes(item.round.end_time) };
  }
  // event
  return { start: timeToMinutes(item.event.start_time), end: timeToMinutes(item.event.end_time) };
}

// Greedy column assignment so overlapping events appear side-by-side
function layoutItems(items: LayoutItem[]) {
  const sorted = [...items].sort((a, b) => getTime(a).start - getTime(b).start);
  const colEnds: number[] = [];

  const assigned = sorted.map((item) => {
    const { start, end } = getTime(item);
    const col = colEnds.findIndex((e) => e <= start);
    const colIndex = col === -1 ? colEnds.length : col;
    if (col === -1) colEnds.push(end);
    else colEnds[col] = end;
    return { ...item, colIndex };
  });

  const colCount = colEnds.length || 1;
  return assigned.map((item) => ({ ...item, colCount }));
}

export default function DayColumn({
  day,
  onEventClick, onTournamentClick, onEventItemClick,
  onEventContextMenu, onTournamentContextMenu, onEventItemContextMenu,
}: Props) {
  // Combine all three types into one unified layout for overlap detection
  const classItems: LayoutItem[] = day.events.map((e) => ({ kind: "class" as const, ...e }));
  const tournamentItems: LayoutItem[] = (day.tournamentEvents ?? []).map((e) => ({ kind: "tournament" as const, ...e }));
  const eventItems: LayoutItem[] = (day.eventItems ?? []).map((e) => ({ kind: "event" as const, ...e }));
  const laid = layoutItems([...classItems, ...tournamentItems, ...eventItems]);

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

      {/* Events — class or tournament */}
      {laid.map((item) => {
        if (item.kind === "class") {
          const { classItem, slot, teacher, room, enrollCount, hasConflict, colIndex, colCount } = item;
          return (
            <CalendarEvent
              key={`class-${classItem.id}-${slot.id}`}
              classItem={classItem}
              slot={slot}
              teacher={teacher}
              room={room}
              enrollCount={enrollCount}
              hasConflict={hasConflict}
              colIndex={colIndex}
              colCount={colCount}
              onClick={() => onEventClick(classItem)}
              onContextMenu={(e) => onEventContextMenu?.(e, classItem, day.dateStr)}
            />
          );
        }
        if (item.kind === "tournament") {
          const { tournament, round, hasConflict, isRecurring, colIndex, colCount } = item;
          return (
            <TournamentCalendarEvent
              key={`tournament-${tournament.id}-${round.id}`}
              tournament={tournament}
              round={round}
              hasConflict={hasConflict}
              isRecurring={isRecurring}
              colIndex={colIndex}
              colCount={colCount}
              onClick={() => onTournamentClick?.(tournament, day.dateStr)}
              onContextMenu={(e) => onTournamentContextMenu?.(e, tournament, round, day.dateStr)}
            />
          );
        }
        // אירוע (event)
        const { event, hasConflict, colIndex, colCount } = item;
        return (
          <EventCalendarEvent
            key={`event-${event.id}`}
            event={event}
            hasConflict={hasConflict}
            colIndex={colIndex}
            colCount={colCount}
            onClick={() => onEventItemClick?.(event)}
            onContextMenu={(e) => onEventItemContextMenu?.(e, event, day.dateStr)}
          />
        );
      })}
    </div>
  );
}
