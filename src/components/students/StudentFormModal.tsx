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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { Student } from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/config/config";

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
          <Input
            value={form.first_name}
            maxLength={settings.MAX_STRING_LENGTH}
            onChange={(e) => set("first_name", e.target.value)}
          />
        </Field>
        <Field label="שם משפחה" required>
          <Input
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
          <Input
            type="date"
            value={form.dob}
            onChange={(e) => set("dob", e.target.value)}
          />
        </Field>

        {/* סטטוס מחושב אוטומטית — אי אפשר לערוך ידנית */}

        {/* Manual grade override — leave empty to auto-compute from DOB */}
        <Field label="כיתה (ידני)" hint={gradeLabel ? `חישוב אוטומטי: ${gradeLabel}` : "מחושב אוטומטית מתאריך לידה"}>
          <Select
            value={form.grade_override ?? "__auto__"}
            onValueChange={(v: string) =>
              set("grade_override", v === "__auto__" ? undefined : v)
            }
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__auto__">— אוטומטי —</SelectItem>
              {GRADE_LABELS.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* ת"ז — ספרות בלבד, עד 9 */}
        <Field label="תעודת זהות" hint={`עד ${LIMITS.ISRAELI_ID} ספרות בלבד`}>
          <Input
            value={form.israeli_id ?? ""}
            inputMode="numeric"
            onChange={(e) => set("israeli_id", digitsOnly(e.target.value, LIMITS.ISRAELI_ID))}
          />
        </Field>

        {/* טלפון — ספרות בלבד, בדיוק 10 */}
        <Field label="טלפון" hint="10 ספרות בלבד">
          <Input
            value={form.phone ?? ""}
            inputMode="numeric"
            onChange={(e) => set("phone", digitsOnly(e.target.value, LIMITS.PHONE))}
          />
        </Field>

        <Field label="אימייל" hint={`עד ${LIMITS.EMAIL} תווים`}>
          <Input
            type="email"
            value={form.email ?? ""}
            maxLength={LIMITS.EMAIL}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="כתובת" hint={`עד ${LIMITS.ADDRESS} תווים`}>
          <Input
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
          <Input
            value={form.israeli_chess_id ?? ""}
            inputMode="numeric"
            onChange={(e) => set("israeli_chess_id", digitsOnly(e.target.value, LIMITS.ISRAELI_CHESS_ID))}
          />
        </Field>

        {/* FIDE ID — ספרות בלבד, עד 9 */}
        <Field label="FIDE ID" hint={`עד ${LIMITS.FIDE_ID} ספרות`}>
          <Input
            value={form.fide_id ?? ""}
            inputMode="numeric"
            onChange={(e) => set("fide_id", digitsOnly(e.target.value, LIMITS.FIDE_ID))}
          />
        </Field>
        <Field label="דירוג ישראלי" hint="מתעדכן אוטומטית מהסינכרון">
          <Input
            type="number"
            value={form.israeli_rating ?? ""}
            min={0}
            max={settings.MAX_INT_INPUT}
            onChange={(e) =>
              set("israeli_rating", e.target.value ? Number(e.target.value) : undefined)
            }
          />
        </Field>
        <Field label="דירוג FIDE" hint="מתעדכן אוטומטית מהסינכרון">
          <Input
            type="number"
            value={form.fide_rating ?? ""}
            min={0}
            max={settings.MAX_INT_INPUT}
            onChange={(e) =>
              set("fide_rating", e.target.value ? Number(e.target.value) : undefined)
            }
          />
        </Field>
        <Field label="תואר שחמטאי">
          <Select
            value={form.chess_title ?? "__none__"}
            onValueChange={(v: string) =>
              set("chess_title", v === "__none__" ? "" : v)
            }
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">ללא תואר</SelectItem>
              {CHESS_TITLES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <hr className="my-4 border-gray-100" />

      {/* ── Notes ── */}
      <Field label="הערות">
        <Textarea
          rows={3}
          value={form.notes ?? ""}
          maxLength={settings.MAX_NOTE_LENGTH}
          onChange={(e) => set("notes", e.target.value)}
        />
      </Field>
    </Modal>
  );
}
