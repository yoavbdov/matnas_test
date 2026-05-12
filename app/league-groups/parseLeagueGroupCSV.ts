// ניתוח קובץ CSV לייבוא קבוצות ליגה
import type { LeagueGroup, LeagueCategory, LeagueType } from "@/lib/types";

export interface ParsedLeagueGroupRow {
  lineNum: number;
  name?: string;
  category?: LeagueCategory;
  leagueType?: LeagueType;
  status?: LeagueGroup["status"];
  description?: string;
  notes?: string;
  errors: string[];
}

export const LEAGUE_GROUP_TEMPLATE_HEADERS = [
  "שם*", "קטגוריה* (בוגרים/נוער/נשים)", "דרגה*", "סטטוס (פעיל/לא פעיל)", "תיאור", "הערות",
];
export const LEAGUE_GROUP_TEMPLATE_EXAMPLE = [
  "קבוצת א׳", "בוגרים", "א", "פעיל", "", "",
];

const VALID_CATEGORIES: LeagueCategory[] = ["בוגרים", "נוער", "נשים"];
const VALID_TYPES: LeagueType[] = ["ג", "ב", "א", "ארצית", "לאומית", "מחוזית", "עילית"];

export function parseLeagueGroupCSV(text: string): ParsedLeagueGroupRow[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  return lines.slice(1).map((line, i) => {
    const cols = line.split(/,|;/).map((c) => {
      const t = c.trim();
      if (/^=".*"$/.test(t)) return t.slice(2, -1);
      return t.replace(/^"|"$/g, "");
    });

    const [nameRaw, categoryRaw, leagueTypeRaw, statusRaw, description, notes] = cols;
    const errors: string[] = [];

    if (!nameRaw?.trim()) errors.push("שם חסר");

    let category: LeagueCategory | undefined;
    if (!categoryRaw?.trim()) {
      errors.push("קטגוריה חסרה");
    } else if (!VALID_CATEGORIES.includes(categoryRaw.trim() as LeagueCategory)) {
      errors.push(`קטגוריה לא חוקית: "${categoryRaw.trim()}". חוקיות: ${VALID_CATEGORIES.join(", ")}`);
    } else {
      category = categoryRaw.trim() as LeagueCategory;
    }

    let leagueType: LeagueType | undefined;
    if (!leagueTypeRaw?.trim()) {
      errors.push("דרגה חסרה");
    } else if (!VALID_TYPES.includes(leagueTypeRaw.trim() as LeagueType)) {
      errors.push(`דרגה לא חוקית: "${leagueTypeRaw.trim()}". חוקיות: ${VALID_TYPES.join(", ")}`);
    } else {
      leagueType = leagueTypeRaw.trim() as LeagueType;
    }

    const status: LeagueGroup["status"] = statusRaw?.trim() === "לא פעיל" ? "לא פעיל" : "פעיל";

    return {
      lineNum: i + 2,
      name: nameRaw?.trim() || undefined,
      category,
      leagueType,
      status,
      description: description?.trim() || undefined,
      notes: notes?.trim() || undefined,
      errors,
    };
  });
}
