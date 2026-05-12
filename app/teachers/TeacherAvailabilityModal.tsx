"use client";
/*
  מודאל בדיקת זמינות מדריכים
  המשתמש מכניס תאריך + שעת התחלה/סיום,
  והמערכת מחזירה אילו מדריכים פנויים ואילו תפוסים.
*/
import { useState, useMemo } from "react";
import { X, CalendarCheck, Search } from "lucide-react";
import Btn from "@/components/shared/Btn";
import TimeSelect from "@/components/shared/TimeSelect";
import { checkTeacherAvailability } from "@/lib/teacherAvailability";
import { formatPhone } from "@/lib/utils";
import type { Teacher, Class } from "@/lib/types";

interface Props {
  teachers: Teacher[];
  classes: Class[];
  onClose: () => void;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentTimeStr(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function addHour(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${String(Math.min(h + 1, 23)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function TeacherAvailabilityModal({
  teachers,
  classes,
  onClose,
}: Props) {
  const [date, setDate] = useState(todayStr());
  const [startTime, setStartTime] = useState(currentTimeStr());
  const [endTime, setEndTime] = useState(addHour(currentTimeStr()));
  // Optional: filter results to a specific teacher name
  const [nameFilter, setNameFilter] = useState("");
  const [searched, setSearched] = useState(false);

  // Run availability check only after the user clicks "בדוק"
  const report = useMemo(() => {
    if (!searched) return null;
    if (!date || !startTime || !endTime || startTime >= endTime) return null;
    return checkTeacherAvailability(
      teachers,
      classes,
      date,
      startTime,
      endTime,
    );
  }, [searched, date, startTime, endTime, teachers, classes]);

  // Filter by name if the user typed something
  const filteredReport = useMemo(() => {
    if (!report) return null;
    const q = nameFilter.trim().toLowerCase();
    if (!q) return report;
    const match = (t: Teacher) =>
      `${t.first_name} ${t.last_name}`.toLowerCase().includes(q);
    return {
      free: report.free.filter(match),
      busy: report.busy.filter((b) => match(b.teacher)),
    };
  }, [report, nameFilter]);

  function handleCheck() {
    setSearched(true);
  }

  const timeError = startTime && endTime && startTime >= endTime;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* כותרת */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-lg">
            <CalendarCheck size={20} />
            בדיקת זמינות מדריכים
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* טופס קלט */}
        <div className="p-5 border-b space-y-4">
          {/* שורה 1: תאריך */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">תאריך</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSearched(false);
              }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 w-48"
            />
          </div>

          {/* שורה 2: טווח שעות — 24h format */}
          <div className="flex gap-6 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                שעת התחלה
              </label>
              <TimeSelect
                value={startTime}
                onChange={(v) => {
                  setStartTime(v);
                  setSearched(false);
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                שעת סיום
              </label>
              <TimeSelect
                value={endTime}
                onChange={(v) => {
                  setEndTime(v);
                  setSearched(false);
                }}
              />
            </div>
          </div>
          {timeError && (
            <p className="text-xs text-red-500">
              שעת הסיום חייבת להיות אחרי שעת ההתחלה
            </p>
          )}

          {/* שורה 3: סינון לפי שם (אופציונלי) */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              סנן לפי שם מדריך{" "}
              <span className="text-gray-400 font-normal">(אופציונלי)</span>
            </label>
            <div className="relative max-w-xs">
              <Search
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="שם פרטי / משפחה…"
                className="w-full border border-gray-200 rounded-lg pr-8 pl-3 py-2 text-sm focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>

          <Btn
            onClick={handleCheck}
            disabled={!date || !startTime || !endTime || !!timeError}
          >
            <CalendarCheck size={15} />
            בדוק זמינות
          </Btn>
        </div>

        {/* תוצאות */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!filteredReport && !searched && (
            <p className="text-sm text-gray-400 text-center mt-4">
              הכנס תאריך וטווח שעות ולחץ "בדוק זמינות"
            </p>
          )}

          {filteredReport && (
            <>
              {/* פנויים */}
              <section>
                <h3 className="text-sm font-bold text-green-700 mb-2">
                  פנויים ({filteredReport.free.length})
                </h3>
                {filteredReport.free.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    אין מדריכים פנויים בטווח הזה
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {filteredReport.free.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2 text-sm"
                      >
                        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                        {t.first_name} {t.last_name}
                        {t.phone && (
                          <span className="text-gray-400 text-xs mr-auto">
                            {formatPhone(t.phone)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* תפוסים */}
              <section>
                <h3 className="text-sm font-bold text-red-600 mb-2">
                  תפוסים ({filteredReport.busy.length})
                </h3>
                {filteredReport.busy.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    אין מדריכים תפוסים בטווח הזה
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {filteredReport.busy.map(
                      ({ teacher, conflictingClasses }) => (
                        <li
                          key={teacher.id}
                          className="bg-red-50 rounded-lg px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                            <span className="font-medium">
                              {teacher.first_name} {teacher.last_name}
                            </span>
                          </div>
                          {/* הצג את החוגים שגורמים לחסימה */}
                          <ul className="mt-1 mr-4 space-y-0.5">
                            {conflictingClasses.map((c, i) => (
                              <li key={i} className="text-xs text-gray-500">
                                {c.className} — {c.start_time}–{c.end_time}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ),
                    )}
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
