// פונקציית ניתוח קובץ CSV לייבוא תלמידים
// כל שדה שניתן למלא ידנית בטופס התלמיד נתמך כאן

import { CHESS_TITLES, GRADE_LABELS } from "@/lib/constants";
import type { AppSettings } from "@/lib/types";

export interface ParsedRow {
  lineNum: number;
  // שדות חובה
  first_name?: string;
  last_name?: string;
  dob?: string; // YYYY-MM-DD
  // שדות אופציונליים
  status?: "פעיל" | "לא פעיל";
  phone?: string;
  parent_name?: string;
  parent_phone?: string;
  israeli_id?: string;
  email?: string;
  address?: string;
  grade_override?: string;
  israeli_chess_id?: string;
  fide_id?: string;
  israeli_rating?: number;
  fide_rating?: number;
  chess_title?: string;
  notes?: string;
  errors: string[];
}

// שמות העמודות כפי שמופיעים בקובץ (לפי סדר)
export const TEMPLATE_HEADERS = [
  "שם פרטי*",        // 0  — חובה
  "שם משפחה*",       // 1  — חובה
  "תאריך לידה* (DD/MM/YYYY)", // 2 — חובה
  "סטטוס",           // 3  — ברירת מחדל: פעיל
  "טלפון (טקסט)",    // 4  — פרמט התא כ'טקסט' ב-Excel לשמירת 0 בהתחלה
  "שם הורה / איש קשר", // 5
  "טלפון הורה (טקסט)", // 6
  "תעודת זהות (טקסט)", // 7
  "אימייל",          // 8
  "כתובת",           // 9
  "כיתה (ידנית)",    // 10 — עוקף חישוב אוטומטי
  "מספר שחקן ישראלי", // 11
  "FIDE ID",         // 12
  "דירוג ישראלי",    // 13
  "דירוג FIDE",      // 14
  "תואר שחמטאי",     // 15
  "הערות",           // 16
];

export const TEMPLATE_EXAMPLE = [
  "ישראל", "ישראלי", "15/03/2015",
  "פעיל",
  // עטיפת ="..." מונעת מ-Excel לחתוך את ה-0 בתחילת מספרים
  '="0501234567"', "אורה ישראלי", '="0509876543"', '="123456789"',
  "israel@example.com", "תל אביב",
  "", // כיתה ידנית — ריק = אוטומטי
  '="12345"', '="67890"',
  "1500", "1450", "FM",
  "תלמיד מוכשר",
];

// המרת DD/MM/YYYY או YYYY-MM-DD ל-YYYY-MM-DD
// מחזירה null אם הפורמט שגוי או אם התאריך לא הגיוני (יום/חודש/שנה מחוץ לטווח)
function parseDateStr(raw: string): string | null {
  raw = raw.trim();

  let day: number, month: number, year: number;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    [year, month, day] = raw.split("-").map(Number);
  } else {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
    if (!m) return null;
    day = Number(m[1]);
    month = Number(m[2]);
    year = Number(m[3]);
  }

  // ולידציה: שנה הגיונית (1900–שנה נוכחית+1), חודש 1–12, יום 1–31
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear + 1) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  // בדיקה שהתאריך אכן קיים (למשל 31/02 לא קיים)
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseStudentCSV(text: string, settings: Required<AppSettings>): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  // שורה ראשונה היא הכותרת — מדלגים עליה
  if (lines.length < 2) return [];

  return lines.slice(1).map((line, i) => {
    // תמיכה בפסיק ובנקודה-פסיק כמפריד
    // מנקים גרשיים רגילים ועטיפת ="..." שמגינה על leading zeros ב-Excel
    const cols = line.split(/,|;/).map((c) => {
      const trimmed = c.trim();
      // Excel formula format: ="0501234567" → 0501234567
      if (/^=".*"$/.test(trimmed)) return trimmed.slice(2, -1);
      return trimmed.replace(/^"|"$/g, "");
    });
    const [
      fn, ln, dobRaw, statusRaw, phone, parentName, parentPhone,
      idRaw, email, address, gradeOverride, israeliChessId, fideId,
      israeliRatingRaw, fideRatingRaw, chessTitle, notes,
    ] = cols;

    const errors: string[] = [];

    // שדות חובה
    if (!fn?.trim()) errors.push("שם פרטי חסר");
    if (!ln?.trim()) errors.push("שם משפחה חסר");

    const dob = dobRaw ? parseDateStr(dobRaw) : null;
    if (!dobRaw?.trim()) errors.push("תאריך לידה חסר");
    else if (!dob) errors.push("תאריך לידה לא תקין (השתמש ב-DD/MM/YYYY)");

    // סטטוס
    let status: "פעיל" | "לא פעיל" = "פעיל";
    if (statusRaw && statusRaw !== "פעיל" && statusRaw !== "לא פעיל") {
      errors.push("סטטוס חייב להיות 'פעיל' או 'לא פעיל'");
    } else if (statusRaw === "לא פעיל") {
      status = "לא פעיל";
    }

    // טלפונים — אם יצאו 9 ספרות, Excel כנראה חתך את ה-0 — מחזירים אותה
    const normalizePhone = (p: string) => {
      const digits = p.replace(/\D/g, "");
      return digits.length === 9 ? "0" + digits : digits;
    };
    const phoneNorm = phone ? normalizePhone(phone) : "";
    const parentPhoneNorm = parentPhone ? normalizePhone(parentPhone) : "";
    if (phone && !/^\d{9,10}$/.test(phoneNorm)) errors.push("טלפון לא תקין");
    if (parentPhone && !/^\d{9,10}$/.test(parentPhoneNorm)) errors.push("טלפון הורה לא תקין");

    // תעודת זהות
    const israeli_id = idRaw?.replace(/\D/g, "");
    if (israeli_id && israeli_id.length !== settings.ID_NUMBER_LENGTH) {
      errors.push(`ת״ז חייבת להיות ${settings.ID_NUMBER_LENGTH} ספרות`);
    }

    // כיתה ידנית
    if (gradeOverride && gradeOverride.trim() && !GRADE_LABELS.includes(gradeOverride.trim())) {
      errors.push(`כיתה לא חוקית: "${gradeOverride.trim()}"`);
    }

    // דירוגים
    const israeliRating = israeliRatingRaw ? Number(israeliRatingRaw) : undefined;
    if (israeliRatingRaw && isNaN(Number(israeliRatingRaw))) errors.push("דירוג ישראלי חייב להיות מספר");

    const fideRating = fideRatingRaw ? Number(fideRatingRaw) : undefined;
    if (fideRatingRaw && isNaN(Number(fideRatingRaw))) errors.push("דירוג FIDE חייב להיות מספר");

    // תואר שחמטאי
    if (chessTitle && !CHESS_TITLES.includes(chessTitle.trim())) {
      errors.push(`תואר לא מוכר: "${chessTitle}". תארים חוקיים: ${CHESS_TITLES.join(", ")}`);
    }

    return {
      lineNum: i + 2,
      first_name: fn?.trim() || undefined,
      last_name: ln?.trim() || undefined,
      dob: dob ?? undefined,
      status,
      phone: phoneNorm || undefined,
      parent_name: parentName?.trim() || undefined,
      parent_phone: parentPhoneNorm || undefined,
      israeli_id: israeli_id || undefined,
      email: email?.trim() || undefined,
      address: address?.trim() || undefined,
      grade_override: gradeOverride?.trim() || undefined,
      israeli_chess_id: israeliChessId?.trim() || undefined,
      fide_id: fideId?.trim() || undefined,
      israeli_rating: israeliRating,
      fide_rating: fideRating,
      chess_title: chessTitle?.trim() || undefined,
      notes: notes?.trim() || undefined,
      errors,
    };
  });
}
