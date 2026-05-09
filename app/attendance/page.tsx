"use client";
/*
  Attendance page — 3-panel layout.

  [ClassSelector] | [SessionList] | [AttendanceSheet]

  Left: pick a class.
  Middle: list of past sessions for that class — ✓ = recorded, ⚠ = missing.
  Right: the actual attendance form for the selected session.
*/
import { useState, useMemo } from "react";
import PageShell from "@/components/shared/PageShell";
import ClassSelector from "./ClassSelector";
import SessionList from "./SessionList";
import AttendanceSheet from "./AttendanceSheet";
import ExportCsvModal from "./ExportCsvModal";
import CsvExportBtn from "@/components/shared/CsvExportBtn";
import { useData } from "@/context/DataContext";
import { useCollection } from "@/firebase/hooks/useCollection";
import { getPastSessionDates } from "./attendanceHelpers";
import type { Attendance } from "@/lib/types";

// Today as YYYY-MM-DD (local time)
function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TODAY = todayString();

export default function AttendancePage() {
  const { classes, students, enrollments } = useData();

  // Load all attendance records in real-time
  const { data: allAttendance } = useCollection<Attendance>("attendance");

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // When user picks a class, auto-select the most recent missing session (or latest session)
  function handleSelectClass(classId: string) {
    setSelectedClassId(classId);
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return;

    const dates = getPastSessionDates(cls, TODAY);
    if (dates.length === 0) {
      setSelectedDate(null);
      return;
    }

    // Prefer the most recent session that is missing or incomplete (has לא הוזן entries)
    const classEnrolledCount = enrollments.filter(
      (e) => e.class_id === classId && e.status === "פעיל"
    ).length;
    const attendanceMap = new Map(
      allAttendance.filter((a) => a.class_id === classId).map((a) => [a.date, a])
    );
    const firstMissing = dates.find((d) => {
      const doc = attendanceMap.get(d);
      return !doc || doc.records.length < classEnrolledCount;
    });
    setSelectedDate(firstMissing ?? dates[0]);
  }

  // Past session dates for the selected class
  const sessionDates = useMemo(() => {
    const cls = classes.find((c) => c.id === selectedClassId);
    if (!cls) return [];
    return getPastSessionDates(cls, TODAY);
  }, [selectedClassId, classes]);

  // Map of date → Attendance doc for the selected class
  const attendanceByDate = useMemo<Map<string, Attendance>>(() => {
    if (!selectedClassId) return new Map();
    const map = new Map<string, Attendance>();
    for (const a of allAttendance) {
      if (a.class_id === selectedClassId) map.set(a.date, a);
    }
    return map;
  }, [allAttendance, selectedClassId]);

  const existingForDate = selectedDate ? (attendanceByDate.get(selectedDate) ?? null) : null;
  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <PageShell title="נוכחות">
      {/* CSV export modal — shown on demand */}
      {showExportModal && (
        <ExportCsvModal
          classes={classes}
          students={students}
          enrollments={enrollments}
          allAttendance={allAttendance}
          today={TODAY}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Export button — top right corner */}
      <div className="flex justify-start px-4 pb-2" dir="rtl">
        <CsvExportBtn onClick={() => setShowExportModal(true)} />
      </div>

      <div className="flex gap-0 h-[calc(100vh-8.5rem)] overflow-hidden" dir="rtl">

        {/* ── Panel 1: Class list ── */}
        <div className="w-52 shrink-0 border-l border-gray-200 pl-4 pr-2 overflow-y-auto">
          <ClassSelector
            classes={classes}
            allAttendance={allAttendance}
            enrollments={enrollments}
            selectedClassId={selectedClassId}
            today={TODAY}
            onSelect={handleSelectClass}
          />
        </div>

        {/* ── Panel 2: Session list ── */}
        <div className="w-56 shrink-0 border-l border-gray-200 px-4 overflow-y-auto">
          {selectedClassId ? (
            <SessionList
              dates={sessionDates}
              attendanceByDate={attendanceByDate}
              enrolledCount={enrollments.filter(
                (e) => e.class_id === selectedClassId && e.status === "פעיל"
              ).length}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-gray-400">בחר חוג כדי להתחיל</p>
            </div>
          )}
        </div>

        {/* ── Panel 3: Attendance sheet ── */}
        <div className="flex-1 px-6 overflow-y-auto">
          {selectedClass && selectedDate ? (
            <AttendanceSheet
              classId={selectedClass.id}
              date={selectedDate}
              students={students}
              enrollments={enrollments}
              existing={existingForDate}
              onSaved={() => {
                // After saving, move to the next incomplete session automatically.
                // We don't know the exact saved record count yet, so just skip the current date.
                const enrolledCount = enrollments.filter(
                  (e) => e.class_id === selectedClassId && e.status === "פעיל"
                ).length;
                const nextMissing = sessionDates.find((d) => {
                  if (d === selectedDate) return false;
                  const doc = attendanceByDate.get(d);
                  return !doc || doc.records.length < enrolledCount;
                });
                if (nextMissing) setSelectedDate(nextMissing);
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-gray-400">
                {selectedClass ? "בחר שיעור מהרשימה" : "בחר חוג ושיעור כדי לדווח נוכחות"}
              </p>
            </div>
          )}
        </div>

      </div>
    </PageShell>
  );
}
