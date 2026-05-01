"use client";
// טופס הוספה/עריכה של משאב (ציוד)
import Modal from "@/components/shared/Modal";
import Field from "@/components/shared/Field";
import Btn from "@/components/shared/Btn";
import type { Resource, AppSettings } from "@/lib/types";

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

interface Props {
  mode: "add" | "edit";
  form: Omit<Resource, "id">;
  setForm: React.Dispatch<React.SetStateAction<Omit<Resource, "id">>>;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void; // זמין רק במצב עריכה
  settings: Required<AppSettings>;
}

export default function ResourceFormModal({ mode, form, setForm, saving, onClose, onSave, onDelete, settings }: Props) {
  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <Modal
      title={mode === "add" ? "הוספת ציוד" : "עריכת ציוד"}
      onClose={onClose}
      size="sm"
      footer={
        <>
          {/* כפתור מחיקה — מוצג רק בעריכה */}
          {mode === "edit" && onDelete && (
            <Btn variant="ghost" className="text-red-500 hover:bg-red-50 ml-auto" onClick={onDelete}>מחיקה</Btn>
          )}
          <Btn variant="secondary" onClick={onClose}>ביטול</Btn>
          <Btn onClick={onSave} loading={saving}>שמור</Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="שם" required>
          <input className={inp} value={form.name} maxLength={settings.MAX_STRING_LENGTH} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="כמות זמינה">
          <input type="number" className={inp} value={form.quantity} min={0} max={settings.MAX_INT_INPUT}
            onChange={(e) => set("quantity", Math.max(0, Number(e.target.value)))} />
        </Field>
        <Field label="הערות">
          <textarea className={inp} rows={2} value={form.notes ?? ""} maxLength={settings.MAX_NOTE_LENGTH}
            onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
