/*
  attendanceHelpers — utilities for the attendance module.
  Main export: getPastSessionDates(classItem, today)
  Returns all dates (YYYY-MM-DD) on which a class had a session, up to and including today.
  Uses the existing slotOccursOnDate helper from scheduleHelpers.
*/
import { slotOccursOnDate } from "@/lib/schedule/scheduleHelpers";
import type { Class } from "@/types";

// Format a Date object as YYYY-MM-DD (local time, not UTC)
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Parse YYYY-MM-DD to a local Date object
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Returns all past (and today) session dates for a class, newest first.
 * Iterates day-by-day from the earliest slot start_date up to today.
 * Capped at 365 days back from today to keep it fast.
 */
export function getPastSessionDates(classItem: Class, today: string): string[] {
  const slots = classItem.slots ?? [];
  if (slots.length === 0) return [];

  // Find the earliest start date across all slots
  const startDates = slots
    .map((s) => s.start_date)
    .filter(Boolean)
    .sort();
  if (startDates.length === 0) return [];

  const todayDate = parseDate(today);

  // Don't look back more than 365 days — avoids long loops for old classes
  const limitDate = new Date(todayDate);
  limitDate.setDate(limitDate.getDate() - 365);

  const earliest = parseDate(startDates[0]);
  const scanFrom = earliest > limitDate ? earliest : limitDate;

  const dates: string[] = [];

  // Walk from scanFrom to today
  const cursor = new Date(scanFrom);
  while (cursor <= todayDate) {
    const dateStr = toDateStr(cursor);
    // Check if any slot occurs on this date
    const hasSession = slots.some((slot) => slotOccursOnDate(slot, dateStr));
    if (hasSession) {
      dates.push(dateStr);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  // Return newest first
  return dates.reverse();
}

// Format YYYY-MM-DD to a human-readable Hebrew date string
export function formatHebrewDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const dayName = DAYS[date.getDay()];
  return `${dayName}, ${d}/${m}/${y}`;
}
