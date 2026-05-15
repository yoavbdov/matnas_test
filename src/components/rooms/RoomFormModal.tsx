"use client";
// טופס הוספה/עריכה של חדר
import Modal from "@/components/shared/Modal";
import Field from "@/components/shared/Field";
import TagInput from "@/components/shared/TagInput";
import Btn from "@/components/shared/Btn";
import type { Room, AppSettings } from "@/lib/types";

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

interface Props {
  mode: "add" | "edit";
  form: Omit<Room, "id">;
  setForm: React.Dispatch<React.SetStateAction<Omit<Room, "id">>>;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void; // זמין רק במצב עריכה
  settings: Required<AppSettings>;
}

export default function RoomFormModal({ mode, form, setForm, saving, onClose, onSave, onDelete, settings }: Props) {
  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <Modal
      title={mode === "add" ? "הוספת חדר" : "עריכת חדר"}
      onClose={onClose}
      size="md"
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
      <div className="grid grid-cols-2 gap-4">
        <Field label="שם החדר" required>
          <input className={inp} value={form.name} maxLength={settings.MAX_STRING_LENGTH} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="מספר חדר">
          <input className={inp} value={form.number ?? ""} maxLength={10} onChange={(e) => set("number", e.target.value)} />
        </Field>
        <Field label="קיבולת מקסימלית" required hint={`עד ${settings.MAX_ROOM_CAPACITY}`}>
          <input type="number" className={inp} value={form.capacity} min={1} max={settings.MAX_ROOM_CAPACITY}
            onChange={(e) => set("capacity", Math.max(1, Number(e.target.value)))} />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="תכונות" hint="לדוגמה: מקרן, לוח, מזגן">
          <TagInput
            value={form.features ?? []}
            onChange={(v) => set("features", v)}
            maxTags={settings.MAX_TAGS_PER_FIELD}
            maxTagLength={settings.MAX_TAG_LENGTH}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="הערות">
          <textarea className={inp} rows={3} value={form.notes ?? ""} maxLength={settings.MAX_NOTE_LENGTH} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
