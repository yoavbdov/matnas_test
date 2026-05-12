// ייצוא אירועים לקובץ CSV
import type { Event } from "@/lib/types";

function escapeCell(v: string | number): string {
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportEventsCsv(events: Event[]): void {
  const headers = [
    "שם*", "תיאור", "סוג חזרה (חד פעמי/חוזר)*",
    "שעת התחלה* (HH:MM)", "שעת סיום* (HH:MM)", "חדר",
    "תאריך (YYYY-MM-DD, לחד פעמי)", "ימים (לחוזר — מופרדים ב|)", "הערות",
  ];

  const rows = events.map((e) => [
    e.name,
    e.description ?? "",
    e.recurrence_type,
    e.start_time,
    e.end_time,
    e.room,
    e.date ?? "",
    (e.days_of_week ?? []).join("|"),
    e.notes ?? "",
  ]);

  const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "אירועים.csv";
  a.click();
}
