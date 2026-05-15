// שדות לאירוע חוזר: ימים בשבוע, תאריך התחלה, תאריך סיום / תמידי, שעות, חדר
import Field from "@/components/shared/Field";
import TimeSelect from "@/components/shared/TimeSelect";
import { DAYS } from "@/lib/config/constants";
import { validateTimeRange } from "@/lib/validation/validators";
import type { Room } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Props {
  daysOfWeek: string[]; // ימים שנבחרו
  startDate: string; // YYYY-MM-DD — מתי האירוע מתחיל
  isPermanent: boolean; // ללא הגבלת זמן
  endDate: string; // YYYY-MM-DD — תאריך סיום (מבוטל כאשר isPermanent)
  startTime: string;
  endTime: string;
  room: string;
  rooms: Room[];
  onChange: (patch: {
    daysOfWeek?: string[];
    startDate?: string;
    isPermanent?: boolean;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    room?: string;
  }) => void;
}

export default function EventRecurringFields({
  daysOfWeek,
  startDate,
  isPermanent,
  endDate,
  startTime,
  endTime,
  room,
  rooms,
  onChange,
}: Props) {
  const timeError = validateTimeRange(startTime, endTime);

  function toggleDay(day: string) {
    const updated = daysOfWeek.includes(day)
      ? daysOfWeek.filter((d) => d !== day)
      : [...daysOfWeek, day];
    onChange({ daysOfWeek: updated });
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* ימים בשבוע */}
      <Field label="ימי המפגש בשבוע" required>
        <div className="flex flex-wrap gap-2 mt-1">
          {DAYS.map((day) => (
            <Button
              key={day}
              type="button"
              variant="outline"
              onClick={() => toggleDay(day)}
              className={`px-3 py-1 h-8 rounded-full text-sm border transition-colors ${
                daysOfWeek.includes(day)
                  ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
                  : "bg-white text-gray-700 border-gray-300 hover:border-teal-400"
              }`}
            >
              {day}
            </Button>
          ))}
        </div>
      </Field>

      {/* תאריך התחלה */}
      <Field label="תאריך התחלה" required>
        <Input
          type="date"
          className="w-full h-9 text-sm"
          value={startDate}
          onChange={(e) => onChange({ startDate: e.target.value })}
        />
      </Field>

      {/* תמידי + תאריך סיום */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox
            checked={isPermanent}
            onCheckedChange={(checked) => onChange({ isPermanent: !!checked })}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">
            אירוע תמידי (ללא תאריך סיום)
          </span>
        </label>

        <Field label="תאריך סיום">
          <Input
            type="date"
            className={`w-full h-9 text-sm transition-opacity ${
              isPermanent ? "opacity-50 cursor-not-allowed" : ""
            }`}
            value={endDate}
            disabled={isPermanent}
            onChange={(e) => onChange({ endDate: e.target.value })}
          />
          {isPermanent && (
            <p className="text-xs text-gray-400 mt-1">
              האירוע לא יסתיים אוטומטית
            </p>
          )}
        </Field>
      </div>

      {/* שעות */}
      <div className="flex gap-3">
        <Field label="שעת התחלה" required>
          <TimeSelect
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={startTime}
            onChange={(v) => onChange({ startTime: v })}
          />
        </Field>
        <Field label="שעת סיום" required>
          <TimeSelect
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={endTime}
            onChange={(v) => onChange({ endTime: v })}
          />
        </Field>
      </div>
      {timeError && <p className="text-xs text-red-500 -mt-2">{timeError}</p>}

      {/* חדר */}
      <Field label="חדר" required>
        <Select
          value={room || "__none__"}
          onValueChange={(v: string) => onChange({ room: v === "__none__" ? "" : v })}
        >
          <SelectTrigger className="w-full h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— ללא חדר —</SelectItem>
            {rooms.map((r) => (
              <SelectItem key={r.id} value={r.name}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
