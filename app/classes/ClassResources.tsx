"use client";
// בחירת ציוד הנדרש לחוג — כמה יחידות מכל משאב, עם אזהרת חוסר
import { Plus, X } from "lucide-react";
import Field from "@/components/shared/Field";
import Btn from "@/components/shared/Btn";
import { calcResourceAvailability, getResourceConflictingEvents } from "@/lib/classHelpers";
import type { PhysicalEquipment, Class, Tournament, ResourceAssignment } from "@/lib/types";

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

interface Props {
  assignments: ResourceAssignment[];
  physicalEquipment: PhysicalEquipment[];
  allClasses: Class[];
  allTournaments: Tournament[];  // included in usage count
  currentClassId?: string;       // excluded from usage count
  onChange: (assignments: ResourceAssignment[]) => void;
}

export default function ClassResources({ assignments, physicalEquipment, allClasses, allTournaments, currentClassId, onChange }: Props) {
  // IDs already chosen (to prevent duplicates in the dropdown)
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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ציוד נדרש</p>
        <Btn variant="secondary" className="text-xs px-2 py-1" onClick={addRow} disabled={physicalEquipment.length === 0 || chosen.size >= physicalEquipment.length}>
          <Plus size={13} />הוסף משאב
        </Btn>
      </div>

      {assignments.length === 0 && (
        <p className="text-xs text-gray-400">אין ציוד שהוגדר לחוג זה</p>
      )}

      <div className="space-y-2">
        {assignments.map((a, idx) => {
          const res = physicalEquipment.find((r) => r.id === a.resource_id);
          // Peak simultaneous usage of this resource in other classes
          const usedElsewhere = res
            ? calcResourceAvailability(res, allClasses, currentClassId, allTournaments)
            : 0;
          const available = res ? res.quantity - usedElsewhere : 0;
          const shortage = a.quantity > available;
          // Names of other events using this resource at the same time (shown when shortage)
          const conflictingNames = shortage && res
            ? getResourceConflictingEvents(res, allClasses, currentClassId, allTournaments)
            : [];

          return (
            <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border bg-gray-50 ${shortage ? "border-red-200" : "border-gray-100"}`}>
              {/* Resource selector */}
              <div className="flex-1">
                <Field label="משאב">
                  <select className={inp} value={a.resource_id} onChange={(e) => setField(idx, { resource_id: e.target.value })}>
                    {physicalEquipment.map((r) => (
                      <option key={r.id} value={r.id} disabled={chosen.has(r.id) && r.id !== a.resource_id}>
                        {r.name}
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

              {/* Quantity */}
              <div className="w-24">
                <Field label="כמות">
                  <input
                    type="number" className={inp} value={a.quantity} min={1}
                    onChange={(e) => setField(idx, { quantity: Math.max(1, Number(e.target.value)) })}
                  />
                </Field>
              </div>

              {/* Availability hint */}
              <div className="w-20 text-xs text-center pt-4">
                {res && (
                  <span className={shortage ? "text-red-500 font-medium" : "text-gray-400"}>
                    {shortage ? `חסר ${a.quantity - available}` : `פנוי: ${available}`}
                  </span>
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
