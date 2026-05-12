/*
  ניתוח קובץ CSV לייבוא נוכחות.

  פורמט הקובץ (זהה לפורמט הייצוא):
    שורה 1: "שם תלמיד" | DD.M.YYYY | DD.M.YYYY | ...
    שורה N: "שם פרטי שם משפחה" | "נכח" / "לא נכח" / ""

  מחזיר מפה: date (YYYY-MM-DD) → { studentName → present | null }
*/

export interface AttendanceDateMap {
  // YYYY-MM-DD → list of { studentName, present }
  [date: string]: { studentName: string; present: boolean | null }[];
}

export interface AttendanceCsvParseResult {
  dateMap: AttendanceDateMap;
  studentNames: string[];
  dates: string[];
  errors: string[];
}

// המרה DD.M.YYYY → YYYY-MM-DD
function parseCsvDate(raw: string): string | null {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(raw.trim());
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const month = m[2].padStart(2, "0");
  return `${m[3]}-${month}-${day}`;
}

export function parseAttendanceCsv(text: string): AttendanceCsvParseResult {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const errors: string[] = [];

  if (lines.length < 2) {
    return { dateMap: {}, studentNames: [], dates: [], errors: ["הקובץ ריק או חסר שורות נתונים"] };
  }

  // שורה ראשונה — כותרת
  const headerCols = lines[0].split(/,|;/).map((c) => c.trim().replace(/^"|"$/g, ""));

  // עמודות 1+ הן תאריכים
  const dates: string[] = [];
  for (let i = 1; i < headerCols.length; i++) {
    const date = parseCsvDate(headerCols[i]);
    if (date) {
      dates.push(date);
    } else {
      errors.push(`כותרת עמודה ${i + 1} אינה תאריך תקין: "${headerCols[i]}"`);
    }
  }

  const dateMap: AttendanceDateMap = {};
  for (const d of dates) dateMap[d] = [];

  const studentNames: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/,|;/).map((c) => c.trim().replace(/^"|"$/g, ""));
    const studentName = cols[0];
    if (!studentName) continue;

    studentNames.push(studentName);

    for (let j = 0; j < dates.length; j++) {
      const cell = cols[j + 1] ?? "";
      let present: boolean | null = null;
      if (cell === "נכח") present = true;
      else if (cell === "לא נכח") present = false;
      // ריק → null (לא מוזן)

      dateMap[dates[j]].push({ studentName, present });
    }
  }

  return { dateMap, studentNames, dates, errors };
}
