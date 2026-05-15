"use client";
// מודאל ייבוא תחרויות מ-CSV — שלב 1: הורד תבנית, שלב 2: העלה, שלב 3: ייבא
import { useState } from "react";
import CsvImportPanel from "@/components/shared/CsvImportPanel";
import { addDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import { parseTournamentCSV, TOURNAMENT_TEMPLATE_HEADERS, TOURNAMENT_TEMPLATE_EXAMPLE } from "./parseTournamentCSV";

interface Props {
  onClose: () => void;
}

function downloadTemplate() {
  const csv = [TOURNAMENT_TEMPLATE_HEADERS.join(","), TOURNAMENT_TEMPLATE_EXAMPLE.join(",")].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "תבנית_ייבוא_תחרויות.csv";
  a.click();
}

// הערה ייחודית לתחרויות — סיבובים ומשתתפים ידניים
const tournamentNote = (
  <>
    עמודות עם <span className="text-red-400 font-bold">*</span> הן חובה.
    סיבובים ומשתתפים יש להוסיף ידנית לאחר הייבוא.
  </>
);

export default function TournamentImportPanel({ onClose }: Props) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<ReturnType<typeof parseTournamentCSV> | null>(null);
  const [saving, setSaving] = useState(false);

  function handleFileSelected(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => setRows(parseTournamentCSV(e.target?.result as string));
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
          status: r.status ?? "מתוכנן",
          rounds: [],
          participant_ids: [],
          manual_participants: [],
          is_recurring: r.is_recurring ?? false,
          created_at: new Date().toISOString().slice(0, 10),
        };
        if (r.description)              doc.description = r.description;
        if (r.rating_min !== undefined)  doc.rating_min = r.rating_min;
        if (r.rating_max !== undefined)  doc.rating_max = r.rating_max;
        if (r.age_min !== undefined)     doc.age_min = r.age_min;
        if (r.age_max !== undefined)     doc.age_max = r.age_max;
        if (r.notes)                     doc.notes = r.notes;
        return addDocument("tournaments", doc);
      }));
      showToast(`${valid.length} תחרויות יובאו בהצלחה`, "success");
      onClose();
    } catch { showToast("שגיאה בייבוא, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  const validCount = rows?.filter((r) => r.errors.length === 0).length ?? 0;
  const errorCount = rows?.filter((r) => r.errors.length > 0).length ?? 0;

  return (
    <CsvImportPanel
      title="ייבוא תחרויות מ-CSV"
      templateNote={tournamentNote}
      onDownloadTemplate={downloadTemplate}
      onFileSelected={handleFileSelected}
      rows={rows}
      validCount={validCount}
      errorCount={errorCount}
      onImport={handleImport}
      saving={saving}
      importLabel={`${validCount} תחרויות`}
      onClose={onClose}
    />
  );
}
