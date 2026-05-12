// ייצוא קבוצות ליגה לקובץ CSV
import type { LeagueGroup } from "@/lib/types";

function escapeCell(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export function exportLeagueGroupsCsv(groups: LeagueGroup[]): void {
  const headers = ["שם*", "קטגוריה* (בוגרים/נוער/נשים)", "דרגה*", "סטטוס (פעיל/לא פעיל)", "תיאור", "הערות"];
  const rows = groups.map((g) => [
    g.name,
    g.category,
    g.leagueType,
    g.status,
    g.description ?? "",
    g.notes ?? "",
  ]);
  const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "קבוצות_ליגה.csv";
  a.click();
}
