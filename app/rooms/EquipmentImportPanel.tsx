"use client";
// מודאל ייבוא ציוד מ-CSV
import { useState } from "react";
import CsvImportPanel from "@/components/shared/CsvImportPanel";
import { addDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import { parseEquipmentCSV, EQUIPMENT_TEMPLATE_HEADERS, EQUIPMENT_TEMPLATE_EXAMPLE } from "./parseEquipmentCSV";

interface Props {
  onClose: () => void;
}

function downloadTemplate() {
  const csv = [EQUIPMENT_TEMPLATE_HEADERS.join(","), EQUIPMENT_TEMPLATE_EXAMPLE.join(",")].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "תבנית_ייבוא_ציוד.csv";
  a.click();
}

export default function EquipmentImportPanel({ onClose }: Props) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<ReturnType<typeof parseEquipmentCSV> | null>(null);
  const [saving, setSaving] = useState(false);

  function handleFileSelected(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => setRows(parseEquipmentCSV(e.target?.result as string));
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
        const doc: Record<string, unknown> = { name: r.name!, quantity: r.quantity! };
        if (r.notes) doc.notes = r.notes;
        return addDocument("physicalEquipment", doc);
      }));
      showToast(`${valid.length} פריטי ציוד יובאו בהצלחה`, "success");
      onClose();
    } catch { showToast("שגיאה בייבוא, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  const validCount = rows?.filter((r) => r.errors.length === 0).length ?? 0;
  const errorCount = rows?.filter((r) => r.errors.length > 0).length ?? 0;

  return (
    <CsvImportPanel
      title="ייבוא ציוד מ-CSV"
      onDownloadTemplate={downloadTemplate}
      onFileSelected={handleFileSelected}
      rows={rows}
      validCount={validCount}
      errorCount={errorCount}
      onImport={handleImport}
      saving={saving}
      importLabel={`${validCount} פריטים`}
      onClose={onClose}
    />
  );
}
