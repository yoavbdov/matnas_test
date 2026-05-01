"use client";
// עורך משבצות זמן לחוג — הוספה, עריכה, הסרה + אזהרת קונפליקטים
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import Field from "@/components/shared/Field";
import Btn from "@/components/shared/Btn";
import { DAYS, RECURRENCE_OPTIONS } from "@/lib/constants";
import { slotsConflict } from "@/lib/classHelpers";
import type { Room, ScheduleSlot, Class } from "@/lib/types";

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

interface Props {
  slots: ScheduleSlot[];
  rooms: Room[];
  // Other classes to detect conflicts with (pass [] if not needed)
  allClasses: Class[];
  currentClassId?: string;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onChange: (idx: number, patch: Partial<ScheduleSlot>) => void;
}

// Find which class (by name) conflicts with a given slot
function findConflict(slot: ScheduleSlot, allClasses: Class[], currentClassId?: string): string | null {
  for (const cls of allClasses) {
    if (cls.id === currentClassId) continue;
    for (const other of cls.slots ?? []) {
      if (slotsConflict(slot, other)) return cls.name;
    }
  }
  return null;
}

export default function ClassScheduleSlots({ slots, rooms, allClasses, currentClassId, onAdd, onRemove, onChange }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">מפגשים קבועים</p>
        <Btn variant="secondary" className="text-xs px-2 py-1" onClick={onAdd}>
          <Plus size={13} />הוסף מפגש
        </Btn>
      </div>

      {slots.length === 0 && (
        <p className="text-xs text-gray-400 mb-3">אין מפגשים — לחץ ״הוסף מפגש״ להוספה</p>
      )}

      <div className="space-y-3">
        {slots.map((slot, idx) => {
          const conflictWith = findConflict(slot, allClasses, currentClassId);
          return (
            <div key={slot.id} className={`border rounded-xl p-4 bg-gray-50 ${conflictWith ? "border-yellow-300" : "border-gray-100"}`}>
              {/* Conflict warning */}
              {conflictWith && (
                <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2 mb-3">
                  <AlertTriangle size={13} />
                  קונפליקט עם חוג: <strong>{conflictWith}</strong>
                </div>
              )}

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
          );
        })}
      </div>
    </div>
  );
}
