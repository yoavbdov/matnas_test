"use client";
import { useState, useEffect } from "react";
import PageShell from "@/components/shared/PageShell";
import Field from "@/components/shared/Field";
import Btn from "@/components/shared/Btn";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { updateDocument, addDocument } from "@/firebase/firestore";
import { DEFAULT_SETTINGS } from "@/lib/config";
import type { AppSettings } from "@/lib/types";

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

type SettingsForm = Required<AppSettings>;

const FIELDS: { key: keyof SettingsForm; label: string; hint?: string }[] = [
  { key: "MAX_STRING_LENGTH", label: "אורך מקסימלי לשדה טקסט", hint: "תווים" },
  { key: "MAX_NOTE_LENGTH", label: "אורך מקסימלי להערות", hint: "תווים" },
  { key: "MAX_SEARCH_LENGTH", label: "אורך מקסימלי לחיפוש", hint: "תווים" },
  { key: "MAX_INT_INPUT", label: "ערך מספרי מקסימלי" },
  { key: "MAX_AGE", label: "גיל מקסימלי", hint: "שנים" },
  { key: "MAX_ROOM_CAPACITY", label: "קיבולת חדר מקסימלית", hint: "תלמידים" },
  { key: "ID_NUMBER_LENGTH", label: "אורך תעודת זהות", hint: "ספרות" },
  { key: "MAX_TAG_LENGTH", label: "אורך מקסימלי לתגית", hint: "תווים" },
  { key: "MAX_TAGS_PER_FIELD", label: "מספר מקסימלי של תגיות לשדה" },
  { key: "MAX_PHONE_LENGTH", label: "אורך מקסימלי לטלפון", hint: "ספרות" },
  { key: "DATE_PAST_YEARS", label: "שנים אחורה לבחירת תאריך" },
  { key: "DATE_FUTURE_YEARS", label: "שנים קדימה לבחירת תאריך" },
  { key: "GRADE_FIRST_AGE", label: "גיל כניסה לכיתה א׳", hint: "שנים" },
  { key: "GRADE_ADULT_AGE", label: "גיל בוגר", hint: "שנים" },
  { key: "DEFAULT_AGE_MIN", label: "גיל מינימלי ברירת מחדל לחוג" },
  { key: "DEFAULT_AGE_MAX", label: "גיל מקסימלי ברירת מחדל לחוג" },
  { key: "CLASS_NEAR_FULL_THRESHOLD", label: "סף ״כמעט מלא״", hint: "0–1 (למשל 0.8 = 80%)" },
];

export default function SettingsPage() {
  const { settings } = useData();
  const { showToast } = useToast();
  const [form, setForm] = useState<SettingsForm>({ ...DEFAULT_SETTINGS });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm({ ...settings });
    setDirty(false);
  }, [settings]);

  function set(key: keyof SettingsForm, value: number) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Try update first; if settings doc doesn't exist yet, create it
      try {
        await updateDocument("settings", "main", form);
      } catch {
        await addDocument("settings", { ...form, id: "main" });
      }
      showToast("ההגדרות נשמרו בהצלחה", "success");
      setDirty(false);
    } catch {
      showToast("שגיאה בשמירה, נסה שוב", "error");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm({ ...DEFAULT_SETTINGS });
    setDirty(true);
  }

  return (
    <PageShell title="הגדרות">
      <div className="max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">הגדרות מערכת</p>
          <div className="grid grid-cols-2 gap-4">
            {FIELDS.map(({ key, label, hint }) => (
              <Field key={key} label={label} hint={hint}>
                <input
                  type="number"
                  className={inp}
                  value={form[key]}
                  step={key === "CLASS_NEAR_FULL_THRESHOLD" ? 0.05 : 1}
                  min={0}
                  onChange={(e) => set(key, Number(e.target.value))}
                />
              </Field>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Btn onClick={handleSave} loading={saving} disabled={!dirty}>שמור הגדרות</Btn>
          <Btn variant="secondary" onClick={handleReset}>שחזר ברירות מחדל</Btn>
          {dirty && <p className="text-xs text-orange-500">יש שינויים שלא נשמרו</p>}
        </div>
      </div>
    </PageShell>
  );
}
