"use client";
/*
  מודאל בדיקת זמינות שחקנים.
  המשתמש מכניס תאריך + שעת התחלה/סיום,
  והמערכת מחזירה אילו שחקנים פנויים ואילו תפוסים (חוג / תחרות).
*/
import { useState, useMemo } from "react";
import { X, CalendarCheck, Search } from "lucide-react";
import Btn from "@/components/shared/Btn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TimeSelect from "@/components/shared/TimeSelect";
import { checkStudentAvailability } from "@/lib/availability/studentAvailability";
import type { Student, Class, Tournament, Enrollment } from "@/types";

interface Props {
  students: Student[];
  enrollments: Enrollment[];
  classes: Class[];
  tournaments: Tournament[];
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
};

export default function StudentAvailabilityModal({ students, enrollments, classes, tournaments, onClose }: Props) {
  const [date, setDate] = useState(todayStr());
  const [startTime, setStartTime] = useState(currentTime());
  const [endTime, setEndTime] = useState(addHour(currentTime()));
  const [nameFilter, setNameFilter] = useState("");
  const [searched, setSearched] = useState(false);

  const report = useMemo(() => {
    if (!searched || !date || !startTime || !endTime || startTime >= endTime) return null;
    return checkStudentAvailability(students, enrollments, classes, tournaments, date, startTime, endTime);
  }, [searched, date, startTime, endTime, students, enrollments, classes, tournaments]);

  const filteredReport = useMemo(() => {
    if (!report) return null;
    const q = nameFilter.trim().toLowerCase();
    if (!q) return report;
    const match = (s: Student) => `${s.first_name} ${s.last_name}`.toLowerCase().includes(q);
    return {
      free: report.free.filter(match),
      busy: report.busy.filter((b) => match(b.student)),
    };
  }, [report, nameFilter]);

  const timeError = startTime && endTime && startTime >= endTime;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]" dir="rtl">

        {/* כותרת */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-lg">
            <CalendarCheck size={20} />
            בדיקת זמינות שחקנים
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></Button>
        </div>

        {/* טופס */}
        <div className="p-5 border-b space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">תאריך</label>
            <Input type="date" value={date}
              onChange={(e) => { setDate(e.target.value); setSearched(false); }}
              className="w-48"
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

          {/* סינון לפי שם */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              סנן לפי שם שחקן <span className="text-gray-400 font-normal">(אופציונלי)</span>
            </label>
            <div className="relative max-w-xs">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={nameFilter} onChange={(e) => setNameFilter(e.target.value)}
                placeholder="שם פרטי / משפחה…"
                className="w-full pr-8 pl-3"
              />
            </div>
          </div>

          <Btn onClick={() => setSearched(true)} disabled={!date || !startTime || !endTime || !!timeError}>
            <CalendarCheck size={15} />
            בדוק זמינות
          </Btn>
        </div>

        {/* תוצאות */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!filteredReport && !searched && (
            <p className="text-sm text-gray-400 text-center mt-4">הכנס תאריך וטווח שעות ולחץ "בדוק זמינות"</p>
          )}

          {filteredReport && (
            <>
              {/* פנויים */}
              <section>
                <h3 className="text-sm font-bold text-green-700 mb-2">פנויים ({filteredReport.free.length})</h3>
                {filteredReport.free.length === 0 ? (
                  <p className="text-xs text-gray-400">אין שחקנים פנויים בטווח הזה</p>
                ) : (
                  <ul className="space-y-1">
                    {filteredReport.free.map((s) => (
                      <li key={s.id} className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                        {s.first_name} {s.last_name}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* תפוסים */}
              <section>
                <h3 className="text-sm font-bold text-red-600 mb-2">תפוסים ({filteredReport.busy.length})</h3>
                {filteredReport.busy.length === 0 ? (
                  <p className="text-xs text-gray-400">אין שחקנים תפוסים בטווח הזה</p>
                ) : (
                  <ul className="space-y-2">
                    {filteredReport.busy.map(({ student, conflicts }) => (
                      <li key={student.id} className="bg-red-50 rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                          <span className="font-medium">{student.first_name} {student.last_name}</span>
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
