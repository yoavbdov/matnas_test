"use client";
// בחירת ציוד פיזי לתחרות — רשימת הוספה/הסרה עם כמות לכל פריט
// כשיש תאריך ושעה (מסיבוב): מציג כמה יחידות פנויות באותו זמן בדיוק
// כשאין תאריך (תחרות חוזרת ללא עיגון): מציג זמינות לפי יום השבוע
import { Plus, X, AlertTriangle } from "lucide-react";
import Btn from "@/components/shared/Btn";
import {
  calcUsedAtWindow,
  calcUsedOnDate,
  getConflictingNamesAtWindow,
  getConflictingNamesOnDate,
} from "@/lib/classHelpers";
import type { PhysicalEquipment, Class, Tournament, ResourceAssignment } from "@/lib/types";

const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

const inp = "w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

interface Props {
  assignments: ResourceAssignment[];
  onChange: (assignments: ResourceAssignment[]) => void;
  physicalEquipment: PhysicalEquipment[];
  // Exact date+time from the selected round (most precise)
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

  // When an exact date is provided we use it directly for date-specific availability.
  // This avoids false positives: a non-recurring tournament with rounds only on May 15–29
  // should NOT conflict when viewing the June 5 occurrence.
  const day = date ? HEBREW_DAYS[new Date(date).getDay()] : undefined;
  const knowsTime = !!(day && startTime && endTime);

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

          // How many units are already committed at this tournament's day+time
          let usedElsewhere = 0;
          let conflictingNames: string[] = [];

          if (eq && knowsTime) {
            if (date) {
              // Exact-date check: accurate per specific occurrence (e.g. June 5 vs May 15)
              usedElsewhere = calcUsedOnDate(
                eq.id, date, startTime!, endTime!,
                allClasses, allTournaments, currentTournamentId
              );
            } else {
              // Day-of-week check: structural fallback when no exact date is known
              usedElsewhere = calcUsedAtWindow(
                eq.id, day!, startTime!, endTime!,
                allClasses, undefined, allTournaments, currentTournamentId
              );
            }
          }

          const available = eq ? eq.quantity - usedElsewhere : 0;
          const shortage = a.quantity > available;

          if (shortage && eq && knowsTime) {
            if (date) {
              conflictingNames = getConflictingNamesOnDate(
                eq.id, date, startTime!, endTime!,
                allClasses, allTournaments, currentTournamentId
              );
            } else {
              conflictingNames = getConflictingNamesAtWindow(
                eq.id, day!, startTime!, endTime!,
                allClasses, undefined, allTournaments, currentTournamentId
              );
            }
          }

          return (
            <div
              key={idx}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border bg-gray-50 ${shortage ? "border-red-200" : "border-gray-100"}`}
            >
              {/* Equipment selector */}
              <div className="flex-1">
                <select
                  className={inp}
                  value={a.resource_id}
                  onChange={(e) => setField(idx, { resource_id: e.target.value, quantity: 1 })}
                >
                  {physicalEquipment.map((item) => {
                    const itemUsed = knowsTime
                      ? (date
                          ? calcUsedOnDate(item.id, date, startTime!, endTime!, allClasses, allTournaments, currentTournamentId)
                          : calcUsedAtWindow(item.id, day!, startTime!, endTime!, allClasses, undefined, allTournaments, currentTournamentId))
                      : 0;
                    const itemAvailable = item.quantity - itemUsed;
                    const label = knowsTime
                      ? `${item.name} (פנוי: ${itemAvailable})`
                      : `${item.name} (סה״כ: ${item.quantity})`;
                    return (
                      <option key={item.id} value={item.id} disabled={chosen.has(item.id) && item.id !== a.resource_id}>
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
                className="border border-gray-200 rounded-md px-2 py-1 text-sm w-16 focus:outline-none focus:border-teal-400"
                value={a.quantity}
                min={1}
                onChange={(e) => setField(idx, { quantity: Math.max(1, Number(e.target.value)) })}
              />

              {/* Availability hint */}
              {eq && (
                shortage ? (
                  <span className="flex items-center gap-1 text-red-500 font-medium text-xs w-16 shrink-0">
                    <AlertTriangle size={11} />חסר {a.quantity - available}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs w-16 shrink-0">
                    {knowsTime ? `פנוי: ${available}` : `סה״כ: ${eq.quantity}`}
                  </span>
                )
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
