"use client";
import { Plus, Trash2 } from "lucide-react";
import Field from "@/components/shared/Field";
import Btn from "@/components/shared/Btn";
import TimeSelect from "@/components/shared/TimeSelect";
import { DAYS, RECURRENCE_OPTIONS } from "@/lib/config/constants";
import { validateTimeRange } from "@/lib/validation/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { Room, ScheduleSlot } from "@/types";

interface Props {
  slots: ScheduleSlot[];
  rooms: Room[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onChange: (idx: number, patch: Partial<ScheduleSlot>) => void;
}

export default function SlotEditor({
  slots,
  rooms,
  onAdd,
  onRemove,
  onChange,
}: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          מפגשים קבועים
        </p>
        <Btn variant="secondary" className="text-xs px-2 py-1" onClick={onAdd}>
          <Plus size={13} />
          הוסף מפגש
        </Btn>
      </div>

      {slots.length === 0 && (
        <p className="text-xs text-gray-400 mb-3">
          אין מפגשים קבועים — לחץ ״הוסף מפגש״ להוספה
        </p>
      )}

      <div className="space-y-3">
        {slots.map((slot, idx) => {
          const timeError = validateTimeRange(slot.start_time, slot.end_time);
          return (
            <div
              key={slot.id}
              className="border border-gray-100 rounded-xl p-4 bg-gray-50"
            >
              <div className="grid grid-cols-3 gap-3">
                <Field label="יום">
                  <Select
                    value={slot.day}
                    onValueChange={(v: string) => onChange(idx, { day: v })}
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="שעת התחלה">
                  <TimeSelect
                    value={slot.start_time}
                    onChange={(v) => onChange(idx, { start_time: v })}
                  />
                </Field>
                <Field label="שעת סיום">
                  <TimeSelect
                    value={slot.end_time}
                    onChange={(v) => onChange(idx, { end_time: v })}
                  />
                </Field>
                {/* שגיאת טווח זמן — מוצגת מיד כשיש בעיה */}
                {timeError && (
                  <p className="col-span-3 text-xs text-red-500 -mt-1">
                    {timeError}
                  </p>
                )}
                <Field label="חדר">
                  <Select
                    value={slot.room_id || "__none__"}
                    onValueChange={(v: string) =>
                      onChange(idx, { room_id: v === "__none__" ? "" : v })
                    }
                  >
                    <SelectTrigger className="w-full text-sm">
                      {/* render label explicitly — avoids showing Firestore doc ID */}
                      <SelectValue>
                        {slot.room_id
                          ? rooms.find((r) => r.id === slot.room_id)?.name ?? "חדר לא ידוע"
                          : "ללא חדר"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="תדירות">
                  <Select
                    value={slot.recurrence}
                    onValueChange={(v: string) =>
                      onChange(idx, { recurrence: v })
                    }
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="תאריך התחלה">
                  <Input
                    type="date"
                    value={slot.start_date}
                    onChange={(e) =>
                      onChange(idx, { start_date: e.target.value })
                    }
                  />
                </Field>
                {slot.recurrence === "חד פעמי" && (
                  <Field label="תאריך המפגש">
                    <Input
                      type="date"
                      value={slot.once_date ?? ""}
                      onChange={(e) =>
                        onChange(idx, { once_date: e.target.value })
                      }
                    />
                  </Field>
                )}
                <Field label="תאריך סיום (אופציונלי)">
                  <Input
                    type="date"
                    value={slot.end_date_override ?? ""}
                    onChange={(e) =>
                      onChange(idx, {
                        end_date_override: e.target.value || undefined,
                      })
                    }
                  />
                </Field>
              </div>
              <div className="flex justify-end mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(idx)}
                  className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                >
                  <Trash2 size={13} />
                  הסר מפגש
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
