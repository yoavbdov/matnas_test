"use client";
// ייבוא שחקנים מקובץ CSV — גרור-שחרר, אימות, ייבוא שורות תקינות
// תומך בכל השדות שניתן למלא ידנית בטופס השחקן
import { useState } from "react";
import CsvImportPanel from "@/components/shared/CsvImportPanel";
import { addDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import {
  parseStudentCSV,
  TEMPLATE_HEADERS,
  TEMPLATE_EXAMPLE,
} from "./parseStudentCSV";
import { DEFAULT_SETTINGS } from "@/lib/config";

interface Props {
  onClose: () => void;
  settings: typeof DEFAULT_SETTINGS;
}

// הורדת קובץ תבנית CSV לדוגמה
function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS.join(","), TEMPLATE_EXAMPLE.join(",")].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "תבנית_ייבוא_שחקנים.csv";
  a.click();
}

export default function CSVUploadPanel({ onClose, settings }: Props) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<ReturnType<typeof parseStudentCSV> | null>(null);
  const [saving, setSaving] = useState(false);

  function handleFileSelected(file: File) {
    const reader = new FileReader();
    reader.onload = (e) =>
      setRows(parseStudentCSV(e.target?.result as string, settings));
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
    if (valid.length === 0) {
      showToast("אין שורות תקינות לייבוא", "error");
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        valid.map((r) => {
          // Firestore זורק שגיאה על שדות undefined — מסננים אותם
          const doc: Record<string, unknown> = {
            first_name: r.first_name!,
            last_name: r.last_name!,
            dob: r.dob ?? "",
            status: r.status ?? "פעיל",
            created_at: new Date().toISOString().slice(0, 10),
          };
          if (r.phone)           doc.phone = r.phone;
          if (r.israeli_id)      doc.israeli_id = r.israeli_id;
          if (r.email)           doc.email = r.email;
          if (r.address)         doc.address = r.address;
          if (r.grade_override)  doc.grade_override = r.grade_override;
          if (r.israeli_chess_id) doc.israeli_chess_id = r.israeli_chess_id;
          if (r.fide_id)         doc.fide_id = r.fide_id;
          if (r.israeli_rating)  doc.israeli_rating = r.israeli_rating;
          if (r.fide_rating)     doc.fide_rating = r.fide_rating;
          if (r.chess_title)     doc.chess_title = r.chess_title;
          if (r.notes)           doc.notes = r.notes;
          return addDocument("students", doc);
        }),
      );
      showToast(`${valid.length} שחקנים יובאו בהצלחה`, "success");
      onClose();
    } catch {
      showToast("שגיאה בייבוא, נסה שוב", "error");
    } finally {
      setSaving(false);
    }
  }

  const validCount = rows?.filter((r) => r.errors.length === 0).length ?? 0;
  const errorCount = rows?.filter((r) => r.errors.length > 0).length ?? 0;

  return (
    <CsvImportPanel
      title="ייבוא שחקנים מ-CSV"
      onDownloadTemplate={downloadTemplate}
      onFileSelected={handleFileSelected}
      rows={rows}
      validCount={validCount}
      errorCount={errorCount}
      onImport={handleImport}
      saving={saving}
      importLabel={`${validCount} שחקנים`}
      onClose={onClose}
    />
  );
}
