// Local types used across the calendar components
import type { Class, Teacher, Room, ScheduleSlot } from "@/lib/types";

/** A single event to render in the calendar grid */
export interface CalendarEventData {
  classItem: Class;
  slot: ScheduleSlot;
  teacher?: Teacher;
  room?: Room;
  enrollCount: number;
  hasConflict: boolean;
}

/** All data needed to render one day column */
export interface DayData {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  isToday: boolean;
  events: CalendarEventData[];
}

export type ViewMode = "week" | "day";
