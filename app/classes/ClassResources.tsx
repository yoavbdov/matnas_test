"use client";
// בחירת ציוד הנדרש לחוג — כמה יחידות מכל משאב, עם אזהרת חוסר
import { Plus, X } from "lucide-react";
import Field from "@/components/shared/Field";
import Btn from "@/components/shared/Btn";
import { calcResourceAvailability } from "@/lib/classHelpers";
import type { Resource, Class } from "@/lib/types";

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

// One row: which resource + how many units the class needs
interface Assignment {
  resource_id: string;
  quantity: number;
}

interface Props {
  assignments: Assignment[];
  resources: Resource[];
  allClasses: Class[];       // to check current usage
  currentClassId?: string;   // excluded from usage count
  onChange: (assignments: Assignment[]) => void;
}

export default function ClassResources({ assignments, resources, allClasses, currentClassId, onChange }: Props) {
  // IDs already chosen (to prevent duplicates in the dropdown)
  const chosen = new Set(assignments.map((a) => a.resource_id));

  function addRow() {
    const first = resources.find((r) => !chosen.has(r.id));
    if (!first) return;
    onChange([...assignments, { resource_id: first.id, quantity: 1 }]);
  }

  function remove(idx: number) {
    onChange(assignments.filter((_, i) => i !== idx));
  }

  function setField(idx: number, patch: Partial<Assignment>) {
    onChange(assignments.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ציוד נדרש</p>
        <Btn variant="secondary" className="text-xs px-2 py-1" onClick={addRow} disabled={resources.length === 0 || chosen.size >= resources.length}>
          <Plus size={13} />הוסף משאב
        </Btn>
      </div>

      {assignments.length === 0 && (
        <p className="text-xs text-gray-400">אין ציוד שהוגדר לחוג זה</p>
      )}

      <div className="space-y-2">
        {assignments.map((a, idx) => {
          const res = resources.find((r) => r.id === a.resource_id);
          // Peak simultaneous usage of this resource in other classes
          const usedElsewhere = res
            ? calcResourceAvailability(res, allClasses, currentClassId)
            : 0;
          const available = res ? res.quantity - usedElsewhere : 0;
          const shortage = a.quantity > available;

          return (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
              {/* Resource selector */}
              <div className="flex-1">
                <Field label="משאב">
                  <select className={inp} value={a.resource_id} onChange={(e) => setField(idx, { resource_id: e.target.value })}>
                    {resources.map((r) => (
                      <option key={r.id} value={r.id} disabled={chosen.has(r.id) && r.id !== a.resource_id}>
                        {r.name} ({r.type})
                      </option>
                    ))}
                  </select>
                </Field>
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
