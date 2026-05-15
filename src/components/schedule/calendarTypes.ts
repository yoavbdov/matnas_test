// Local types used across the calendar components
import type { Class, Teacher, Room, ScheduleSlot, Tournament, TournamentRound, Event } from "@/types";

/** A single class event to render in the calendar grid */
export interface CalendarEventData {
  classItem: Class;
  slot: ScheduleSlot;
  teacher?: Teacher;
  room?: Room;
  enrollCount: number;
  hasConflict: boolean;
}

/** A tournament round event to render in the calendar grid */
export interface TournamentEventData {
  tournament: Tournament;
  round: TournamentRound;
  hasConflict: boolean;
  isRecurring?: boolean; // true for recurring tournaments (no fixed rounds)
}

/** An event (אירוע) to render in the calendar grid */
export interface EventCalendarData {
  event: Event;
  hasConflict: boolean;
}

/** All data needed to render one day column */
export interface DayData {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  isToday: boolean;
  events: CalendarEventData[];             // class events
  tournamentEvents: TournamentEventData[]; // tournament round events
  eventItems: EventCalendarData[];         // אירועים (ללא ציוד / מדריך)
}

export type ViewMode = "week" | "day";
