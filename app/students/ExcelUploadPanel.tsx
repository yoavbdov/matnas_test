"use client";
// ייבוא תלמידים מקובץ CSV — גרור-שחרר, אימות, ייבוא שורות תקינות
// תומך בכל השדות שניתן למלא ידנית בטופס התלמיד
import { useState, useRef } from "react";
import { Upload, Download, X, CheckCircle, AlertCircle } from "lucide-react";
import Btn from "@/components/shared/Btn";
import { addDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import { parseStudentCSV, TEMPLATE_HEADERS, TEMPLATE_EXAMPLE } from "./parseStudentCSV";
import type { AppSettings } from "@/lib/types";

interface Props {
  onClose: () => void;
  settings: Required<AppSettings>;
}

// הורדת קובץ תבנית CSV לדוגמה
function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS.join(","), TEMPLATE_EXAMPLE.join(",")].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "תבנית_ייבוא_תלמידים.csv";
  a.click();
}

export default function ExcelUploadPanel({ onClose, settings }: Props) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ReturnType<typeof parseStudentCSV> | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) { showToast("יש לבחור קובץ CSV", "error"); return; }
    const reader = new FileReader();
    reader.onload = (e) => setRows(parseStudentCSV(e.target?.result as string, settings));
    reader.readAsText(file, "utf-8");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
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
          dob: r.dob ?? "",
          status: r.status ?? "פעיל",
          created_at: new Date().toISOString().slice(0, 10),
        };
        if (r.phone)            doc.phone = r.phone;
        if (r.parent_name)      doc.parent_name = r.parent_name;
        if (r.parent_phone)     doc.parent_phone = r.parent_phone;
        if (r.israeli_id)       doc.israeli_id = r.israeli_id;
        if (r.email)            doc.email = r.email;
        if (r.address)          doc.address = r.address;
        if (r.grade_override)   doc.grade_override = r.grade_override;
        if (r.israeli_chess_id) doc.israeli_chess_id = r.israeli_chess_id;
        if (r.fide_id)          doc.fide_id = r.fide_id;
        if (r.israeli_rating)   doc.israeli_rating = r.israeli_rating;
        if (r.fide_rating)      doc.fide_rating = r.fide_rating;
        if (r.chess_title)      doc.chess_title = r.chess_title;
        if (r.notes)            doc.notes = r.notes;
        return addDocument("students", doc);
      }));
      showToast(`${valid.length} תלמידים יובאו בהצלחה`, "success");
      onClose();
    } catch { showToast("שגיאה בייבוא, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  const validCount = rows?.filter((r) => r.errors.length === 0).length ?? 0;
  const errorCount = rows?.filter((r) => r.errors.length > 0).length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">ייבוא תלמידים מ-CSV</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* שלב 1 — הורד תבנית */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">שלב 1 — הורד תבנית</p>
            <p className="text-xs text-gray-400 mb-2">
              התבנית מכילה את כל השדות. עמודות עם <span className="text-red-400 font-bold">*</span> הן חובה.
            </p>
            <Btn variant="secondary" onClick={downloadTemplate} className="text-xs px-3 py-2">
              <Download size={13} />הורד תבנית CSV
            </Btn>
          </div>

          {/* שלב 2 — העלה קובץ */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">שלב 2 — העלה קובץ</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragging ? "border-teal-400 bg-teal-50" : "border-gray-200 hover:border-teal-300"
              }`}
            >
              <Upload size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">גרור קובץ CSV לכאן</p>
              <p className="text-xs text-gray-400">או לחץ לבחירת קובץ</p>
            </div>
            <input ref={inputRef} type="file" accept=".csv" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {/* שלב 3 — תוצאות */}
          {rows !== null && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">שלב 3 — תוצאות</p>
              <div className="flex gap-3 mb-3">
                <div className="flex items-center gap-1.5 text-sm text-teal-600">
                  <CheckCircle size={15} />{validCount} שורות תקינות
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-red-500">
                    <AlertCircle size={15} />{errorCount} שורות עם שגיאות
                  </div>
                )}
              </div>
              {rows.filter((r) => r.errors.length > 0).map((r) => (
                <div key={r.lineNum} className="mb-1 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5">
                  <span className="font-medium">שורה {r.lineNum}:</span> {r.errors.join(" · ")}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={onClose}>ביטול</Btn>
          <Btn onClick={handleImport} loading={saving} disabled={validCount === 0 || errorCount > 0}>
            ייבא {validCount > 0 ? `${validCount} תלמידים` : ""}
          </Btn>
        </div>
      </div>
    </div>
  );
}
