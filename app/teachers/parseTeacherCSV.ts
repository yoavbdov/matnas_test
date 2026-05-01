// פונקציית ניתוח קובץ CSV לייבוא מדריכים
// שדות חובה: שם פרטי, שם משפחה

export interface ParsedTeacherRow {
  lineNum: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  certifications?: string[]; // מופרדות ב-"|" בקובץ
  notes?: string;
  status?: "פעיל" | "לא פעיל";
  errors: string[];
}

// שמות העמודות כפי שמופיעים בתבנית (לפי סדר)
export const TEACHER_TEMPLATE_HEADERS = [
  "שם פרטי*",               // 0 — חובה
  "שם משפחה*",              // 1 — חובה
  "סטטוס",                  // 2 — ברירת מחדל: פעיל
  "טלפון (טקסט)",           // 3 — פרמט כ'טקסט' ב-Excel לשמירת 0 בהתחלה
  "אימייל",                  // 4
  "הסמכות (מופרדות ב-|)",   // 5 — למשל: מאמן|שחקן מוסמך
  "הערות",                   // 6
];

export const TEACHER_TEMPLATE_EXAMPLE = [
  "דוד", "לוי", "פעיל",
  '="0521234567"',
  "david@example.com",
  "מאמן|שחקן מוסמך",
  "מדריך ותיק",
];

export function parseTeacherCSV(text: string): ParsedTeacherRow[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  // שורה ראשונה היא הכותרת — מדלגים עליה
  if (lines.length < 2) return [];

  return lines.slice(1).map((line, i) => {
    // תמיכה בפסיק ובנקודה-פסיק כמפריד
    // מנקים גרשיים רגילים ועטיפת ="..." שמגינה על leading zeros ב-Excel
    const cols = line.split(/,|;/).map((c) => {
      const trimmed = c.trim();
      if (/^=".*"$/.test(trimmed)) return trimmed.slice(2, -1);
      return trimmed.replace(/^"|"$/g, "");
    });

    const [fnRaw, lnRaw, statusRaw, phoneRaw, emailRaw, certsRaw, notesRaw] = cols;
    const errors: string[] = [];

    if (!fnRaw?.trim()) errors.push("שם פרטי חסר");
    if (!lnRaw?.trim()) errors.push("שם משפחה חסר");

    let status: "פעיל" | "לא פעיל" = "פעיל";
    if (statusRaw && statusRaw !== "פעיל" && statusRaw !== "לא פעיל") {
      errors.push("סטטוס חייב להיות 'פעיל' או 'לא פעיל'");
    } else if (statusRaw === "לא פעיל") {
      status = "לא פעיל";
    }

    // טלפון — אם Excel חתך את ה-0, מחזירים אותה
    const normalizePhone = (p: string) => {
      const digits = p.replace(/\D/g, "");
      return digits.length === 9 ? "0" + digits : digits;
    };
    const phone = phoneRaw ? normalizePhone(phoneRaw) : "";
    if (phoneRaw && !/^\d{9,10}$/.test(phone)) errors.push("טלפון לא תקין");

    // הסמכות — מופרדות ב-"|"
    const certifications = certsRaw?.trim()
      ? certsRaw.split("|").map((c) => c.trim()).filter(Boolean)
      : [];

    return {
      lineNum: i + 2,
      first_name: fnRaw?.trim() || undefined,
      last_name: lnRaw?.trim() || undefined,
      status,
      phone: phone || undefined,
      email: emailRaw?.trim() || undefined,
      certifications: certifications.length > 0 ? certifications : undefined,
      notes: notesRaw?.trim() || undefined,
      errors,
    };
  });
}
