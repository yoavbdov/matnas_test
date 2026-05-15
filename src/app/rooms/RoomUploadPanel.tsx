"use client";
// ייבוא חדרים מקובץ CSV — גרור-שחרר, אימות, ייבוא שורות תקינות
import { useState } from "react";
import CsvImportPanel from "@/components/shared/CsvImportPanel";
import { addDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import { parseRoomCSV, ROOM_TEMPLATE_HEADERS, ROOM_TEMPLATE_EXAMPLE } from "./parseRoomCSV";

interface Props {
  onClose: () => void;
}

// הורדת קובץ תבנית CSV לדוגמה
function downloadTemplate() {
  const csv = [ROOM_TEMPLATE_HEADERS.join(","), ROOM_TEMPLATE_EXAMPLE.join(",")].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "תבנית_ייבוא_חדרים.csv";
  a.click();
}

export default function RoomUploadPanel({ onClose }: Props) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<ReturnType<typeof parseRoomCSV> | null>(null);
  const [saving, setSaving] = useState(false);

  function handleFileSelected(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => setRows(parseRoomCSV(e.target?.result as string));
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
          capacity: r.capacity!,
        };
        if (r.number)   doc.number = r.number;
        if (r.features) doc.features = r.features;
        if (r.notes)    doc.notes = r.notes;
        return addDocument("rooms", doc);
      }));
      showToast(`${valid.length} חדרים יובאו בהצלחה`, "success");
      onClose();
    } catch { showToast("שגיאה בייבוא, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  const validCount = rows?.filter((r) => r.errors.length === 0).length ?? 0;
  const errorCount = rows?.filter((r) => r.errors.length > 0).length ?? 0;

  return (
    <CsvImportPanel
      title="ייבוא חדרים מ-CSV"
      onDownloadTemplate={downloadTemplate}
      onFileSelected={handleFileSelected}
      rows={rows}
      validCount={validCount}
      errorCount={errorCount}
      onImport={handleImport}
      saving={saving}
      importLabel={`${validCount} חדרים`}
      onClose={onClose}
    />
  );
}
