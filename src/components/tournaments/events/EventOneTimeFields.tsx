// שדות לאירוע חד-פעמי: תאריך, שעות, וחדר
import Field from "@/components/shared/Field";
import TimeSelect from "@/components/shared/TimeSelect";
import { validateTimeRange } from "@/lib/validation/validators";
import type { Room } from "@/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Props {
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  rooms: Room[];
  onChange: (patch: {
    date?: string;
    startTime?: string;
    endTime?: string;
    room?: string;
  }) => void;
}

export default function EventOneTimeFields({
  date,
  startTime,
  endTime,
  room,
  rooms,
  onChange,
}: Props) {
  const timeError = validateTimeRange(startTime, endTime);
  return (
    <div className="space-y-4" dir="rtl">
      {/* תאריך */}
      <Field label="תאריך האירוע" required>
        <Input
          type="date"
          className="w-full h-9 text-sm"
          value={date}
          onChange={(e) => onChange({ date: e.target.value })}
        />
      </Field>

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
