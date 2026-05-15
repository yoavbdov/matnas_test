"use client";
/*
  מודאל בדיקת זמינות חדרים.
  המשתמש מכניס תאריך + שעת התחלה/סיום,
  והמערכת מחזירה אילו חדרים פנויים ואילו תפוסים (חוג / תחרות / אירוע).
*/
import { useState, useMemo } from "react";
import { X, CalendarCheck } from "lucide-react";
import Btn from "@/components/shared/Btn";
import TimeSelect from "@/components/shared/TimeSelect";
import { checkRoomAvailability } from "@/lib/roomAvailability";
import type { Room, Class, Tournament, Event } from "@/types";

interface Props {
  rooms: Room[];
  classes: Class[];
  tournaments: Tournament[];
  events: Event[];
  onClose: () => void;
}

function todayStr(): string { return new Date().toISOString().slice(0, 10); }
function currentTime(): string {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}
function addHour(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${String(Math.min(h + 1, 23)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Badge color per conflict type
const TYPE_COLORS: Record<string, string> = {
  "חוג": "bg-blue-100 text-blue-700",
  "תחרות": "bg-amber-100 text-amber-700",
  "אירוע": "bg-purple-100 text-purple-700",
};

export default function RoomAvailabilityModal({ rooms, classes, tournaments, events, onClose }: Props) {
  const [date, setDate] = useState(todayStr());
  const [startTime, setStartTime] = useState(currentTime());
  const [endTime, setEndTime] = useState(addHour(currentTime()));
  const [searched, setSearched] = useState(false);

  const report = useMemo(() => {
    if (!searched || !date || !startTime || !endTime || startTime >= endTime) return null;
    return checkRoomAvailability(rooms, classes, tournaments, events, date, startTime, endTime);
  }, [searched, date, startTime, endTime, rooms, classes, tournaments, events]);

  const timeError = startTime && endTime && startTime >= endTime;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]" dir="rtl">

        {/* כותרת */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-lg">
            <CalendarCheck size={20} />
            בדיקת זמינות חדרים
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* טופס */}
        <div className="p-5 border-b space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">תאריך</label>
            <input type="date" value={date}
              onChange={(e) => { setDate(e.target.value); setSearched(false); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 w-48"
            />
          </div>

          <div className="flex gap-6 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">שעת התחלה</label>
              <TimeSelect value={startTime} onChange={(v) => { setStartTime(v); setSearched(false); }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">שעת סיום</label>
              <TimeSelect value={endTime} onChange={(v) => { setEndTime(v); setSearched(false); }} />
            </div>
          </div>
          {timeError && <p className="text-xs text-red-500">שעת הסיום חייבת להיות אחרי שעת ההתחלה</p>}

          <Btn onClick={() => setSearched(true)} disabled={!date || !startTime || !endTime || !!timeError}>
            <CalendarCheck size={15} />
            בדוק זמינות
          </Btn>
        </div>

        {/* תוצאות */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!report && !searched && (
            <p className="text-sm text-gray-400 text-center mt-4">הכנס תאריך וטווח שעות ולחץ "בדוק זמינות"</p>
          )}

          {report && (
            <>
              {/* פנויים */}
              <section>
                <h3 className="text-sm font-bold text-green-700 mb-2">פנויים ({report.free.length})</h3>
                {report.free.length === 0 ? (
                  <p className="text-xs text-gray-400">אין חדרים פנויים בטווח הזה</p>
                ) : (
                  <ul className="space-y-1">
                    {report.free.map((r) => (
                      <li key={r.id} className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                        {r.name}
                        {r.capacity && <span className="text-gray-400 text-xs mr-auto">קיבולת: {r.capacity}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* תפוסים */}
              <section>
                <h3 className="text-sm font-bold text-red-600 mb-2">תפוסים ({report.busy.length})</h3>
                {report.busy.length === 0 ? (
                  <p className="text-xs text-gray-400">אין חדרים תפוסים בטווח הזה</p>
                ) : (
                  <ul className="space-y-2">
                    {report.busy.map(({ room, conflicts }) => (
                      <li key={room.id} className="bg-red-50 rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                          <span className="font-medium">{room.name}</span>
                          {room.capacity && <span className="text-gray-400 text-xs">קיבולת: {room.capacity}</span>}
                        </div>
                        <ul className="mr-4 space-y-0.5">
                          {conflicts.map((c, i) => (
                            <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${TYPE_COLORS[c.type] ?? ""}`}>{c.type}</span>
                              {c.label} — {c.start_time}–{c.end_time}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
