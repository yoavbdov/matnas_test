// שדות לאירוע חד-פעמי: תאריך, שעות, וחדר
import Field from "@/components/shared/Field";
import TimeSelect from "@/components/shared/TimeSelect";
import { validateTimeRange } from "@/lib/validators";
import type { Room } from "@/types";

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
        <input
          type="date"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={room}
          onChange={(e) => onChange({ room: e.target.value })}
        >
          {rooms.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
