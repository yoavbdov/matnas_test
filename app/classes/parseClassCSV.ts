// פונקציית ניתוח קובץ CSV לייבוא חוגים
// שדות חובה: שם החוג, שם המדריך (לפי "שם פרטי שם משפחה"), קיבולת
// שים לב: מפגשים (slots) וציוד (resources) לא ניתן לייבא מ-CSV — יש להוסיפם ידנית דרך הטופס

import type { Teacher } from "@/lib/types";

export interface ParsedClassRow {
  lineNum: number;
  // שדות חובה
  name?: string;
  teacher_id?: string; // נגזר מהשם שהוזן
  capacity?: number;
  // שדות אופציונליים
  status?: "פעיל" | "לא פעיל";
  age_min?: number;
  age_max?: number;
  rating_min?: number;
  rating_max?: number;
  notes?: string;
  errors: string[];
}

// שמות העמודות כפי שמופיעים בתבנית (לפי סדר)
export const CLASS_TEMPLATE_HEADERS = [
  "שם החוג*",           // 0 — חובה
  "שם מדריך* (שם פרטי שם משפחה)", // 1 — חובה — חייב להתאים למדריך קיים
  "קיבולת*",            // 2 — חובה (מספר שלם חיובי)
  "סטטוס",              // 3 — ברירת מחדל: פעיל
  "גיל מינימלי",        // 4
  "גיל מקסימלי",        // 5
  "דירוג מינימלי",      // 6
  "דירוג מקסימלי",      // 7
  "הערות",              // 8
];

export const CLASS_TEMPLATE_EXAMPLE = [
  "שחמט מתחילים", "דוד לוי", "15", "פעיל", "6", "12", "", "", "קבוצה מתחילים",
];

export function parseClassCSV(text: string, teachers: Teacher[]): ParsedClassRow[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  // שורה ראשונה היא הכותרת — מדלגים עליה
  if (lines.length < 2) return [];

  return lines.slice(1).map((line, i) => {
    // תמיכה בפסיק ובנקודה-פסיק כמפריד
    const cols = line.split(/,|;/).map((c) => {
      const trimmed = c.trim();
      if (/^=".*"$/.test(trimmed)) return trimmed.slice(2, -1);
      return trimmed.replace(/^"|"$/g, "");
    });

    const [nameRaw, teacherNameRaw, capacityRaw, statusRaw, ageMinRaw, ageMaxRaw, ratingMinRaw, ratingMaxRaw, notesRaw] = cols;
    const errors: string[] = [];

    // שם החוג — חובה
    if (!nameRaw?.trim()) errors.push("שם החוג חסר");

    // מדריך — חובה, חייב להתאים לשם מדריך קיים
    let teacher_id: string | undefined;
    if (!teacherNameRaw?.trim()) {
      errors.push("שם המדריך חסר");
    } else {
      const found = teachers.find((t) =>
        `${t.first_name} ${t.last_name}`.toLowerCase() === teacherNameRaw.trim().toLowerCase()
      );
      if (!found) errors.push(`מדריך לא נמצא: "${teacherNameRaw.trim()}" — ודא שהשם תואם בדיוק למדריך קיים`);
      else teacher_id = found.id;
    }

    // קיבולת — חובה + מספר חיובי
    const capacity = capacityRaw ? Number(capacityRaw) : NaN;
    if (!capacityRaw?.trim()) errors.push("קיבולת חסרה");
    else if (isNaN(capacity) || !Number.isInteger(capacity) || capacity <= 0)
      errors.push("קיבולת חייבת להיות מספר שלם חיובי");

    // סטטוס
    let status: "פעיל" | "לא פעיל" = "פעיל";
    if (statusRaw && statusRaw !== "פעיל" && statusRaw !== "לא פעיל") {
      errors.push("סטטוס חייב להיות 'פעיל' או 'לא פעיל'");
    } else if (statusRaw === "לא פעיל") {
      status = "לא פעיל";
    }

    // גיל ודירוג — אופציונליים, חייבים להיות מספרים חיוביים
    const parseOptNum = (raw: string | undefined, label: string): number | undefined => {
      if (!raw?.trim()) return undefined;
      const n = Number(raw);
      if (isNaN(n) || n < 0) { errors.push(`${label} חייב להיות מספר חיובי`); return undefined; }
      return n;
    };

    const age_min = parseOptNum(ageMinRaw, "גיל מינימלי");
    const age_max = parseOptNum(ageMaxRaw, "גיל מקסימלי");
    const rating_min = parseOptNum(ratingMinRaw, "דירוג מינימלי");
    const rating_max = parseOptNum(ratingMaxRaw, "דירוג מקסימלי");

    // ולידציה: מינימום לא יכול להיות גדול ממקסימום
    if (age_min !== undefined && age_max !== undefined && age_min > age_max)
      errors.push("גיל מינימלי גדול מגיל מקסימלי");
    if (rating_min !== undefined && rating_max !== undefined && rating_min > rating_max)
      errors.push("דירוג מינימלי גדול מדירוג מקסימלי");

    return {
      lineNum: i + 2,
      name: nameRaw?.trim() || undefined,
      teacher_id,
      capacity: isNaN(capacity) ? undefined : capacity,
      status,
      age_min, age_max,
      rating_min, rating_max,
      notes: notesRaw?.trim() || undefined,
      errors,
    };
  });
}
