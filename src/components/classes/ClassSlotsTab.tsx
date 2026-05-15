"use client";
/*
  ClassSlotsTab — manages schedule slots in the class form.
  Each slot shows labeled editable fields: חדר / יום / שעות / תדירות.
  Conflict warnings shown live before saving.
*/
import { Trash2, Plus, AlertTriangle } from "lucide-react";
import TimeSelect from "@/components/shared/TimeSelect";
import { RECURRENCE_OPTIONS } from "@/lib/constants";
import { slotsConflict } from "@/lib/classHelpers";
import { findStructuralTournamentConflict } from "@/lib/crossConflictHelpers";
import type { Room, ScheduleSlot, Class, Tournament } from "@/types";

const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

const inp =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 bg-white";

function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function dayFromDate(dateStr: string): string {
  if (!dateStr) return "ראשון";
  const [y, m, d] = dateStr.split("-").map(Number);
  return HEBREW_DAYS[new Date(y, m - 1, d).getDay()];
}

function blankSlot(): ScheduleSlot {
  const today = todayStr();
  return {
    id: crypto.randomUUID(),
    day: dayFromDate(today),
    start_time: "16:00",
    end_time: "17:00",
    room_id: "",
    recurrence: "שבועי",
    start_date: today,
  };
}

// Returns conflict description or null
function findConflict(
  slot: ScheduleSlot,
  teacherId: string,
  allClasses: Class[],
  allTournaments: Tournament[],
  rooms: Room[],
  currentClassId?: string,
): string | null {
  for (const cls of allClasses) {
    if (cls.id === currentClassId) continue;
    for (const other of cls.slots ?? []) {
      if (slotsConflict(slot, other)) return `התנגשות עם חוג: ${cls.name}`;
    }
  }
  const t = findStructuralTournamentConflict(
    slot,
    teacherId,
    allTournaments,
    rooms,
  );
  if (t) return `התנגשות עם תחרות: ${t.tournamentName}`;
  return null;
}

interface Props {
  slots: ScheduleSlot[];
  rooms: Room[];
  allClasses: Class[];
  allTournaments: Tournament[];
  teacherId: string;
  currentClassId?: string;
  onChange: (slots: ScheduleSlot[]) => void;
}

export default function ClassSlotsTab({
  slots,
  rooms,
  allClasses,
  allTournaments,
  teacherId,
  currentClassId,
  onChange,
}: Props) {
  // Patch a single slot by index
  function patchSlot(idx: number, patch: Partial<ScheduleSlot>) {
    onChange(slots.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function addSlot() {
    onChange([...slots, blankSlot()]);
  }

  function removeSlot(idx: number) {
    onChange(slots.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          מפגשים שבועיים
        </p>
        <button
          type="button"
          onClick={addSlot}
          className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          <Plus size={14} />
          הוסף מפגש
        </button>
      </div>

      {slots.length === 0 && (
        <p className="text-sm text-gray-400 py-4 text-center">
          אין מפגשים — לחץ ״הוסף מפגש״ להוספה
        </p>
      )}

      {/* Slot cards — one per session, with labeled editable fields */}
      <div className="space-y-4">
        {slots.map((slot, idx) => {
          const conflict = findConflict(
            slot,
            teacherId,
            allClasses,
            allTournaments,
            rooms,
            currentClassId,
          );
          return (
            <div
              key={slot.id ?? idx}
              className={`rounded-xl border p-4 bg-gray-50 space-y-3 ${
                conflict ? "border-amber-300" : "border-gray-100"
              }`}
            >
              {/* Conflict warning */}
              {conflict && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  <AlertTriangle size={13} className="shrink-0" />
                  {conflict}
                </div>
              )}

              {/* Fields grid: 2 columns */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {/* חדר */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    חדר
                  </label>
                  <select
                    className={inp}
                    value={slot.room_id}
                    onChange={(e) =>
                      patchSlot(idx, { room_id: e.target.value })
                    }
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* יום בשבוע */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    יום בשבוע
                  </label>
                  <select
                    className={inp}
                    value={slot.day}
                    onChange={(e) => patchSlot(idx, { day: e.target.value })}
                  >
                    {HEBREW_DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* שעות פעילות */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    שעות פעילות
                  </label>
                  <div className="flex items-center gap-2">
                    <TimeSelect
                      className={inp}
                      value={slot.start_time}
                      onChange={(v) => patchSlot(idx, { start_time: v })}
                    />
                    <span className="text-gray-400 text-xs">–</span>
                    <TimeSelect
                      className={inp}
                      value={slot.end_time}
                      onChange={(v) => patchSlot(idx, { end_time: v })}
                    />
                  </div>
                </div>

                {/* תדירות */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    תדירות
                  </label>
                  <select
                    className={inp}
                    value={slot.recurrence}
                    onChange={(e) =>
                      patchSlot(idx, { recurrence: e.target.value })
                    }
                  >
                    {RECURRENCE_OPTIONS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Remove button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => removeSlot(idx)}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600"
                >
                  <Trash2 size={13} />
                  הסר מפגש
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
