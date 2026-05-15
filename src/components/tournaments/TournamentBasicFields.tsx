// שדות בסיסיים של תחרות: שם, שופט, תיאור, טווחי גיל/דירוג, ציוד, צבע
// כל שורה קומפקטית — טווחים מוצגים כ-min–max בשורה אחת
import { CLASS_COLORS } from "@/lib/config/constants";
import { LIMITS } from "@/lib/validation/validators";
import TournamentEquipmentSelect from "./TournamentEquipmentSelect";
import type { Tournament, Teacher, Class, PhysicalEquipment } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

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
  participantCount?: number;
  equipmentDate?: string;
  equipmentStartTime?: string;
  equipmentEndTime?: string;
}

// שורה קומפקטית: תווית + תוכן
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-xs text-gray-500 w-32 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
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
  equipmentDate,
  equipmentStartTime,
  equipmentEndTime,
}: Props) {
  return (
    <div className="space-y-1" dir="rtl">

      {/* שם התחרות */}
      <Row label="שם תחרות">
        <Input
          className="w-full h-8 text-sm"
          value={form.name}
          maxLength={LIMITS.NAME}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </Row>

      {/* שופט */}
      <Row label="שופט">
        <Select
          value={form.judge_id ?? "__none__"}
          onValueChange={(v: string) => onChange({ judge_id: v === "__none__" ? undefined : v })}
        >
          <SelectTrigger className="w-full h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— ללא שופט —</SelectItem>
            {allTeachers
              .filter((t) => t.status === "פעיל")
              .map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.first_name} {t.last_name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </Row>

      {/* תיאור */}
      <Row label="תיאור">
        <Textarea
          className="w-full resize-none text-sm"
          rows={2}
          value={form.description ?? ""}
          maxLength={LIMITS.DESCRIPTION}
          placeholder="תיאור קצר (אופציונלי)"
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </Row>

      {/* טווח מד כושר — min – max בשורה אחת */}
      <Row label="טווח מד כושר">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            className="w-20 h-8 text-sm"
            value={form.rating_min ?? ""}
            min={0}
            placeholder="מינ׳"
            onChange={(e) => onChange({ rating_min: e.target.value ? Number(e.target.value) : undefined })}
          />
          <span className="text-gray-400 text-sm">–</span>
          <Input
            type="number"
            className="w-20 h-8 text-sm"
            value={form.rating_max ?? ""}
            min={0}
            placeholder="מקס׳"
            onChange={(e) => onChange({ rating_max: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      </Row>

      {/* טווח גילאים — min – max בשורה אחת */}
      <Row label="טווח גילאים">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            className="w-20 h-8 text-sm"
            value={form.age_min ?? ""}
            min={0}
            placeholder="מינ׳"
            onChange={(e) => onChange({ age_min: e.target.value ? Number(e.target.value) : undefined })}
          />
          <span className="text-gray-400 text-sm">–</span>
          <Input
            type="number"
            className="w-20 h-8 text-sm"
            value={form.age_max ?? ""}
            min={0}
            placeholder="מקס׳"
            onChange={(e) => onChange({ age_max: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      </Row>

      {/* ציוד פיזי נדרש */}
      <div className="py-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">ציוד נדרש</p>
        {physicalEquipment.length === 0 ? (
          <div className="text-sm text-gray-500 space-y-1">
            <p className="font-medium text-gray-700">עדיין לא הגדרת ציוד פיזי.</p>
            <a href="/rooms#equipment" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline hover:text-teal-800">
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
            date={equipmentDate}
            startTime={equipmentStartTime}
            endTime={equipmentEndTime}
          />
        )}
      </div>

      {/* משתתפים — כמה רשומים עד כה */}
      <Row label="משתתפים">
        <span className="text-sm text-gray-600">
          {participantCount === 0 ? "אין משתתפים רשומים" : `${participantCount} משתתפים רשומים`}
          <span className="mr-2 text-xs text-gray-400">(ניהול בטאב ״שחקנים״)</span>
        </span>
      </Row>

      {/* צבע בלוח הזמנים */}
      <Row label="צבע זיהוי">
        <div className="flex gap-2 flex-wrap">
          {CLASS_COLORS.map((c) => (
            <Button
              key={c}
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange({ color: c })}
              className={`w-6 h-6 rounded-full border-2 transition-all p-0 ${
                form.color === c ? "border-gray-800 scale-110" : "border-transparent"
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
      </Row>

    </div>
  );
}
