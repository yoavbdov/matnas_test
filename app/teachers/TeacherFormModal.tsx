"use client";
// טופס הוספה/עריכה של מדריך
import Modal from "@/components/shared/Modal";
import Field from "@/components/shared/Field";
import TagInput from "@/components/shared/TagInput";
import Btn from "@/components/shared/Btn";
import type { Teacher, AppSettings } from "@/lib/types";

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

interface Props {
  mode: "add" | "edit";
  form: Omit<Teacher, "id">;
  setForm: React.Dispatch<React.SetStateAction<Omit<Teacher, "id">>>;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  settings: Required<AppSettings>;
}

export default function TeacherFormModal({ mode, form, setForm, saving, onClose, onSave, settings }: Props) {
  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <Modal
      title={mode === "add" ? "הוספת מדריך" : "עריכת מדריך"}
      onClose={onClose}
      size="md"
      footer={<><Btn variant="secondary" onClick={onClose}>ביטול</Btn><Btn onClick={onSave} loading={saving}>שמור</Btn></>}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="שם פרטי" required>
          <input className={inp} value={form.first_name} maxLength={settings.MAX_STRING_LENGTH} onChange={(e) => set("first_name", e.target.value)} />
        </Field>
        <Field label="שם משפחה" required>
          <input className={inp} value={form.last_name} maxLength={settings.MAX_STRING_LENGTH} onChange={(e) => set("last_name", e.target.value)} />
        </Field>
        <Field label="טלפון">
          <input className={inp} value={form.phone ?? ""} maxLength={settings.MAX_PHONE_LENGTH} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="אימייל">
          <input type="email" className={inp} value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="סטטוס">
          <select className={inp} value={form.status} onChange={(e) => set("status", e.target.value as Teacher["status"])}>
            <option>פעיל</option><option>לא פעיל</option>
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="הסמכות" hint="הקלד ולחץ Enter להוספה">
          <TagInput
            value={form.certifications ?? []}
            onChange={(v) => set("certifications", v)}
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
