"use client";
// מודאל ייבוא קבוצות ליגה מ-CSV
import { useState } from "react";
import CsvImportPanel from "@/components/shared/CsvImportPanel";
import { addDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import { parseLeagueGroupCSV, LEAGUE_GROUP_TEMPLATE_HEADERS, LEAGUE_GROUP_TEMPLATE_EXAMPLE } from "./parseLeagueGroupCSV";

interface Props {
  onClose: () => void;
}

function downloadTemplate() {
  const csv = [LEAGUE_GROUP_TEMPLATE_HEADERS.join(","), LEAGUE_GROUP_TEMPLATE_EXAMPLE.join(",")].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "תבנית_ייבוא_קבוצות_ליגה.csv";
  a.click();
}

// הערה ייחודית — שחקנים יש להוסיף ידנית לאחר הייבוא
const leagueGroupNote = (
  <>
    עמודות עם <span className="text-red-400 font-bold">*</span> הן חובה.
    שחקנים יש להוסיף ידנית לאחר הייבוא.
  </>
);

export default function LeagueGroupImportPanel({ onClose }: Props) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<ReturnType<typeof parseLeagueGroupCSV> | null>(null);
  const [saving, setSaving] = useState(false);

  function handleFileSelected(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => setRows(parseLeagueGroupCSV(e.target?.result as string));
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
          category: r.category!,
          leagueType: r.leagueType!,
          status: r.status ?? "פעיל",
          created_at: new Date().toISOString().slice(0, 10),
        };
        if (r.description) doc.description = r.description;
        if (r.notes)       doc.notes = r.notes;
        return addDocument("leagueGroups", doc);
      }));
      showToast(`${valid.length} קבוצות יובאו בהצלחה`, "success");
      onClose();
    } catch { showToast("שגיאה בייבוא, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  const validCount = rows?.filter((r) => r.errors.length === 0).length ?? 0;
  const errorCount = rows?.filter((r) => r.errors.length > 0).length ?? 0;

  return (
    <CsvImportPanel
      title="ייבוא קבוצות ליגה מ-CSV"
      templateNote={leagueGroupNote}
      onDownloadTemplate={downloadTemplate}
      onFileSelected={handleFileSelected}
      rows={rows}
      validCount={validCount}
      errorCount={errorCount}
      onImport={handleImport}
      saving={saving}
      importLabel={`${validCount} קבוצות`}
      onClose={onClose}
    />
  );
}
