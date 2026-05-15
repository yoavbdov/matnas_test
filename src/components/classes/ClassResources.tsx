"use client";
// בחירת ציוד הנדרש לחוג — כמה יחידות מכל משאב, עם חישוב זמינות לפי שעות הסלוטים של החוג
import { Plus, X } from "lucide-react";
import Btn from "@/components/shared/Btn";
import {
  calcUsedDuringClassSlots,
  getConflictingNamesDuringClassSlots,
} from "@/lib/classHelpers";
import type {
  PhysicalEquipment,
  Class,
  Tournament,
  ResourceAssignment,
  ScheduleSlot,
} from "@/lib/types";

const inp =
  "w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

interface Props {
  assignments: ResourceAssignment[];
  physicalEquipment: PhysicalEquipment[];
  allClasses: Class[];
  allTournaments: Tournament[];
  currentClassId?: string; // excluded from usage count
  currentClassSlots: ScheduleSlot[]; // used to compute availability at the right time
  onChange: (assignments: ResourceAssignment[]) => void;
}

export default function ClassResources({
  assignments,
  physicalEquipment,
  allClasses,
  allTournaments,
  currentClassId,
  currentClassSlots,
  onChange,
}: Props) {
  const chosen = new Set(assignments.map((a) => a.resource_id));

  function addRow() {
    const first = physicalEquipment.find((r) => !chosen.has(r.id));
    if (!first) return;
    onChange([...assignments, { resource_id: first.id, quantity: 1 }]);
  }

  function remove(idx: number) {
    onChange(assignments.filter((_, i) => i !== idx));
  }

  function setField(idx: number, patch: Partial<ResourceAssignment>) {
    onChange(assignments.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  }

  // If the class has no slots yet, we can't know the relevant time — show total quantity
  const hasSlots = currentClassSlots.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          ציוד נדרש
        </p>
        <Btn
          variant="secondary"
          className="text-xs px-2 py-1"
          onClick={addRow}
          disabled={
            physicalEquipment.length === 0 ||
            chosen.size >= physicalEquipment.length
          }
        >
          <Plus size={13} />
          הוסף ציוד
        </Btn>
      </div>

      {!hasSlots && assignments.length > 0 && (
        <p className="text-xs text-amber-500 mb-2">
          הגדר שעות חוג כדי לחשב זמינות מדויקת
        </p>
      )}

      {assignments.length === 0 && (
        <p className="text-xs text-gray-400">אין ציוד שהוגדר לחוג זה</p>
      )}

      <div className="space-y-2">
        {assignments.map((a, idx) => {
          const res = physicalEquipment.find((r) => r.id === a.resource_id);

          // How many units are already committed by other events during this class's slots
          const usedElsewhere =
            res && hasSlots
              ? calcUsedDuringClassSlots(
                  res.id,
                  currentClassSlots,
                  allClasses,
                  currentClassId,
                  allTournaments,
                )
              : 0;
          const available = res ? res.quantity - usedElsewhere : 0;
          const shortage = a.quantity > available;

          // Names of conflicting events (shown when there is a shortage)
          const conflictingNames =
            shortage && res && hasSlots
              ? getConflictingNamesDuringClassSlots(
                  res.id,
                  currentClassSlots,
                  allClasses,
                  currentClassId,
                  allTournaments,
                )
              : [];

          return (
            <div
              key={idx}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border bg-gray-50 ${shortage ? "border-red-200" : "border-gray-100"}`}
            >
              {/* Resource selector */}
              <div className="flex-1">
                <select
                  className={inp}
                  value={a.resource_id}
                  onChange={(e) => setField(idx, { resource_id: e.target.value })}
                >
                  {physicalEquipment.map((r) => {
                    const rUsed = hasSlots
                      ? calcUsedDuringClassSlots(r.id, currentClassSlots, allClasses, currentClassId, allTournaments)
                      : 0;
                    const rAvailable = r.quantity - rUsed;
                    const label = hasSlots
                      ? `${r.name} (פנוי: ${rAvailable})`
                      : `${r.name} (סה״כ: ${r.quantity})`;
                    return (
                      <option key={r.id} value={r.id} disabled={chosen.has(r.id) && r.id !== a.resource_id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                {/* Show which other events are using this resource at the same time */}
                {shortage && conflictingNames.length > 0 && (
                  <p className="mt-0.5 text-xs text-red-500">
                    ⚠ גם משתמש/ת: {conflictingNames.join(", ")}
                  </p>
                )}
              </div>

              {/* Quantity */}
              <input
                type="number"
                className={`border border-gray-200 rounded-md px-2 py-1 text-sm w-16 focus:outline-none focus:border-teal-400`}
                value={a.quantity}
                min={1}
                onChange={(e) => setField(idx, { quantity: Math.max(1, Number(e.target.value)) })}
              />

              {/* Availability hint */}
              {res && (
                <span className={`text-xs w-16 text-center ${shortage ? "text-red-500 font-medium" : "text-gray-400"}`}>
                  {hasSlots
                    ? shortage ? `חסר ${a.quantity - available}` : `פנוי: ${available}`
                    : `סה״כ: ${res.quantity}`}
                </span>
              )}

              <button type="button" onClick={() => remove(idx)} className="text-gray-300 hover:text-red-400">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
