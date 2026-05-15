// Modal for creating or editing a league group.
// Asks for category (בוגרים/נוער/נשים) and league type within that category.

import Modal from "@/components/shared/Modal";
import Field from "@/components/shared/Field";
import Btn from "@/components/shared/Btn";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LIMITS } from "@/lib/validation/validators";
import type { LeagueGroup, LeagueCategory, LeagueType } from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/config/config";

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
  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm({ ...form, [key]: value });
  }

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
        {/* Category */}
        <Field label="קטגוריה" required>
          <Select
            value={form.category ?? "__select__"}
            onValueChange={(v: string) => handleCategoryChange(v as LeagueCategory)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__select__" disabled>בחר קטגוריה...</SelectItem>
              <SelectItem value="בוגרים">בוגרים</SelectItem>
              <SelectItem value="נוער">נוער</SelectItem>
              <SelectItem value="נשים">נשים</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {/* League type — depends on selected category */}
        {form.category && (
          <Field label="דרגת ליגה" required>
            <Select
              value={form.leagueType ?? ""}
              onValueChange={(v: string) => set("leagueType", v as LeagueType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        {/* Name */}
        <Field label="שם הקבוצה" required>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={settings.MAX_STRING_LENGTH}
            placeholder="לדוגמה: קבוצה א' נוער"
          />
        </Field>

        {/* Description */}
        <Field label="תיאור" hint={`עד ${LIMITS.DESCRIPTION} תווים`}>
          <Input
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            maxLength={LIMITS.DESCRIPTION}
          />
        </Field>

        {/* Status */}
        <Field label="סטטוס">
          <Select
            value={form.status}
            onValueChange={(v: string) => set("status", v as "פעיל" | "לא פעיל")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="פעיל">פעיל</SelectItem>
              <SelectItem value="לא פעיל">לא פעיל</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <hr className="border-gray-100" />

        {/* Notes */}
        <Field label="הערות">
          <Textarea
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            maxLength={settings.MAX_NOTE_LENGTH}
            rows={3}
          />
        </Field>
      </div>
    </Modal>
  );
}
