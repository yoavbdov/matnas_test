"use client";
// ייבוא תלמידים מקובץ CSV — גרור-שחרר, אימות, ייבוא שורות תקינות
import { useState, useRef } from "react";
import { Upload, Download, X, CheckCircle, AlertCircle } from "lucide-react";
import Btn from "@/components/shared/Btn";
import { addDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import type { AppSettings } from "@/lib/types";

interface Props {
  onClose: () => void;
  settings: Required<AppSettings>;
}

interface ParsedRow {
  lineNum: number;
  first_name?: string;
  last_name?: string;
  dob?: string;         // YYYY-MM-DD
  phone?: string;
  parent_name?: string;
  parent_phone?: string;
  israeli_id?: string;
  errors: string[];
}

const TEMPLATE_HEADERS = ["שם פרטי", "שם משפחה", "תאריך לידה (DD/MM/YYYY)", "טלפון", "שם הורה", "טלפון הורה", "תעודת זהות"];
const TEMPLATE_EXAMPLE = ["ישראל", "ישראלי", "15/03/2015", "0501234567", "אורה ישראלי", "0509876543", "123456789"];

// Parse DD/MM/YYYY or YYYY-MM-DD to YYYY-MM-DD
function parseDateStr(raw: string): string | null {
  raw = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

function parseCSV(text: string, settings: Required<AppSettings>): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  return lines.slice(1).map((line, i) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const [fn, ln, dobRaw, phone, parentName, parentPhone, idRaw] = cols;
    const errors: string[] = [];

    if (!fn) errors.push("שם פרטי חסר");
    if (!ln) errors.push("שם משפחה חסר");

    const dob = dobRaw ? parseDateStr(dobRaw) : null;
    if (dobRaw && !dob) errors.push("תאריך לידה לא תקין");

    if (phone && !/^\d{10}$/.test(phone.replace(/\D/g, ""))) errors.push("טלפון לא תקין");
    if (parentPhone && !/^\d{10}$/.test(parentPhone.replace(/\D/g, ""))) errors.push("טלפון הורה לא תקין");

    const israeli_id = idRaw?.replace(/\D/g, "");
    if (israeli_id && israeli_id.length !== settings.ID_NUMBER_LENGTH) {
      errors.push(`ת״ז חייבת להיות ${settings.ID_NUMBER_LENGTH} ספרות`);
    }

    return {
      lineNum: i + 2,
      first_name: fn,
      last_name: ln,
      dob: dob ?? undefined,
      phone: phone || undefined,
      parent_name: parentName || undefined,
      parent_phone: parentPhone || undefined,
      israeli_id: israeli_id || undefined,
      errors,
    };
  });
}

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
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) { showToast("יש לבחור קובץ CSV", "error"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRows(parseCSV(text, settings));
    };
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
    const valid = rows.filter((r) => r.errors.length === 0);
    if (valid.length === 0) { showToast("אין שורות תקינות לייבוא", "error"); return; }
    setSaving(true);
    try {
      await Promise.all(valid.map((r) =>
        addDocument("students", {
          first_name: r.first_name!,
          last_name: r.last_name!,
          dob: r.dob ?? "",
          phone: r.phone,
          parent_name: r.parent_name,
          parent_phone: r.parent_phone,
          israeli_id: r.israeli_id,
          status: "פעיל",
          created_at: new Date().toISOString().slice(0, 10),
        })
      ));
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
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Step 1: Download template */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">שלב 1 — הורד תבנית</p>
            <Btn variant="secondary" onClick={downloadTemplate} className="text-xs px-3 py-2">
              <Download size={13} />הורד תבנית CSV
            </Btn>
          </div>

          {/* Step 2: Upload */}
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
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {/* Step 3: Results */}
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

              {/* Error list */}
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
          <Btn onClick={handleImport} loading={saving} disabled={validCount === 0}>
            ייבא {validCount > 0 ? `${validCount} תלמידים` : ""}
          </Btn>
        </div>
      </div>
    </div>
  );
}
