// ניתוח קובץ CSV לייבוא תחרויות
import type { Tournament } from "@/lib/types";

export interface ParsedTournamentRow {
  lineNum: number;
  name?: string;
  description?: string;
  status?: Tournament["status"];
  rating_min?: number;
  rating_max?: number;
  age_min?: number;
  age_max?: number;
  is_recurring?: boolean;
  notes?: string;
  errors: string[];
}

export const TOURNAMENT_TEMPLATE_HEADERS = [
  "שם*", "תיאור", "סטטוס",
  "מינ׳ דירוג", "מקס׳ דירוג", "מינ׳ גיל", "מקס׳ גיל",
  "חוזר (כן/לא)", "הערות",
];

export const TOURNAMENT_TEMPLATE_EXAMPLE = [
  "אליפות החוג", "תחרות פנימית", "מתוכנן",
  "1000", "2000", "8", "18",
  "לא", "לשחקנים מתחילים",
];

const VALID_STATUSES: Tournament["status"][] = ["מתוכנן", "פעיל", "הסתיים", "בוטל"];

// פירוש עמודה מספרית — מחזיר undefined אם ריקה, throws error string if invalid
function parseNum(raw: string, label: string): { value?: number; error?: string } {
  if (!raw.trim()) return { value: undefined };
  const n = Number(raw.trim());
  if (isNaN(n)) return { error: `${label} חייב להיות מספר` };
  return { value: n };
}

export function parseTournamentCSV(text: string): ParsedTournamentRow[] {
  // תמיכה ב-, וב-; כמפריד; ניקוי BOM
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  return lines.slice(1).map((line, i) => {
    const cols = line.split(/,|;/).map((c) => {
      const t = c.trim();
      // Excel formula format: ="value" → value
      if (/^=".*"$/.test(t)) return t.slice(2, -1);
      return t.replace(/^"|"$/g, "");
    });

    const [nameRaw, description, statusRaw, ratingMinRaw, ratingMaxRaw, ageMinRaw, ageMaxRaw, recurringRaw, notes] = cols;
    const errors: string[] = [];

    if (!nameRaw?.trim()) errors.push("שם חסר");

    // סטטוס
    let status: Tournament["status"] = "מתוכנן";
    if (statusRaw?.trim() && !VALID_STATUSES.includes(statusRaw.trim() as Tournament["status"])) {
      errors.push(`סטטוס לא חוקי: "${statusRaw.trim()}". חוקיים: ${VALID_STATUSES.join(", ")}`);
    } else if (statusRaw?.trim()) {
      status = statusRaw.trim() as Tournament["status"];
    }

    const rMin = parseNum(ratingMinRaw ?? "", "מינ׳ דירוג");
    const rMax = parseNum(ratingMaxRaw ?? "", "מקס׳ דירוג");
    const aMin = parseNum(ageMinRaw ?? "", "מינ׳ גיל");
    const aMax = parseNum(ageMaxRaw ?? "", "מקס׳ גיל");
    if (rMin.error) errors.push(rMin.error);
    if (rMax.error) errors.push(rMax.error);
    if (aMin.error) errors.push(aMin.error);
    if (aMax.error) errors.push(aMax.error);

    const is_recurring = recurringRaw?.trim() === "כן";

    return {
      lineNum: i + 2,
      name: nameRaw?.trim() || undefined,
      description: description?.trim() || undefined,
      status,
      rating_min: rMin.value,
      rating_max: rMax.value,
      age_min: aMin.value,
      age_max: aMax.value,
      is_recurring,
      notes: notes?.trim() || undefined,
      errors,
    };
  });
}
