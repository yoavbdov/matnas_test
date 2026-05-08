// Local types used across the calendar components
import type { Class, Teacher, Room, ScheduleSlot, Tournament, TournamentRound } from "@/lib/types";

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

/** All data needed to render one day column */
export interface DayData {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  isToday: boolean;
  events: CalendarEventData[];           // class events
  tournamentEvents: TournamentEventData[]; // tournament round events
}

export type ViewMode = "week" | "day";
