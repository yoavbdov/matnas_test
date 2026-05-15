/*
  ROOM AVAILABILITY — pure functions, no Firebase, no UI.

  Given a date + time window, returns which rooms are free vs. busy.
  A room is "busy" if any of the following overlap:
    - A class with a slot in that room (room_id match) on that date + time
    - A tournament with a round (or recurring) in that room (name match) on that date + time
    - An event (one-time or recurring) in that room (name match) on that date + time
*/

import { timeToMins } from "@/lib/utils/utils";
import { slotOccursOnDate } from "@/lib/schedule/scheduleHelpers";
import type { Room, Class, Tournament, Event } from "@/types";

const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export interface RoomConflict {
  label: string;
  type: "חוג" | "תחרות" | "אירוע";
  start_time: string;
  end_time: string;
}

export interface RoomAvailabilityResult {
  room: Room;
  conflicts: RoomConflict[];
}

export interface RoomAvailabilityReport {
  free: Room[];
  busy: RoomAvailabilityResult[];
}

function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return timeToMins(s1) < timeToMins(e2) && timeToMins(s2) < timeToMins(e1);
}

// Returns true if the event occurs on the given date
function eventOccursOnDate(event: Event, date: string): boolean {
  if (event.recurrence_type === "חד פעמי") return event.date === date;

  // חוזר — check day-of-week
  const dayName = HEBREW_DAYS[new Date(date).getDay()];
  if (!(event.days_of_week ?? []).includes(dayName)) return false;
  if (event.start_date && date < event.start_date) return false;
  if (!event.is_permanent && event.end_date && date > event.end_date) return false;
  if ((event.cancelled_dates ?? []).includes(date)) return false;
  return true;
}

export function checkRoomAvailability(
  rooms: Room[],
  classes: Class[],
  tournaments: Tournament[],
  events: Event[],
  date: string,      // YYYY-MM-DD
  startTime: string, // HH:MM
  endTime: string,   // HH:MM
): RoomAvailabilityReport {
  const free: Room[] = [];
  const busy: RoomAvailabilityResult[] = [];

  for (const room of rooms) {
    const conflicts: RoomConflict[] = [];

    // ── חוגים ── (room_id match on slot)
    for (const cls of classes) {
      if (cls.status === "בוטל" || cls.status === "הסתיים") continue;
      if ((cls.cancelled_dates ?? []).includes(date)) continue;
      for (const slot of cls.slots ?? []) {
        if (slot.room_id !== room.id) continue;
        if (!slotOccursOnDate(slot, date)) continue;
        if (timesOverlap(slot.start_time, slot.end_time, startTime, endTime)) {
          conflicts.push({ label: cls.name, type: "חוג", start_time: slot.start_time, end_time: slot.end_time });
        }
      }
    }

    // ── תחרויות ── (room name match — free text)
    for (const t of tournaments) {
      if (t.status === "בוטל") continue;
      if (t.room !== room.name) continue;
      if ((t.cancelled_dates ?? []).includes(date)) continue;
      if (t.is_recurring) {
        if (t.recurring_date === date) {
          const s = t.recurring_start_time ?? "";
          const e = t.recurring_end_time ?? "";
          if (s && e && timesOverlap(s, e, startTime, endTime)) {
            conflicts.push({ label: t.name, type: "תחרות", start_time: s, end_time: e });
          }
        }
      } else {
        for (const round of t.rounds ?? []) {
          if (round.date === date && timesOverlap(round.start_time, round.end_time, startTime, endTime)) {
            conflicts.push({ label: `${t.name} (סיבוב ${round.round_number})`, type: "תחרות", start_time: round.start_time, end_time: round.end_time });
          }
        }
      }
    }

    // ── אירועים ── (room name match — free text)
    for (const ev of events) {
      if (ev.room !== room.name) continue;
      if (!eventOccursOnDate(ev, date)) continue;
      if (timesOverlap(ev.start_time, ev.end_time, startTime, endTime)) {
        conflicts.push({ label: ev.name, type: "אירוע", start_time: ev.start_time, end_time: ev.end_time });
      }
    }

    if (conflicts.length === 0) {
      free.push(room);
    } else {
      busy.push({ room, conflicts });
    }
  }

  return { free, busy };
}
