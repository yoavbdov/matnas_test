"use client";
// בדיקת זמינות ציוד — בוחר משאב + טווח תאריכים ומראה אם יש מספיק יחידות
import { useState, useMemo } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import Field from "@/components/shared/Field";
import { calcResourceAvailability } from "@/lib/classHelpers";
import { slotOccursOnDate } from "@/lib/scheduleHelpers";
import type { Resource, Class } from "@/lib/types";

interface Props {
  resources: Resource[];
  classes: Class[];
  onClose: () => void;
}

// Return all classes that use a resource during ANY day in the date range
function classesUsingResourceInRange(
  resource: Resource,
  classes: Class[],
  startDate: string,
  endDate: string
): Class[] {
  if (!startDate || !endDate) return [];

  return classes.filter((cls) =>
    (cls.resource_ids ?? []).includes(resource.id) &&
    (cls.slots ?? []).some((slot) => {
      // Check each day in the range
      const start = new Date(startDate);
      const end = new Date(endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (slotOccursOnDate(slot, d.toISOString().slice(0, 10))) return true;
      }
      return false;
    })
  );
}

export default function AvailabilityCheckerModal({ resources, classes, onClose }: Props) {
  const [resourceId, setResourceId] = useState(resources[0]?.id ?? "");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const resource = resources.find((r) => r.id === resourceId);

  // Classes that use this resource in the date range
  const usingClasses = useMemo(() =>
    resource ? classesUsingResourceInRange(resource, classes, startDate, endDate) : [],
    [resource, classes, startDate, endDate]
  );

  // Peak simultaneous usage
  const peakUsage = useMemo(() =>
    resource ? calcResourceAvailability(resource, usingClasses) : 0,
    [resource, usingClasses]
  );

  const available = resource ? resource.quantity : 0;
  const shortage = peakUsage > available;
  const deficit = peakUsage - available;

  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">בדיקת זמינות ציוד</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {resources.length === 0 ? (
            <p className="text-sm text-gray-400 text-center">אין ציוד מוגדר במערכת</p>
          ) : (
            <>
              <Field label="משאב">
                <select className={inp} value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.type}) — {r.quantity} יחידות</option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="מתאריך">
                  <input type="date" className={inp} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Field>
                <Field label="עד תאריך">
                  <input type="date" className={inp} value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
                </Field>
              </div>

              {/* Result */}
              {resource && (
                <div className={`rounded-xl p-4 ${shortage ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {shortage
                      ? <AlertCircle size={18} className="text-red-500" />
                      : <CheckCircle size={18} className="text-green-500" />}
                    <span className={`font-semibold text-sm ${shortage ? "text-red-700" : "text-green-700"}`}>
                      {shortage ? `חסרות ${deficit} יחידות` : "ציוד זמין"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    זמין: {available} יחידות · שיא שימוש בו-זמני: {peakUsage} יחידות
                  </p>

                  {/* Classes using this resource in range */}
                  {usingClasses.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">חוגים שמשתמשים בציוד זה בתקופה:</p>
                      {usingClasses.map((cls) => (
                        <p key={cls.id} className="text-xs text-gray-700">• {cls.name}</p>
                      ))}
                    </div>
                  )}
                  {usingClasses.length === 0 && (
                    <p className="text-xs text-gray-400">אין חוגים שמשתמשים בציוד זה בתקופה הנבחרת</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">סגור</button>
        </div>
      </div>
    </div>
  );
}
