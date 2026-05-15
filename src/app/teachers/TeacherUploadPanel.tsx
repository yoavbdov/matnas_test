"use client";
// ייבוא מדריכים מקובץ CSV — גרור-שחרר, אימות, ייבוא שורות תקינות
import { useState } from "react";
import CsvImportPanel from "@/components/shared/CsvImportPanel";
import { addDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import { parseTeacherCSV, TEACHER_TEMPLATE_HEADERS, TEACHER_TEMPLATE_EXAMPLE } from "./parseTeacherCSV";

interface Props {
  onClose: () => void;
}

// הורדת קובץ תבנית CSV לדוגמה
function downloadTemplate() {
  const csv = [TEACHER_TEMPLATE_HEADERS.join(","), TEACHER_TEMPLATE_EXAMPLE.join(",")].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "תבנית_ייבוא_מדריכים.csv";
  a.click();
}

export default function TeacherUploadPanel({ onClose }: Props) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<ReturnType<typeof parseTeacherCSV> | null>(null);
  const [saving, setSaving] = useState(false);

  function handleFileSelected(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => setRows(parseTeacherCSV(e.target?.result as string));
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
          first_name: r.first_name!,
          last_name: r.last_name!,
          status: r.status ?? "פעיל",
        };
        if (r.phone)          doc.phone = r.phone;
        if (r.email)          doc.email = r.email;
        if (r.certifications) doc.certifications = r.certifications;
        if (r.notes)          doc.notes = r.notes;
        return addDocument("teachers", doc);
      }));
      showToast(`${valid.length} מדריכים יובאו בהצלחה`, "success");
      onClose();
    } catch { showToast("שגיאה בייבוא, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  const validCount = rows?.filter((r) => r.errors.length === 0).length ?? 0;
  const errorCount = rows?.filter((r) => r.errors.length > 0).length ?? 0;

  return (
    <CsvImportPanel
      title="ייבוא מדריכים מ-CSV"
      onDownloadTemplate={downloadTemplate}
      onFileSelected={handleFileSelected}
      rows={rows}
      validCount={validCount}
      errorCount={errorCount}
      onImport={handleImport}
      saving={saving}
      importLabel={`${validCount} מדריכים`}
      onClose={onClose}
    />
  );
}
