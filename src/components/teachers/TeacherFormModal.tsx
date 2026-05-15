"use client";
// טופס הוספה/עריכה של מדריך
import Modal from "@/components/shared/Modal";
import Field from "@/components/shared/Field";
import TagInput from "@/components/shared/TagInput";
import Btn from "@/components/shared/Btn";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS, digitsOnly } from "@/lib/validation/validators";
import type { Teacher } from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/config/config";

interface Props {
  mode: "add" | "edit";
  form: Omit<Teacher, "id">;
  setForm: React.Dispatch<React.SetStateAction<Omit<Teacher, "id">>>;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  settings: typeof DEFAULT_SETTINGS;
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
          <Input value={form.first_name} maxLength={settings.MAX_STRING_LENGTH} onChange={(e) => set("first_name", e.target.value)} />
        </Field>
        <Field label="שם משפחה" required>
          <Input value={form.last_name} maxLength={settings.MAX_STRING_LENGTH} onChange={(e) => set("last_name", e.target.value)} />
        </Field>
        <Field label="טלפון" hint="10 ספרות בלבד">
          <Input value={form.phone ?? ""} inputMode="numeric" onChange={(e) => set("phone", digitsOnly(e.target.value, LIMITS.PHONE))} />
        </Field>
        <Field label="אימייל" hint={`עד ${LIMITS.EMAIL} תווים`}>
          <Input type="email" value={form.email ?? ""} maxLength={LIMITS.EMAIL} onChange={(e) => set("email", e.target.value)} />
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
          <Textarea rows={3} value={form.notes ?? ""} maxLength={settings.MAX_NOTE_LENGTH} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
