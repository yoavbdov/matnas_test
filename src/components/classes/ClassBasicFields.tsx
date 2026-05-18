// שדות בסיסיים של חוג: שם, מדריך, קיבולת, תיאור, טווחי גיל/דירוג
// כל שורה קומפקטית — טווחים מוצגים כ-min–max בשורה אחת
import { CLASS_COLORS } from "@/lib/config/constants";
import { LIMITS } from "@/lib/validation/validators";
import type { Class, Teacher } from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/config/config";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormData = Omit<Class, "id">;

interface Props {
  form: FormData;
  teachers: Teacher[];
  settings: typeof DEFAULT_SETTINGS;
  onChange: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}

// שורה קומפקטית: תווית + תוכן
function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-xs text-gray-500 w-32 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function ClassBasicFields({
  form,
  teachers,
  settings,
  onChange,
}: Props) {
  return (
    <div className="space-y-1" dir="rtl">
      {/* שם החוג */}
      <Row label="שם חוג">
        <Input
          className="w-full"
          value={form.name}
          maxLength={settings.MAX_STRING_LENGTH}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </Row>

      {/* מדריך */}
      <Row label="מדריך">
        <Select
          value={form.teacher_id}
          onValueChange={(v: string) => onChange("teacher_id", v)}
        >
          <SelectTrigger className="w-full">
            {/* render label explicitly — avoids showing Firestore doc ID */}
            <SelectValue>
              {(() => {
                const t = teachers.find((t) => t.id === form.teacher_id);
                return t ? `${t.first_name} ${t.last_name}` : "בחר מדריך";
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {teachers
              .filter((t) => t.status === "פעיל")
              .map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.first_name} {t.last_name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </Row>

      {/* קיבולת מקסימלית */}
      <Row label="קיבולת מקסימלית">
        <Input
          type="number"
          className="w-24"
          value={form.capacity}
          min={1}
          max={settings.MAX_ROOM_CAPACITY}
          onChange={(e) =>
            onChange("capacity", Math.max(1, Number(e.target.value)))
          }
        />
      </Row>

      {/* תיאור */}
      <Row label="תיאור">
        <Textarea
          className="w-full resize-none"
          rows={2}
          value={form.description ?? ""}
          maxLength={LIMITS.DESCRIPTION}
          placeholder="תיאור קצר (אופציונלי)"
          onChange={(e) => onChange("description", e.target.value)}
        />
      </Row>

      {/* טווח מד כושר — min – max בשורה אחת */}
      <Row label="טווח מד כושר">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            className="w-20"
            value={form.rating_min ?? ""}
            min={0}
            max={settings.MAX_INT_INPUT}
            placeholder="מינ׳"
            onChange={(e) =>
              onChange(
                "rating_min",
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
          />
          <span className="text-gray-400 text-sm">–</span>
          <Input
            type="number"
            className="w-20"
            value={form.rating_max ?? ""}
            min={0}
            max={settings.MAX_INT_INPUT}
            placeholder="מקס׳"
            onChange={(e) =>
              onChange(
                "rating_max",
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
          />
        </div>
      </Row>

      {/* טווח גילאים — min – max בשורה אחת */}
      <Row label="טווח גילאים">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            className="w-20"
            value={form.age_min ?? ""}
            min={0}
            max={settings.MAX_AGE}
            placeholder="מינ׳"
            onChange={(e) =>
              onChange(
                "age_min",
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
          />
          <span className="text-gray-400 text-sm">–</span>
          <Input
            type="number"
            className="w-20"
            value={form.age_max ?? ""}
            min={0}
            max={settings.MAX_AGE}
            placeholder="מקס׳"
            onChange={(e) =>
              onChange(
                "age_max",
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
          />
        </div>
      </Row>

      {/* צבע זיהוי */}
      <Row label="צבע זיהוי">
        <div className="flex gap-2">
          {CLASS_COLORS.map((c) => (
            <Button
              key={c}
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange("color", c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform p-0 ${
                form.color === c
                  ? "border-gray-700 scale-110"
                  : "border-transparent"
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
      </Row>
    </div>
  );
}
