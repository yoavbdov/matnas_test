"use client";
// ייבוא חוגים מקובץ CSV — גרור-שחרר, אימות, ייבוא שורות תקינות
// שים לב: מפגשים וציוד לא ניתנים לייבוא מ-CSV — יש להוסיפם ידנית דרך הטופס
import { useState } from "react";
import { Info } from "lucide-react";
import CsvImportPanel from "@/components/shared/CsvImportPanel";
import { addDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import { parseClassCSV, CLASS_TEMPLATE_HEADERS, CLASS_TEMPLATE_EXAMPLE } from "./parseClassCSV";
import { CLASS_COLORS } from "@/lib/constants";
import type { Teacher } from "@/types";

interface Props {
  teachers: Teacher[];
  onClose: () => void;
}

// הורדת קובץ תבנית CSV לדוגמה
function downloadTemplate() {
  const csv = [CLASS_TEMPLATE_HEADERS.join(","), CLASS_TEMPLATE_EXAMPLE.join(",")].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "תבנית_ייבוא_חוגים.csv";
  a.click();
}

// באנר הסבר ייחודי לחוגים — מפגשים וציוד לא נתמכים בייבוא
const classBanner = (
  <div className="flex gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2.5 border border-amber-200">
    <Info size={14} className="shrink-0 mt-0.5" />
    <span>מפגשים (ימים ושעות) וציוד לא ניתנים לייבוא מ-CSV. לאחר הייבוא, ערוך כל חוג דרך הטופס להוספתם.</span>
  </div>
);

// טקסט עזר ייחודי לחוגים — שם המדריך חייב להתאים למדריך קיים
const classTemplateNote = (
  <>
    התבנית מכילה את כל השדות. עמודות עם{" "}
    <span className="text-red-400 font-bold">*</span> הן חובה.
    שם המדריך חייב להתאים בדיוק לשם מדריך קיים במערכת.
  </>
);

export default function ClassUploadPanel({ teachers, onClose }: Props) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<ReturnType<typeof parseClassCSV> | null>(null);
  const [saving, setSaving] = useState(false);

  function handleFileSelected(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => setRows(parseClassCSV(e.target?.result as string, teachers));
    reader.readAsText(file, "utf-8");
  }

  async function handleImport() {
    if (!rows) return;
    // אם יש שגיאות בכל שורה שהיא — חוסמים את כל הייבוא
    if (errorCount > 0) {
      showToast(`תקן ${errorCount} שגיאות לפני הייבוא`, "error");
      return;
    }
    const valid = rows.filter((r) => r.errors.length === 0);
    if (valid.length === 0) { showToast("אין שורות תקינות לייבוא", "error"); return; }
    setSaving(true);
    try {
      await Promise.all(valid.map((r) => {
        // Firestore זורק שגיאה על שדות undefined — מסננים אותם
        const doc: Record<string, unknown> = {
          name: r.name!,
          teacher_id: r.teacher_id!,
          capacity: r.capacity!,
          status: r.status ?? "מתוכנן",
          color: CLASS_COLORS[0], // צבע ברירת מחדל — ניתן לשינוי דרך הטופס
          slots: [],
          resource_assignments: [],
        };
        if (r.age_min !== undefined)    doc.age_min = r.age_min;
        if (r.age_max !== undefined)    doc.age_max = r.age_max;
        if (r.rating_min !== undefined) doc.rating_min = r.rating_min;
        if (r.rating_max !== undefined) doc.rating_max = r.rating_max;
        if (r.notes)                    doc.notes = r.notes;
        return addDocument("classes", doc);
      }));
      showToast(`${valid.length} חוגים יובאו בהצלחה`, "success");
      onClose();
    } catch { showToast("שגיאה בייבוא, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  const validCount = rows?.filter((r) => r.errors.length === 0).length ?? 0;
  const errorCount = rows?.filter((r) => r.errors.length > 0).length ?? 0;

  return (
    <CsvImportPanel
      title="ייבוא חוגים מ-CSV"
      extraBanner={classBanner}
      templateNote={classTemplateNote}
      onDownloadTemplate={downloadTemplate}
      onFileSelected={handleFileSelected}
      rows={rows}
      validCount={validCount}
      errorCount={errorCount}
      onImport={handleImport}
      saving={saving}
      importLabel={`${validCount} חוגים`}
      onClose={onClose}
    />
  );
}
