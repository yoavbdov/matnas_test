"use client";
// בדיקת זמינות ציוד פיזי — בוחר ציוד, יום, וטווח שעות ומציג כמה יחידות זמינות
import { useState, useMemo } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import Field from "@/components/shared/Field";
import { calcResourceUsageOnDateTime } from "@/lib/classHelpers";
import type { PhysicalEquipment, Class, Tournament } from "@/lib/types";

interface Props {
  physicalEquipment: PhysicalEquipment[];
  classes: Class[];
  tournaments: Tournament[];
  onClose: () => void;
}

// Collect class names that use a resource and overlap the given time window
function classNamesUsingResource(
  resourceId: string,
  classes: Class[],
  hebrewDay: string,
  startTime: string,
  endTime: string
): string[] {
  const result: string[] = [];
  for (const cls of classes) {
    const usesResource = (cls.resource_assignments ?? []).some(
      (a) => a.resource_id === resourceId && a.quantity > 0
    );
    if (!usesResource) continue;
    const slotOverlaps = (cls.slots ?? []).some((slot) => {
      if (slot.day !== hebrewDay) return false;
      const [sS, sE] = [slot.start_time, slot.end_time];
      return parseInt(startTime) < parseInt(sE) && parseInt(sS) < parseInt(endTime);
    });
    if (slotOverlaps) result.push(cls.name);
  }
  return result;
}

// Collect tournament names that use a resource and overlap the given date+time
function tournamentNamesUsingResource(
  resourceId: string,
  tournaments: Tournament[],
  date: string,
  startTime: string,
  endTime: string
): string[] {
  const result: string[] = [];
  function overlaps(s1: string, e1: string, s2: string, e2: string) {
    const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    return toMin(s1) < toMin(e2) && toMin(s2) < toMin(e1);
  }
  for (const t of tournaments) {
    if (t.is_recurring) {
      const qty = (t.recurring_resource_assignments ?? []).find((a) => a.resource_id === resourceId)?.quantity ?? 0;
      if (qty > 0 && t.recurring_date === date &&
          overlaps(startTime, endTime, t.recurring_start_time ?? "", t.recurring_end_time ?? "")) {
        result.push(t.name);
      }
    } else {
      for (const r of t.rounds ?? []) {
        const qty = (r.resource_assignments ?? []).find((a) => a.resource_id === resourceId)?.quantity ?? 0;
        if (qty > 0 && r.date === date && overlaps(startTime, endTime, r.start_time, r.end_time)) {
          result.push(t.name);
          break;
        }
      }
    }
  }
  return result;
}

// Hebrew day name from a date string (YYYY-MM-DD)
const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
function hebrewDayFromDate(dateStr: string): string {
  return HEBREW_DAYS[new Date(dateStr).getDay()];
}

export default function AvailabilityCheckerModal({ physicalEquipment, classes, tournaments, onClose }: Props) {
  const [equipmentId, setEquipmentId] = useState(physicalEquipment[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("18:00");

  const equipment = physicalEquipment.find((e) => e.id === equipmentId);
  const hebrewDay = date ? hebrewDayFromDate(date) : "";

  // Total units in use during selected window
  const unitsInUse = useMemo(() => {
    if (!equipment || !date) return 0;
    return calcResourceUsageOnDateTime(equipment, date, startTime, endTime, classes, tournaments);
  }, [equipment, date, startTime, endTime, classes, tournaments]);

  const total = equipment?.quantity ?? 0;
  const available = Math.max(0, total - unitsInUse);
  const shortage = unitsInUse > total;

  // Lists of who is using the equipment
  const usingClasses = useMemo(() =>
    equipment ? classNamesUsingResource(equipment.id, classes, hebrewDay, startTime, endTime) : [],
    [equipment, classes, hebrewDay, startTime, endTime]
  );
  const usingTournaments = useMemo(() =>
    equipment ? tournamentNamesUsingResource(equipment.id, tournaments, date, startTime, endTime) : [],
    [equipment, tournaments, date, startTime, endTime]
  );

  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">בדיקת זמינות ציוד</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {physicalEquipment.length === 0 ? (
            <p className="text-sm text-gray-400 text-center">אין ציוד מוגדר במערכת</p>
          ) : (
            <>
              {/* Equipment selector */}
              <Field label="ציוד לבדיקה">
                <select className={inp} value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)}>
                  {physicalEquipment.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} — {e.quantity} יחידות</option>
                  ))}
                </select>
              </Field>

              {/* Date selector */}
              <Field label="תאריך">
                <input type="date" className={inp} value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>

              {/* Time range */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="משעה">
                  <input type="time" className={inp} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </Field>
                <Field label="עד שעה">
                  <input type="time" className={inp} value={endTime} min={startTime} onChange={(e) => setEndTime(e.target.value)} />
                </Field>
              </div>

              {/* Result card */}
              {equipment && (
                <div className={`rounded-xl p-4 ${shortage ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
                  {/* Status line */}
                  <div className="flex items-center gap-2 mb-2">
                    {shortage
                      ? <AlertCircle size={18} className="text-red-500" />
                      : <CheckCircle size={18} className="text-green-500" />}
                    <span className={`font-semibold text-sm ${shortage ? "text-red-700" : "text-green-700"}`}>
                      {shortage
                        ? `חסרות ${unitsInUse - total} יחידות`
                        : `${available} מתוך ${total} יחידות זמינות`}
                    </span>
                  </div>

                  {/* Numbers */}
                  <p className="text-xs text-gray-600 mb-2">
                    בשימוש: {unitsInUse} יחידות · במלאי: {total} יחידות
                  </p>

                  {/* Classes using this resource */}
                  {usingClasses.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">חוגים שמשתמשים בציוד זה:</p>
                      {usingClasses.map((name, i) => (
                        <p key={i} className="text-xs text-gray-700">• {name}</p>
                      ))}
                    </div>
                  )}

                  {/* Tournaments using this resource */}
                  {usingTournaments.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">תחרויות שמשתמשות בציוד זה:</p>
                      {usingTournaments.map((name, i) => (
                        <p key={i} className="text-xs text-gray-700">• {name}</p>
                      ))}
                    </div>
                  )}

                  {usingClasses.length === 0 && usingTournaments.length === 0 && (
                    <p className="text-xs text-gray-400">אין שימוש בציוד זה בשעות הנבחרות</p>
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
