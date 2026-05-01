// פונקציית ניתוח קובץ CSV לייבוא חדרים
// שדות חובה: שם, קיבולת

export interface ParsedRoomRow {
  lineNum: number;
  // שדות חובה
  name?: string;
  capacity?: number;
  // שדות אופציונליים
  number?: string;
  features?: string[]; // מופרדים ב-"|" בקובץ
  notes?: string;
  errors: string[];
}

// שמות העמודות כפי שמופיעים בתבנית (לפי סדר)
export const ROOM_TEMPLATE_HEADERS = [
  "שם החדר*",            // 0 — חובה
  "קיבולת*",             // 1 — חובה (מספר שלם)
  "מספר חדר",            // 2 — אופציונלי
  "תכונות (מופרדות ב-|)", // 3 — למשל: לוח|מקרן|מזגן
  "הערות",               // 4
];

export const ROOM_TEMPLATE_EXAMPLE = [
  "חדר שחמט א׳", "20", "101", "לוח|מקרן", "ליד הכניסה",
];

export function parseRoomCSV(text: string): ParsedRoomRow[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  // שורה ראשונה היא הכותרת — מדלגים עליה
  if (lines.length < 2) return [];

  return lines.slice(1).map((line, i) => {
    // תמיכה בפסיק ובנקודה-פסיק כמפריד
    const cols = line.split(/,|;/).map((c) => {
      const trimmed = c.trim();
      // Excel formula format: ="value" → value
      if (/^=".*"$/.test(trimmed)) return trimmed.slice(2, -1);
      return trimmed.replace(/^"|"$/g, "");
    });

    const [nameRaw, capacityRaw, numberRaw, featuresRaw, notesRaw] = cols;
    const errors: string[] = [];

    // שם — חובה
    if (!nameRaw?.trim()) errors.push("שם החדר חסר");

    // קיבולת — חובה + מספר חיובי
    const capacity = capacityRaw ? Number(capacityRaw) : NaN;
    if (!capacityRaw?.trim()) errors.push("קיבולת חסרה");
    else if (isNaN(capacity) || !Number.isInteger(capacity) || capacity <= 0)
      errors.push("קיבולת חייבת להיות מספר שלם חיובי");

    // תכונות — מופרדות ב-"|"
    const features = featuresRaw?.trim()
      ? featuresRaw.split("|").map((f) => f.trim()).filter(Boolean)
      : [];

    return {
      lineNum: i + 2,
      name: nameRaw?.trim() || undefined,
      capacity: isNaN(capacity) ? undefined : capacity,
      number: numberRaw?.trim() || undefined,
      features: features.length > 0 ? features : undefined,
      notes: notesRaw?.trim() || undefined,
      errors,
    };
  });
}
