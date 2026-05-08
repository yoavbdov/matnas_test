// שדות בסיסיים של תחרות: שם, תיאור, הגבלות גיל, הגבלות מד כושר, ציוד, משתתפים
// מבנה זהה לטופס החוג לצורך עקביות חזותית
import Field from "@/components/shared/Field";
import { CLASS_COLORS } from "@/lib/constants";
import TournamentEquipmentSelect from "./TournamentEquipmentSelect";
import type { Tournament, Teacher, Class, PhysicalEquipment } from "@/lib/types";

// Section title used to separate logical groups
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
      {children}
    </p>
  );
}

// The subset of Tournament used in the form (no id, rounds, participants)
export type TournamentFormData = Omit<
  Tournament,
  "id" | "rounds" | "participant_ids" | "manual_participants" | "created_at"
>;

interface Props {
  form: TournamentFormData;
  onChange: (patch: Partial<TournamentFormData>) => void;
  allTeachers: Teacher[];
  physicalEquipment: PhysicalEquipment[];
  allClasses: Class[];
  allTournaments: Tournament[];
  currentTournamentId?: string;
  // How many participants are already registered (shown in the משתתפים section)
  participantCount?: number;
}

export default function TournamentBasicFields({
  form,
  onChange,
  allTeachers,
  physicalEquipment,
  allClasses,
  allTournaments,
  currentTournamentId,
  participantCount = 0,
}: Props) {
  return (
    <div className="space-y-5" dir="rtl">

      {/* שם */}
      <Field label="שם התחרות" required>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </Field>

      {/* שופט — ספציפי לתחרות */}
      <Field label="שופט">
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={form.judge_id ?? ""}
          onChange={(e) => onChange({ judge_id: e.target.value || undefined })}
        >
          <option value="">— ללא שופט —</option>
          {allTeachers
            .filter((t) => t.status === "פעיל")
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.first_name} {t.last_name}
              </option>
            ))}
        </select>
      </Field>

      {/* תיאור */}
      <Field label="תיאור">
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
          rows={2}
          value={form.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="תיאור קצר של התחרות (אופציונלי)"
        />
      </Field>

      {/* הגבלות גיל */}
      <div>
        <SectionLabel>הגבלות גיל</SectionLabel>
        <div className="flex gap-3">
          <Field label="גיל מינימלי">
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.age_min ?? ""}
              onChange={(e) =>
                onChange({ age_min: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="ללא הגבלה"
              min={0}
            />
          </Field>
          <Field label="גיל מקסימלי">
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.age_max ?? ""}
              onChange={(e) =>
                onChange({ age_max: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="ללא הגבלה"
              min={0}
            />
          </Field>
        </div>
      </div>

      {/* הגבלות מד כושר */}
      <div>
        <SectionLabel>הגבלות מד כושר</SectionLabel>
        <div className="flex gap-3">
          <Field label="דירוג מינימלי">
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.rating_min ?? ""}
              onChange={(e) =>
                onChange({ rating_min: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="ללא הגבלה"
              min={0}
            />
          </Field>
          <Field label="דירוג מקסימלי">
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.rating_max ?? ""}
              onChange={(e) =>
                onChange({ rating_max: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="ללא הגבלה"
              min={0}
            />
          </Field>
        </div>
      </div>

      {/* ציוד פיזי נדרש */}
      <div>
        <SectionLabel>ציוד פיזי נדרש</SectionLabel>
        {physicalEquipment.length === 0 ? (
          // No equipment defined yet — guide the user to rooms settings
          <div className="text-sm text-gray-500 space-y-1">
            <p className="font-medium text-gray-700">עדיין לא הגדרת ציוד פיזי.</p>
            <a
              href="/rooms#equipment"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 underline hover:text-teal-800"
            >
              לחץ כאן כדי להגדיר!
            </a>
          </div>
        ) : (
          <TournamentEquipmentSelect
            assignments={form.resource_assignments ?? []}
            onChange={(assignments) => onChange({ resource_assignments: assignments })}
            physicalEquipment={physicalEquipment}
            allClasses={allClasses}
            allTournaments={allTournaments}
            currentTournamentId={currentTournamentId}
          />
        )}
      </div>

      {/* משתתפים — כמה רשומים עד כה (ניהול מלא בטאב "שחקנים") */}
      <div>
        <SectionLabel>משתתפים</SectionLabel>
        <p className="text-sm text-gray-600">
          {participantCount === 0
            ? "אין משתתפים רשומים עדיין."
            : `${participantCount} משתתפים רשומים`}
          <span className="mr-2 text-xs text-gray-400">(ניהול מלא בטאב ״שחקנים״)</span>
        </p>
      </div>

      {/* צבע בלוח הזמנים */}
      <Field label="צבע בלוח הזמנים">
        <div className="flex gap-2 flex-wrap">
          {CLASS_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ color: c })}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                form.color === c ? "border-gray-800 scale-110" : "border-transparent"
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}
