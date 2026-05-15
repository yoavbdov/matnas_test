// Modal for creating or editing a league group.
// Asks for category (בוגרים/נוער/נשים) and league type within that category.

import Modal from "@/components/shared/Modal";
import Field from "@/components/shared/Field";
import Btn from "@/components/shared/Btn";
import { LIMITS } from "@/lib/validators";
import type { LeagueGroup, LeagueCategory, LeagueType } from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/config";

// Shared input style — matches all other form modals in the app
const inp =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

// League type options per category, ordered lowest → highest
const LEAGUE_TYPES: Record<LeagueCategory, LeagueType[]> = {
  בוגרים: ["ג", "ב", "א", "ארצית", "לאומית"],
  נוער: ["מחוזית", "ארצית", "לאומית"],
  נשים: ["ארצית", "עילית"],
};

type FormData = Omit<LeagueGroup, "id">;

interface Props {
  mode: "add" | "edit";
  form: FormData;
  setForm: (form: FormData) => void;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  settings: typeof DEFAULT_SETTINGS;
}

export default function LeagueGroupFormModal({
  mode,
  form,
  setForm,
  saving,
  onClose,
  onSave,
  settings,
}: Props) {
  // Shorthand to update a single field
  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm({ ...form, [key]: value });
  }

  // When category changes, reset leagueType to the first valid option for that category
  function handleCategoryChange(cat: LeagueCategory) {
    setForm({ ...form, category: cat, leagueType: LEAGUE_TYPES[cat][0] });
  }

  const availableTypes = form.category ? LEAGUE_TYPES[form.category] : [];

  return (
    <Modal
      title={mode === "add" ? "קבוצת ליגה חדשה" : "עריכת קבוצת ליגה"}
      onClose={onClose}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>ביטול</Btn>
          <Btn onClick={onSave} loading={saving}>שמור</Btn>
        </>
      }
    >
      <div className="space-y-4">
        {/* Category — בוגרים / נוער / נשים */}
        <Field label="קטגוריה" required>
          <select
            value={form.category ?? ""}
            onChange={(e) => handleCategoryChange(e.target.value as LeagueCategory)}
            className={inp}
          >
            <option value="" disabled>בחר קטגוריה...</option>
            <option value="בוגרים">בוגרים</option>
            <option value="נוער">נוער</option>
            <option value="נשים">נשים</option>
          </select>
        </Field>

        {/* League type — depends on selected category */}
        {form.category && (
          <Field label="דרגת ליגה" required>
            <select
              value={form.leagueType ?? ""}
              onChange={(e) => set("leagueType", e.target.value as LeagueType)}
              className={inp}
            >
              {availableTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
        )}

        {/* Name — required */}
        <Field label="שם הקבוצה" required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={settings.MAX_STRING_LENGTH}
            className={inp}
            placeholder="לדוגמה: קבוצה א' נוער"
          />
        </Field>

        {/* Description */}
        <Field label="תיאור" hint={`עד ${LIMITS.DESCRIPTION} תווים`}>
          <input
            type="text"
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            maxLength={LIMITS.DESCRIPTION}
            className={inp}
          />
        </Field>

        {/* Status */}
        <Field label="סטטוס">
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value as "פעיל" | "לא פעיל")}
            className={inp}
          >
            <option value="פעיל">פעיל</option>
            <option value="לא פעיל">לא פעיל</option>
          </select>
        </Field>

        <hr className="border-gray-100" />

        {/* Notes */}
        <Field label="הערות">
          <textarea
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            maxLength={settings.MAX_NOTE_LENGTH}
            rows={3}
            className={inp + " resize-none"}
          />
        </Field>
      </div>
    </Modal>
  );
}
