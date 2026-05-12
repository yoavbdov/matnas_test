# Component Audit — Chess Nimbus

Date: 2026-05-12

סריקה מלאה של הקוד לזיהוי כפילויות ורכיבים שניתן לאחד.

---

## 1. לוחות ייבוא CSV — עדיפות קריטית

**קבצים:**

- `app/students/CSVUploadPanel.tsx` (167 שורות) ← **שם מטעה! צריך לשנות ל-`StudentCsvImportPanel.tsx`**
- `app/classes/ClassUploadPanel.tsx` (171 שורות)
- `app/rooms/RoomUploadPanel.tsx` (154 שורות)
- `app/tournaments/TournamentImportPanel.tsx` (148 שורות)
- `app/teachers/TeacherUploadPanel.tsx`
- `app/league-groups/LeagueGroupImportPanel.tsx`
- `app/tournaments/events/EventImportPanel.tsx`

**מה כפול:**
כל לוח ייבוא בנוי מ-3 שלבים זהים לחלוטין:

1. כותרת + כפתור סגירה
2. הורדת תבנית CSV
3. גרירה/העלאה של קובץ
4. תצוגת שגיאות ותוצאות
5. כפתורי ביטול/ייבוא

**שורות שניתן לחסוך:** ~840-980 שורות
**שם רכיב מוצע:** `CSVImportPanel` ב-`components/shared/CSVImportPanel.tsx`

> **הבהרה חשובה:** האיחוד מתייחס ל-UI בלבד (כותרת, dropzone, כפתורות, תצוגת שגיאות).
> לוגיקת הפארסינג והוולידציה נשארת נפרדת לכל entity — מועברת כ-prop ולא נוגעים בה.

**Props:**

```typescript
interface CSVImportPanelProps {
  title: string;
  entityName: string;
  templateHeaders: string[];
  templateExample: string[];
  downloadFileName: string;
  parseCSV: (csv: string) => ParsedRow[];
  onImport: (validRows: ParsedRow[]) => Promise<void>;
  onClose: () => void;
}
```

---

## 2. מודאלי בדיקת זמינות — עדיפות קריטית

**קבצים:**

- `app/students/StudentAvailabilityModal.tsx` (175 שורות)
- `app/teachers/TeacherAvailabilityModal.tsx` (264 שורות)
- `app/rooms/RoomAvailabilityModal.tsx` (153 שורות)

**מה כפול:**

- כותרת עם אייקון + כפתור סגירה
- טופס: תאריך, טווח שעות, פילטרים
- פונקציות עזר `todayStr()`, `currentTime()`, `addHour()` — **זהות לחלוטין** בכל 3 קבצים
- תצוגת תוצאות: פנוי / עסוק עם badges

**שורות שניתן לחסוך:** ~450-600 שורות
**שם רכיב מוצע:** `AvailabilityCheckModal` ב-`components/shared/AvailabilityCheckModal.tsx`

**בנוסף:** הפונקציות `todayStr / currentTime / addHour` צריכות לעבור ל-`lib/dateHelpers.ts`.

---

## 3. סרגלי כלים (Toolbars) — עדיפות גבוהה

**קבצים:**

- `app/classes/ClassesToolbar.tsx` (200 שורות)
- `app/students/StudentsToolbar.tsx` (124 שורות)
- `app/tournaments/TournamentsToolbar.tsx` (76 שורות)
- `app/rooms/ResourcesToolbar.tsx` (73 שורות)

**מה כפול:**

- רכיב `FilterItem` (תווית + שדה) מוגדר מחדש בכל קובץ בנפרד — ממש זהה
- שורת חיפוש + כפתורי ייבוא/ייצוא/הוספה
- עיצוב זהה לכל ה-selects ו-inputs

**שורות שניתן לחסוך:** ~120-200 שורות
**שמות רכיבים מוצעים:**

- `FilterItem` → `components/shared/FilterItem.tsx` (מייד!)
- `ToolbarSearch` → `components/shared/ToolbarSearch.tsx`

---

## 4. מודאלים עם טאבים — עדיפות גבוהה

**קבצים:**

- `app/classes/ClassFormModal.tsx` (220 שורות)
- `app/tournaments/TournamentFormModal.tsx` (313 שורות)

**מה כפול:**

- כותרת + כפתור סגירה
- שורת טאבים עם עיצוב active/inactive זהה
- תוכן עם overflow scroll
- footer עם כפתורי ביטול/שמירה

**שורות שניתן לחסוך:** ~120-240 שורות
**שם רכיב מוצע:** `TabbedFormModal` ב-`components/shared/TabbedFormModal.tsx`

---

## 5. שורות מידע במודאלי פרטים (DetailRow) — עדיפות בינונית

**קבצים:**

- `app/students/StudentDetailModal.tsx`
- `app/teachers/TeacherDetailModal.tsx`
- `app/tournaments/TournamentDetailModal.tsx`
- `app/league-groups/LeagueGroupDetailModal.tsx`

**מה כפול:**
רכיב `Row` (תווית + ערך) מוגדר בנפרד בכמה קבצים באופן זהה.

**שורות שניתן לחסוך:** ~80-120 שורות
**שם רכיב מוצע:** `DetailRow` ב-`components/shared/DetailRow.tsx`

---

## 6. כותרות עמודות עם מיון (SortTh) — עדיפות בינונית

**קבצים:**

- `app/students/StudentsTable.tsx` (שורות 40-66)
- `app/classes/ClassesTable.tsx` (שורות 19-36)

**מה כפול:**
רכיב `SortTh` עם חצי מיון (↑↓↕) מוגדר בשני מקומות בנפרד.

**שורות שניתן לחסוך:** ~50-90 שורות
**שם רכיב מוצע:** להוסיף ל-`components/shared/Table.tsx` הקיים.

---

## 7. פונקציית הורדת תבנית CSV — עדיפות בינונית

**קבצים:** כל 7 לוחות הייבוא

**מה כפול:**

```typescript
function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS.join(","), TEMPLATE_EXAMPLE.join(",")].join(
    "\n",
  );
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "filename.csv";
  a.click();
}
```

זהה לחלוטין בכל הקבצים.

**שורות שניתן לחסוך:** ~56 שורות
**מיקום מוצע:** `lib/csvDownload.ts`

---

## סיכום — טבלת עדיפויות

| תבנית            | קבצים | שורות לחסוך     | עדיפות | שם רכיב מוצע                  |
| ---------------- | ----- | --------------- | ------ | ----------------------------- |
| לוחות ייבוא CSV  | 7     | 840-980         | קריטי  | `CSVImportPanel`              |
| מודאלי זמינות    | 3     | 450-600         | קריטי  | `AvailabilityCheckModal`      |
| סרגלי כלים       | 4     | 120-200         | גבוה   | `FilterItem`, `ToolbarSearch` |
| מודאלים עם טאבים | 2     | 120-240         | גבוה   | `TabbedFormModal`             |
| שורות פרטים      | 4     | 80-120          | בינוני | `DetailRow`                   |
| כותרות מיון      | 2     | 50-90           | בינוני | `SortTh` (לתוך Table.tsx)     |
| פונקציות תאריך   | 3     | 30              | בינוני | `lib/dateHelpers.ts`          |
| הורדת תבנית      | 7     | 56              | בינוני | `lib/csvDownload.ts`          |
| **סה"כ**         |       | **1,746-2,316** |        |                               |

---

## סדר פעולה מומלץ

### שלב 1 — השפעה מרבית

1. `CSVImportPanel` → חוסך ~900 שורות
2. `AvailabilityCheckModal` → חוסך ~500 שורות

### שלב 2 — השפעה גבוהה

3. `FilterItem` → העברה ל-`components/shared/` (מהיר מאוד)
4. `TabbedFormModal` → לשני המודאלים עם טאבים

### שלב 3 — שיפור ופינוי

5. `DetailRow` → shared component
6. `SortTh` → לתוך Table.tsx
7. פונקציות עזר → `lib/dateHelpers.ts`
8. `downloadTemplate` → `lib/csvDownload.ts`
