"use client";
import { Plus, Trash2 } from "lucide-react";
import Field from "@/components/shared/Field";
import Btn from "@/components/shared/Btn";
import { DAYS, RECURRENCE_OPTIONS } from "@/lib/constants";
import type { Room, ScheduleSlot } from "@/lib/types";

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

interface Props {
  slots: ScheduleSlot[];
  rooms: Room[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onChange: (idx: number, patch: Partial<ScheduleSlot>) => void;
}

export default function SlotEditor({ slots, rooms, onAdd, onRemove, onChange }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">מפגשים קבועים</p>
        <Btn variant="secondary" className="text-xs px-2 py-1" onClick={onAdd}><Plus size={13} />הוסף מפגש</Btn>
      </div>

      {slots.length === 0 && (
        <p className="text-xs text-gray-400 mb-3">אין מפגשים קבועים — לחץ ״הוסף מפגש״ להוספה</p>
      )}

      <div className="space-y-3">
        {slots.map((slot, idx) => (
          <div key={slot.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
            <div className="grid grid-cols-3 gap-3">
              <Field label="יום">
                <select className={inp} value={slot.day} onChange={(e) => onChange(idx, { day: e.target.value })}>
                  {DAYS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="שעת התחלה">
                <input type="time" className={inp} value={slot.start_time} onChange={(e) => onChange(idx, { start_time: e.target.value })} />
              </Field>
              <Field label="שעת סיום">
                <input type="time" className={inp} value={slot.end_time} onChange={(e) => onChange(idx, { end_time: e.target.value })} />
              </Field>
              <Field label="חדר">
                <select className={inp} value={slot.room_id} onChange={(e) => onChange(idx, { room_id: e.target.value })}>
                  <option value="">— בחר חדר —</option>
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </Field>
              <Field label="תדירות">
                <select className={inp} value={slot.recurrence} onChange={(e) => onChange(idx, { recurrence: e.target.value })}>
                  {RECURRENCE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="תאריך התחלה">
                <input type="date" className={inp} value={slot.start_date} onChange={(e) => onChange(idx, { start_date: e.target.value })} />
              </Field>
              {slot.recurrence === "חד פעמי" && (
                <Field label="תאריך המפגש">
                  <input type="date" className={inp} value={slot.once_date ?? ""} onChange={(e) => onChange(idx, { once_date: e.target.value })} />
                </Field>
              )}
              <Field label="תאריך סיום (אופציונלי)">
                <input type="date" className={inp} value={slot.end_date_override ?? ""} onChange={(e) => onChange(idx, { end_date_override: e.target.value || undefined })} />
              </Field>
            </div>
            <div className="flex justify-end mt-2">
              <button type="button" onClick={() => onRemove(idx)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                <Trash2 size={13} />הסר מפגש
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
