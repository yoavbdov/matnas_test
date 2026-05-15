"use client";
// רכיב UI משותף לכל לוחות ייבוא ה-CSV במערכת.
// מטפל במעטפת המודאל, dropzone, ותצוגת תוצאות.
// הלוגיקה הספציפית (פארסינג, שמירה ל-Firestore) נמצאת בכל לוח בנפרד.
import { useRef, useState } from "react";
import { Upload, Download, X, CheckCircle, AlertCircle } from "lucide-react";
import Btn from "@/components/shared/Btn";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";

// כל שורה שחזרה מהפארסר חייבת לכלול lineNum ורשימת שגיאות
export interface ParsedRow {
  lineNum: number;
  errors: string[];
}

interface Props {
  title: string;
  // טקסט עזר נוסף מתחת לכותרת שלב 1 (שונה לכל entity)
  templateNote?: React.ReactNode;
  // כל תוכן נוסף שמוצג מעל שלב 1 (למשל באנר אמבר של חוגים)
  extraBanner?: React.ReactNode;
  onDownloadTemplate: () => void;
  // קריאה לאחר בחירת קובץ — הלוח הספציפי מפעיל את הפארסר ומחזיר את השורות
  onFileSelected: (file: File) => void;
  // תוצאות הפארסינג — null = עדיין לא הועלה קובץ
  rows: ParsedRow[] | null;
  validCount: number;
  errorCount: number;
  onImport: () => void;
  saving: boolean;
  // טקסט על כפתור הייבוא כשיש שורות תקינות, למשל "5 שחקנים"
  importLabel: string;
  onClose: () => void;
}

export default function CsvImportPanel({
  title,
  templateNote,
  extraBanner,
  onDownloadTemplate,
  onFileSelected,
  rows,
  validCount,
  errorCount,
  onImport,
  saving,
  importLabel,
  onClose,
}: Props) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      showToast("יש לבחור קובץ CSV", "error");
      return;
    }
    onFileSelected(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 h-8 w-8"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* באנר נוסף אופציונלי (למשל הודעת מגבלה לחוגים) */}
          {extraBanner}

          {/* שלב 1 — הורד תבנית */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              שלב 1 — הורד תבנית
            </p>
            {templateNote ? (
              <div className="text-xs text-gray-400 mb-2">{templateNote}</div>
            ) : (
              <p className="text-xs text-gray-400 mb-2">
                התבנית מכילה את כל השדות. עמודות עם{" "}
                <span className="text-red-400 font-bold">*</span> הן חובה.
              </p>
            )}
            <Btn
              variant="secondary"
              onClick={onDownloadTemplate}
              className="text-xs px-3 py-2"
            >
              <Download size={13} />
              הורד תבנית CSV
            </Btn>
          </div>

          {/* שלב 2 — העלה קובץ */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              שלב 2 — העלה קובץ
            </p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragging
                  ? "border-teal-400 bg-teal-50"
                  : "border-gray-200 hover:border-teal-300"
              }`}
            >
              <Upload size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">גרור קובץ CSV לכאן</p>
              <p className="text-xs text-gray-400">או לחץ לבחירת קובץ</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {/* שלב 3 — תוצאות (מוצג רק לאחר העלאת קובץ) */}
          {rows !== null && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                שלב 3 — תוצאות
              </p>
              <div className="flex gap-3 mb-3">
                <div className="flex items-center gap-1.5 text-sm text-teal-600">
                  <CheckCircle size={15} />
                  {validCount} שורות תקינות
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-red-500">
                    <AlertCircle size={15} />
                    {errorCount} שורות עם שגיאות
                  </div>
                )}
              </div>
              {rows
                .filter((r) => r.errors.length > 0)
                .map((r) => (
                  <div
                    key={r.lineNum}
                    className="mb-1 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5"
                  >
                    <span className="font-medium">שורה {r.lineNum}:</span>{" "}
                    {r.errors.join(" · ")}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={onClose}>
            ביטול
          </Btn>
          <Btn
            onClick={onImport}
            loading={saving}
            disabled={validCount === 0 || errorCount > 0}
          >
            ייבא {validCount > 0 ? importLabel : ""}
          </Btn>
        </div>
      </div>
    </div>
  );
}
