// שדות לאירוע חוזר: ימים בשבוע, תאריך התחלה, תאריך סיום / תמידי, שעות, חדר
import Field from "@/components/shared/Field";
import TimeSelect from "@/components/shared/TimeSelect";
import { DAYS } from "@/lib/constants";
import type { Room } from "@/lib/types";

interface Props {
  daysOfWeek: string[];       // ימים שנבחרו
  startDate: string;          // YYYY-MM-DD — מתי האירוע מתחיל
  isPermanent: boolean;       // ללא הגבלת זמן
  endDate: string;            // YYYY-MM-DD — תאריך סיום (מבוטל כאשר isPermanent)
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
  daysOfWeek, startDate, isPermanent, endDate,
  startTime, endTime, room, rooms, onChange,
}: Props) {

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
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                daysOfWeek.includes(day)
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-teal-400"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </Field>

      {/* תאריך התחלה */}
      <Field label="תאריך התחלה" required>
        <input
          type="date"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={startDate}
          onChange={(e) => onChange({ startDate: e.target.value })}
        />
      </Field>

      {/* תמידי + תאריך סיום */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPermanent}
            onChange={(e) => onChange({ isPermanent: e.target.checked })}
            className="w-4 h-4 accent-teal-600"
          />
          <span className="text-sm font-medium text-gray-700">אירוע תמידי (ללא תאריך סיום)</span>
        </label>

        <Field label="תאריך סיום">
          <input
            type="date"
            className={`w-full border rounded-lg px-3 py-2 text-sm transition-opacity ${
              isPermanent
                ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50"
                : "border-gray-300"
            }`}
            value={endDate}
            disabled={isPermanent}
            onChange={(e) => onChange({ endDate: e.target.value })}
          />
          {isPermanent && (
            <p className="text-xs text-gray-400 mt-1">האירוע לא יסתיים אוטומטית</p>
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

      {/* חדר */}
      <Field label="חדר" required>
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={room}
          onChange={(e) => onChange({ room: e.target.value })}
        >
          <option value="">— בחר חדר —</option>
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
