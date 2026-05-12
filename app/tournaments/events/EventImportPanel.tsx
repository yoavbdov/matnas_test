"use client";
// מודאל ייבוא אירועים מ-CSV
import { useState } from "react";
import CsvImportPanel from "@/components/shared/CsvImportPanel";
import { addDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import { parseEventCSV, EVENT_TEMPLATE_HEADERS, EVENT_TEMPLATE_EXAMPLE } from "./parseEventCSV";

interface Props {
  onClose: () => void;
}

function downloadTemplate() {
  const csv = [EVENT_TEMPLATE_HEADERS.join(","), EVENT_TEMPLATE_EXAMPLE.join(",")].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "תבנית_ייבוא_אירועים.csv";
  a.click();
}

const eventNote = (
  <>עמודות עם <span className="text-red-400 font-bold">*</span> הן חובה.</>
);

export default function EventImportPanel({ onClose }: Props) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<ReturnType<typeof parseEventCSV> | null>(null);
  const [saving, setSaving] = useState(false);

  function handleFileSelected(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => setRows(parseEventCSV(e.target?.result as string));
    reader.readAsText(file, "utf-8");
  }

  async function handleImport() {
    if (!rows) return;
    if (errorCount > 0) { showToast(`תקן ${errorCount} שגיאות לפני הייבוא`, "error"); return; }
    const valid = rows.filter((r) => r.errors.length === 0);
    if (valid.length === 0) { showToast("אין שורות תקינות לייבוא", "error"); return; }
    setSaving(true);
    try {
      await Promise.all(valid.map((r) => {
        const doc: Record<string, unknown> = {
          name: r.name!,
          recurrence_type: r.recurrence_type!,
          start_time: r.start_time!,
          end_time: r.end_time!,
          room: r.room ?? "",
          created_at: new Date().toISOString(),
        };
        if (r.description)   doc.description = r.description;
        if (r.notes)         doc.notes = r.notes;
        if (r.date)          doc.date = r.date;
        if (r.days_of_week)  doc.days_of_week = r.days_of_week;
        return addDocument("events", doc);
      }));
      showToast(`${valid.length} אירועים יובאו בהצלחה`, "success");
      onClose();
    } catch { showToast("שגיאה בייבוא, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  const validCount = rows?.filter((r) => r.errors.length === 0).length ?? 0;
  const errorCount = rows?.filter((r) => r.errors.length > 0).length ?? 0;

  return (
    <CsvImportPanel
      title="ייבוא אירועים מ-CSV"
      templateNote={eventNote}
      onDownloadTemplate={downloadTemplate}
      onFileSelected={handleFileSelected}
      rows={rows}
      validCount={validCount}
      errorCount={errorCount}
      onImport={handleImport}
      saving={saving}
      importLabel={`${validCount} אירועים`}
      onClose={onClose}
    />
  );
}
