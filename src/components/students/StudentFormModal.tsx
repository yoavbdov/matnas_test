/*
  CHILD FORM MODAL — add a new student or edit an existing one.
  This is the detailed form used directly on the students page.
  Shows grade label below the date-of-birth field automatically.
*/

"use client";
import Modal from "@/components/shared/Modal";
import Field from "@/components/shared/Field";
import Btn from "@/components/shared/Btn";
import { CHESS_TITLES, GRADE_LABELS } from "@/lib/config/constants";
import { gradeFromDob } from "@/lib/utils/utils";
import { LIMITS, digitsOnly } from "@/lib/validation/validators";
import type { Student } from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/config/config";

const inp =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

interface Props {
  mode: "add" | "edit";
  form: Omit<Student, "id">;
  setForm: React.Dispatch<React.SetStateAction<Omit<Student, "id">>>;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  settings: typeof DEFAULT_SETTINGS;
}

export default function StudentFormModal({
  mode,
  form,
  setForm,
  saving,
  onClose,
  onSave,
  settings,
}: Props) {
  // Shorthand for updating a single field
  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const gradeLabel = form.dob
    ? gradeFromDob(form.dob, settings.GRADE_FIRST_AGE, settings.GRADE_ADULT_AGE)
    : "";

  return (
    <Modal
      title={mode === "add" ? "הוספת שחקן" : "עריכת שחקן"}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            ביטול
          </Btn>
          <Btn onClick={onSave} loading={saving}>
            שמור
          </Btn>
        </>
      }
    >
      {/* ── Basic details ── */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="שם פרטי" required>
          <input
            className={inp}
            value={form.first_name}
            maxLength={settings.MAX_STRING_LENGTH}
            onChange={(e) => set("first_name", e.target.value)}
          />
        </Field>
        <Field label="שם משפחה" required>
          <input
            className={inp}
            value={form.last_name}
            maxLength={settings.MAX_STRING_LENGTH}
            onChange={(e) => set("last_name", e.target.value)}
          />
        </Field>

        <Field
          label="תאריך לידה"
          required
          hint={gradeLabel || undefined}
        >
          <input
            type="date"
            className={inp}
            value={form.dob}
            onChange={(e) => set("dob", e.target.value)}
          />
        </Field>

        {/* סטטוס מחושב אוטומטית — אי אפשר לערוך ידנית */}

        {/* Manual grade override — leave empty to auto-compute from DOB */}
        <Field label="כיתה (ידני)" hint={gradeLabel ? `חישוב אוטומטי: ${gradeLabel}` : "מחושב אוטומטית מתאריך לידה"}>
          <select
            className={inp}
            value={form.grade_override ?? ""}
            onChange={(e) => set("grade_override", e.target.value || undefined)}
          >
            <option value="">— אוטומטי —</option>
            {GRADE_LABELS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>

        {/* ת"ז — ספרות בלבד, עד 9 */}
        <Field label="תעודת זהות" hint={`עד ${LIMITS.ISRAELI_ID} ספרות בלבד`}>
          <input
            className={inp}
            value={form.israeli_id ?? ""}
            inputMode="numeric"
            onChange={(e) => set("israeli_id", digitsOnly(e.target.value, LIMITS.ISRAELI_ID))}
          />
        </Field>

        {/* טלפון — ספרות בלבד, בדיוק 10 */}
        <Field label="טלפון" hint="10 ספרות בלבד">
          <input
            className={inp}
            value={form.phone ?? ""}
            inputMode="numeric"
            onChange={(e) => set("phone", digitsOnly(e.target.value, LIMITS.PHONE))}
          />
        </Field>

        <Field label="אימייל" hint={`עד ${LIMITS.EMAIL} תווים`}>
          <input
            type="email"
            className={inp}
            value={form.email ?? ""}
            maxLength={LIMITS.EMAIL}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="כתובת" hint={`עד ${LIMITS.ADDRESS} תווים`}>
          <input
            className={inp}
            value={form.address ?? ""}
            maxLength={LIMITS.ADDRESS}
            onChange={(e) => set("address", e.target.value)}
          />
        </Field>
      </div>

      <hr className="my-4 border-gray-100" />

      {/* ── Chess details ── */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        פרטי שחמט
      </p>
      <div className="grid grid-cols-2 gap-4">
        {/* מספר שחקן — ספרות בלבד, עד 6 */}
        <Field label="מספר שחקן ישראלי" hint={`עד ${LIMITS.ISRAELI_CHESS_ID} ספרות`}>
          <input
            className={inp}
            value={form.israeli_chess_id ?? ""}
            inputMode="numeric"
            onChange={(e) => set("israeli_chess_id", digitsOnly(e.target.value, LIMITS.ISRAELI_CHESS_ID))}
          />
        </Field>

        {/* FIDE ID — ספרות בלבד, עד 9 */}
        <Field label="FIDE ID" hint={`עד ${LIMITS.FIDE_ID} ספרות`}>
          <input
            className={inp}
            value={form.fide_id ?? ""}
            inputMode="numeric"
            onChange={(e) => set("fide_id", digitsOnly(e.target.value, LIMITS.FIDE_ID))}
          />
        </Field>
        <Field label="דירוג ישראלי" hint="מתעדכן אוטומטית מהסינכרון">
          <input
            type="number"
            className={inp}
            value={form.israeli_rating ?? ""}
            min={0}
            max={settings.MAX_INT_INPUT}
            onChange={(e) =>
              set("israeli_rating", e.target.value ? Number(e.target.value) : undefined)
            }
          />
        </Field>
        <Field label="דירוג FIDE" hint="מתעדכן אוטומטית מהסינכרון">
          <input
            type="number"
            className={inp}
            value={form.fide_rating ?? ""}
            min={0}
            max={settings.MAX_INT_INPUT}
            onChange={(e) =>
              set("fide_rating", e.target.value ? Number(e.target.value) : undefined)
            }
          />
        </Field>
        <Field label="תואר שחמטאי">
          <select
            className={inp}
            value={form.chess_title ?? ""}
            onChange={(e) => set("chess_title", e.target.value)}
          >
            <option value="">ללא תואר</option>
            {CHESS_TITLES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <hr className="my-4 border-gray-100" />

      {/* ── Notes ── */}
      <Field label="הערות">
        <textarea
          className={inp}
          rows={3}
          value={form.notes ?? ""}
          maxLength={settings.MAX_NOTE_LENGTH}
          onChange={(e) => set("notes", e.target.value)}
        />
      </Field>
    </Modal>
  );
}
