"use client";
import Modal from "@/components/shared/Modal";
import Field from "@/components/shared/Field";
import Btn from "@/components/shared/Btn";
import { CHESS_TITLES } from "@/lib/constants";
import type { Child } from "@/lib/types";
import type { AppSettings } from "@/lib/types";

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

interface Props {
  mode: "add" | "edit";
  form: Omit<Child, "id">;
  setForm: React.Dispatch<React.SetStateAction<Omit<Child, "id">>>;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  settings: Required<AppSettings>;
}

export default function StudentFormModal({ mode, form, setForm, saving, onClose, onSave, settings }: Props) {
  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <Modal
      title={mode === "add" ? "הוספת תלמיד" : "עריכת תלמיד"}
      onClose={onClose}
      size="lg"
      footer={<><Btn variant="secondary" onClick={onClose}>ביטול</Btn><Btn onClick={onSave} loading={saving}>שמור</Btn></>}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="שם פרטי" required>
          <input className={inp} value={form.first_name} maxLength={settings.MAX_STRING_LENGTH} onChange={(e) => set("first_name", e.target.value)} />
        </Field>
        <Field label="שם משפחה" required>
          <input className={inp} value={form.last_name} maxLength={settings.MAX_STRING_LENGTH} onChange={(e) => set("last_name", e.target.value)} />
        </Field>
        <Field label="תאריך לידה" required>
          <input type="date" className={inp} value={form.dob} onChange={(e) => set("dob", e.target.value)} />
        </Field>
        <Field label="סטטוס">
          <select className={inp} value={form.status} onChange={(e) => set("status", e.target.value as Child["status"])}>
            <option>פעיל</option><option>לא פעיל</option>
          </select>
        </Field>
        <Field label="תעודת זהות" hint={`${settings.ID_NUMBER_LENGTH} ספרות`}>
          <input className={inp} value={form.israeli_id ?? ""} maxLength={settings.ID_NUMBER_LENGTH} onChange={(e) => set("israeli_id", e.target.value)} />
        </Field>
        <Field label="טלפון">
          <input className={inp} value={form.phone ?? ""} maxLength={settings.MAX_PHONE_LENGTH} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="שם הורה">
          <input className={inp} value={form.parent_name ?? ""} maxLength={settings.MAX_STRING_LENGTH} onChange={(e) => set("parent_name", e.target.value)} />
        </Field>
        <Field label="טלפון הורה">
          <input className={inp} value={form.parent_phone ?? ""} maxLength={settings.MAX_PHONE_LENGTH} onChange={(e) => set("parent_phone", e.target.value)} />
        </Field>
        <Field label="אימייל">
          <input type="email" className={inp} value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="כתובת">
          <input className={inp} value={form.address ?? ""} maxLength={settings.MAX_STRING_LENGTH * 2} onChange={(e) => set("address", e.target.value)} />
        </Field>
      </div>

      <hr className="my-4 border-gray-100" />
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">פרטי שחמט</p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="מספר שחקן ישראלי">
          <input className={inp} value={form.israeli_chess_id ?? ""} onChange={(e) => set("israeli_chess_id", e.target.value)} />
        </Field>
        <Field label="FIDE ID">
          <input className={inp} value={form.fide_id ?? ""} onChange={(e) => set("fide_id", e.target.value)} />
        </Field>
        <Field label="דירוג ישראלי">
          <input type="number" className={inp} value={form.israeli_rating ?? ""} min={0} max={settings.MAX_INT_INPUT} onChange={(e) => set("israeli_rating", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>
        <Field label="דירוג FIDE">
          <input type="number" className={inp} value={form.fide_rating ?? ""} min={0} max={settings.MAX_INT_INPUT} onChange={(e) => set("fide_rating", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>
        <Field label="תואר">
          <select className={inp} value={form.chess_title ?? ""} onChange={(e) => set("chess_title", e.target.value)}>
            <option value="">ללא תואר</option>
            {CHESS_TITLES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      <hr className="my-4 border-gray-100" />
      <Field label="הערות">
        <textarea className={inp} rows={3} value={form.notes ?? ""} maxLength={settings.MAX_NOTE_LENGTH} onChange={(e) => set("notes", e.target.value)} />
      </Field>
    </Modal>
  );
}
