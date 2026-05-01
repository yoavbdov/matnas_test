// שדות בסיסיים של חוג: שם, מדריך, קיבולת, טווח גילאים ודירוגים
import Field from "@/components/shared/Field";
import { CLASS_COLORS } from "@/lib/constants";
import type { Class, Teacher, AppSettings } from "@/lib/types";

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

type FormData = Omit<Class, "id">;

interface Props {
  form: FormData;
  teachers: Teacher[];
  settings: Required<AppSettings>;
  onChange: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}

export default function ClassBasicFields({ form, teachers, settings, onChange }: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="שם החוג" required>
          <input
            className={inp}
            value={form.name}
            maxLength={settings.MAX_STRING_LENGTH}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </Field>

        <Field label="מדריך" required>
          <select className={inp} value={form.teacher_id} onChange={(e) => onChange("teacher_id", e.target.value)}>
            <option value="">— בחר מדריך —</option>
            {teachers.filter((t) => t.status === "פעיל").map((t) => (
              <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
            ))}
          </select>
        </Field>

        <Field label="קיבולת">
          <input
            type="number" className={inp}
            value={form.capacity} min={1} max={settings.MAX_ROOM_CAPACITY}
            onChange={(e) => onChange("capacity", Math.max(1, Number(e.target.value)))}
          />
        </Field>

        <Field label="סטטוס">
          <select className={inp} value={form.status} onChange={(e) => onChange("status", e.target.value as Class["status"])}>
            <option>פעיל</option><option>לא פעיל</option>
          </select>
        </Field>

        <Field label="גיל מינימלי">
          <input type="number" className={inp} value={form.age_min ?? ""} min={0} max={settings.MAX_AGE}
            onChange={(e) => onChange("age_min", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>

        <Field label="גיל מקסימלי">
          <input type="number" className={inp} value={form.age_max ?? ""} min={0} max={settings.MAX_AGE}
            onChange={(e) => onChange("age_max", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>

        <Field label="דירוג מינימלי">
          <input type="number" className={inp} value={form.rating_min ?? ""} min={0} max={3000}
            onChange={(e) => onChange("rating_min", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>

        <Field label="דירוג מקסימלי">
          <input type="number" className={inp} value={form.rating_max ?? ""} min={0} max={3000}
            onChange={(e) => onChange("rating_max", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>
      </div>

      {/* Color picker */}
      <div className="mt-4">
        <Field label="צבע זיהוי">
          <div className="flex gap-2 mt-1">
            {CLASS_COLORS.map((c) => (
              <button
                key={c} type="button"
                onClick={() => onChange("color", c)}
                className={`w-7 h-7 rounded-full border-2 transition-transform ${
                  form.color === c ? "border-gray-700 scale-110" : "border-transparent"
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </Field>
      </div>
    </>
  );
}
