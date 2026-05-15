"use client";
/*
  ImportAttendanceCsvModal — ייבוא נוכחות מ-CSV.

  הפורמט הנתמך זהה לפורמט הייצוא:
    שורה 1: "שם תלמיד" | DD.M.YYYY | ...
    שורות N: "שם פרטי שם משפחה" | "נכח"/"לא נכח"/""

  המשתמש בוחר לאיזה חוג לייבא — השמות ימותאמו לתלמידים הרשומים בחוג.
*/
import { useState, useRef } from "react";
import { Upload, X, AlertCircle, CheckCircle } from "lucide-react";
import Btn from "@/components/shared/Btn";
import { addDocument, updateDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import { parseAttendanceCsv } from "./parseAttendanceCsv";
import type { Class, Student, Enrollment, Attendance } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  classes: Class[];
  students: Student[];
  enrollments: Enrollment[];
  allAttendance: Attendance[];
  onClose: () => void;
}

// sentinel for the "no class selected" state
const SENTINEL_NONE = "__none__";

export default function ImportAttendanceCsvModal({ classes, students, enrollments, allAttendance, onClose }: Props) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [parsed, setParsed] = useState<ReturnType<typeof parseAttendanceCsv> | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) { showToast("יש לבחור קובץ CSV", "error"); return; }
    const reader = new FileReader();
    reader.onload = (e) => setParsed(parseAttendanceCsv(e.target?.result as string));
    reader.readAsText(file, "utf-8");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    if (!parsed || !selectedClassId) return;

    // מציאת תלמידים הרשומים לחוג
    const enrolled = students.filter((s) =>
      enrollments.some((e) => e.class_id === selectedClassId && e.student_id === s.id && e.status === "פעיל")
    );

    // מפה: "שם פרטי שם משפחה" → student_id
    const nameMap = new Map(enrolled.map((s) => [`${s.first_name} ${s.last_name}`, s.id]));

    setSaving(true);
    try {
      for (const date of parsed.dates) {
        const entries = parsed.dateMap[date];
        const records = entries
          .filter((e) => e.present !== null && nameMap.has(e.studentName))
          .map((e) => ({ student_id: nameMap.get(e.studentName)!, present: e.present! }));

        if (records.length === 0) continue;

        // בדוק אם קיים כבר מסמך נוכחות לתאריך זה
        const existing = allAttendance.find((a) => a.class_id === selectedClassId && a.date === date);
        if (existing) {
          await updateDocument("attendance", existing.id, { records });
        } else {
          await addDocument("attendance", {
            class_id: selectedClassId,
            date,
            records,
            created_at: new Date().toISOString(),
          });
        }
      }
      showToast(`נוכחות ל-${parsed.dates.length} שיעורים יובאה בהצלחה`, "success");
      onClose();
    } catch { showToast("שגיאה בייבוא, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  const hasErrors = (parsed?.errors ?? []).length > 0;
  const canImport = !!selectedClassId && parsed !== null && !hasErrors && parsed.dates.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">ייבוא נוכחות מ-CSV</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 h-8 w-8">
            <X size={18} />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* בחר חוג */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">שלב 1 — בחר חוג</p>
            <Select
              value={selectedClassId || SENTINEL_NONE}
              onValueChange={(v: string) => setSelectedClassId(v === SENTINEL_NONE ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="— בחר חוג —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SENTINEL_NONE}>— בחר חוג —</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* העלה קובץ */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">שלב 2 — העלה קובץ CSV</p>
            <p className="text-xs text-gray-400 mb-2">השתמש בפורמט הייצוא הקיים — עמודות תאריכים בפורמט DD.M.YYYY.</p>
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

          {/* תוצאות */}
          {parsed !== null && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">שלב 3 — תוצאות</p>
              {parsed.errors.length > 0 ? (
                parsed.errors.map((err, i) => (
                  <div key={i} className="mb-1 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5">
                    <AlertCircle size={13} className="inline ml-1" />{err}
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-1.5 text-sm text-teal-600">
                  <CheckCircle size={15} />{parsed.dates.length} שיעורים, {parsed.studentNames.length} תלמידים
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={onClose}>ביטול</Btn>
          <Btn onClick={handleImport} loading={saving} disabled={!canImport}>
            ייבא נוכחות
          </Btn>
        </div>
      </div>
    </div>
  );
}
