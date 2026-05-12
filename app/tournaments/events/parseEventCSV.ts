// ניתוח קובץ CSV לייבוא אירועים
import type { Event } from "@/lib/types";

export interface ParsedEventRow {
  lineNum: number;
  name?: string;
  description?: string;
  recurrence_type?: Event["recurrence_type"];
  start_time?: string;
  end_time?: string;
  room?: string;
  date?: string;
  days_of_week?: string[];
  notes?: string;
  errors: string[];
}

export const EVENT_TEMPLATE_HEADERS = [
  "שם*", "תיאור", "סוג חזרה (חד פעמי/חוזר)*",
  "שעת התחלה* (HH:MM)", "שעת סיום* (HH:MM)", "חדר",
  "תאריך (YYYY-MM-DD, לחד פעמי)", "ימים (לחוזר — מופרדים ב|)", "הערות",
];

export const EVENT_TEMPLATE_EXAMPLE = [
  "יום עיון", "", "חד פעמי",
  "09:00", "17:00", "אולם ראשי",
  "2026-06-15", "", "אירוע שנתי",
];

const VALID_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

// ולידציה פורמט HH:MM
function isValidTime(t: string): boolean {
  return /^\d{2}:\d{2}$/.test(t);
}

// ולידציה פורמט YYYY-MM-DD
function isValidDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

export function parseEventCSV(text: string): ParsedEventRow[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  return lines.slice(1).map((line, i) => {
    const cols = line.split(/,|;/).map((c) => {
      const t = c.trim();
      if (/^=".*"$/.test(t)) return t.slice(2, -1);
      return t.replace(/^"|"$/g, "");
    });

    const [nameRaw, description, recurrenceRaw, startTime, endTime, room, dateRaw, daysRaw, notes] = cols;
    const errors: string[] = [];

    if (!nameRaw?.trim()) errors.push("שם חסר");

    const recurrence_type = recurrenceRaw?.trim() as Event["recurrence_type"];
    if (!recurrence_type || !["חד פעמי", "חוזר"].includes(recurrence_type)) {
      errors.push("סוג חזרה חייב להיות 'חד פעמי' או 'חוזר'");
    }

    if (!startTime?.trim()) errors.push("שעת התחלה חסרה");
    else if (!isValidTime(startTime.trim())) errors.push("שעת התחלה לא תקינה (HH:MM)");

    if (!endTime?.trim()) errors.push("שעת סיום חסרה");
    else if (!isValidTime(endTime.trim())) errors.push("שעת סיום לא תקינה (HH:MM)");

    // ולידציה לפי סוג חזרה
    let date: string | undefined;
    let days_of_week: string[] | undefined;

    if (recurrence_type === "חד פעמי") {
      if (!dateRaw?.trim()) {
        errors.push("תאריך חסר לאירוע חד פעמי");
      } else if (!isValidDate(dateRaw.trim())) {
        errors.push("תאריך לא תקין (YYYY-MM-DD)");
      } else {
        date = dateRaw.trim();
      }
    } else if (recurrence_type === "חוזר") {
      if (!daysRaw?.trim()) {
        errors.push("ימים חסרים לאירוע חוזר");
      } else {
        const parsed = daysRaw.trim().split("|").map((d) => d.trim()).filter(Boolean);
        const invalid = parsed.filter((d) => !VALID_DAYS.includes(d));
        if (invalid.length > 0) errors.push(`ימים לא חוקיים: ${invalid.join(", ")}`);
        else days_of_week = parsed;
      }
    }

    return {
      lineNum: i + 2,
      name: nameRaw?.trim() || undefined,
      description: description?.trim() || undefined,
      recurrence_type: ["חד פעמי", "חוזר"].includes(recurrence_type) ? recurrence_type : undefined,
      start_time: startTime?.trim() || undefined,
      end_time: endTime?.trim() || undefined,
      room: room?.trim() || undefined,
      date,
      days_of_week,
      notes: notes?.trim() || undefined,
      errors,
    };
  });
}
