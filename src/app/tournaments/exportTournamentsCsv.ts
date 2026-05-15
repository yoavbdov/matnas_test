// ייצוא תחרויות לקובץ CSV — שדות בסיסיים (ללא סיבובים/משתתפים)
import type { Tournament } from "@/lib/types";

function escapeCell(v: string | number): string {
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportTournamentsCsv(tournaments: Tournament[]): void {
  const headers = [
    "שם*", "תיאור", "סטטוס",
    "מינ׳ דירוג", "מקס׳ דירוג", "מינ׳ גיל", "מקס׳ גיל",
    "חוזר (כן/לא)", "הערות",
  ];

  const rows = tournaments.map((t) => [
    t.name,
    t.description ?? "",
    t.status,
    t.rating_min ?? "",
    t.rating_max ?? "",
    t.age_min ?? "",
    t.age_max ?? "",
    t.is_recurring ? "כן" : "לא",
    t.notes ?? "",
  ]);

  const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "תחרויות.csv";
  a.click();
}
