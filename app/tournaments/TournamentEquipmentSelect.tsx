"use client";
// בחירת ציוד פיזי לתחרות — רשימת הוספה/הסרה עם כמות לכל פריט
// מציג כמה יחידות פנויות בתאריך ובשעה של הסיבוב/תחרות
import { Plus, X, AlertTriangle } from "lucide-react";
import Btn from "@/components/shared/Btn";
import Field from "@/components/shared/Field";
import {
  calcResourceUsageOnDateTime,
  getResourceConflictingEventsOnDateTime,
  calcResourceAvailability,
  getResourceConflictingEvents,
} from "@/lib/classHelpers";
import type { PhysicalEquipment, Class, Tournament, ResourceAssignment } from "@/lib/types";

const inp = "w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

interface Props {
  assignments: ResourceAssignment[];
  onChange: (assignments: ResourceAssignment[]) => void;
  physicalEquipment: PhysicalEquipment[];
  // Date and time for availability hints
  date?: string;
  startTime?: string;
  endTime?: string;
  allClasses: Class[];
  allTournaments: Tournament[];
  currentTournamentId?: string;
}

export default function TournamentEquipmentSelect({
  assignments,
  onChange,
  physicalEquipment,
  date,
  startTime,
  endTime,
  allClasses,
  allTournaments,
  currentTournamentId,
}: Props) {
  const chosen = new Set(assignments.map((a) => a.resource_id));

  function addRow() {
    const first = physicalEquipment.find((eq) => !chosen.has(eq.id));
    if (!first) return;
    onChange([...assignments, { resource_id: first.id, quantity: 1 }]);
  }

  function remove(idx: number) {
    onChange(assignments.filter((_, i) => i !== idx));
  }

  function setField(idx: number, patch: Partial<ResourceAssignment>) {
    onChange(assignments.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Btn
          variant="secondary"
          className="text-xs px-2 py-1"
          onClick={addRow}
          disabled={physicalEquipment.length === 0 || chosen.size >= physicalEquipment.length}
        >
          <Plus size={13} />הוסף ציוד
        </Btn>
      </div>

      {assignments.length === 0 && (
        <p className="text-xs text-gray-400">אין ציוד שהוגדר לאירוע זה</p>
      )}

      <div className="space-y-2">
        {assignments.map((a, idx) => {
          const eq = physicalEquipment.find((r) => r.id === a.resource_id);

          // When date+time are known: use exact-date analysis. Otherwise: structural (day-of-week) fallback.
          // The structural fallback excludes the current tournament so it doesn't conflict with itself.
          const otherTournaments = allTournaments.filter((t) => t.id !== currentTournamentId);
          const inUse = eq
            ? (date && startTime && endTime)
              ? calcResourceUsageOnDateTime(eq, date, startTime, endTime, allClasses, allTournaments, currentTournamentId)
              : calcResourceAvailability(eq, allClasses, undefined, otherTournaments)
            : 0;
          const available = eq ? eq.quantity - inUse : 0;
          const shortage = a.quantity > available;
          // Names of conflicting events (shown when shortage)
          const conflictingNames = shortage && eq
            ? (date && startTime && endTime)
              ? getResourceConflictingEventsOnDateTime(eq, date, startTime, endTime, allClasses, allTournaments, currentTournamentId)
              : getResourceConflictingEvents(eq, allClasses, undefined, otherTournaments)
            : [];

          return (
            <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border bg-gray-50 ${shortage ? "border-red-200" : "border-gray-100"}`}>
              {/* Equipment selector */}
              <div className="flex-1">
                <Field label="ציוד">
                  <select
                    className={inp}
                    value={a.resource_id}
                    onChange={(e) => {
                      // When switching equipment, reset quantity to 1 to avoid exceeding new item's availability
                      setField(idx, { resource_id: e.target.value, quantity: 1 });
                    }}
                  >
                    {physicalEquipment.map((eq) => (
                      <option key={eq.id} value={eq.id} disabled={chosen.has(eq.id) && eq.id !== a.resource_id}>
                        {eq.name} (סה״כ: {eq.quantity})
                      </option>
                    ))}
                  </select>
                </Field>
                {/* Show which other events are using this resource */}
                {shortage && conflictingNames.length > 0 && (
                  <p className="mt-1 text-xs text-red-500">
                    ⚠ גם משתמש/ת: {conflictingNames.join(", ")}
                  </p>
                )}
              </div>

              {/* Quantity — capped to available units when date+time are known */}
              <div className="w-24">
                <Field label="כמות">
                  <input
                    type="number"
                    className={inp}
                    value={a.quantity}
                    min={1}
                    max={date && startTime && endTime ? available : (eq?.quantity ?? 999)}
                    onChange={(e) => {
                      const cap = date && startTime && endTime ? available : (eq?.quantity ?? 999);
                      setField(idx, { quantity: Math.min(cap, Math.max(1, Number(e.target.value))) });
                    }}
                  />
                </Field>
              </div>

              {/* Availability hint — shown always when shortage, otherwise only when date+time are known */}
              <div className="w-24 text-xs text-center pt-4 shrink-0">
                {eq && (
                  shortage ? (
                    <span className="flex items-center gap-1 text-red-500 font-medium">
                      <AlertTriangle size={12} />
                      חסר {a.quantity - available}
                    </span>
                  ) : (date && startTime && endTime) ? (
                    <span className="text-gray-400">פנוי: {available}</span>
                  ) : null
                )}
              </div>

              <button type="button" onClick={() => remove(idx)} className="mt-4 text-gray-300 hover:text-red-400">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
