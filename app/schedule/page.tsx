"use client";
import { useState, useMemo } from "react";
import PageShell from "@/components/shared/PageShell";
import CalendarGrid from "./CalendarGrid";
import MiniCalendar from "./MiniCalendar";
import ViewExistingClassDetailModal from "@/app/classes/ViewExistingClassDetailModal";
import ClassFormModal from "@/app/classes/ClassFormModal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { updateDocument } from "@/firebase/firestore";
import { getSlotsForDates } from "@/lib/scheduleHelpers";
import { getConflictingClassIds } from "@/lib/classHelpers";
import type { Class } from "@/lib/types";
import type { DayData } from "./calendarTypes";

// --- helpers ---

// Use local date parts — toISOString() returns UTC and shifts the date in UTC+2/3 (Israel)
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Returns the Set of date strings for the whole week that contains `date` (Sun–Sat) */
function weekOf(date: Date): Set<string> {
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - date.getDay()); // go to Sunday
  sunday.setHours(0, 0, 0, 0);
  const set = new Set<string>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    set.add(toDateStr(d));
  }
  return set;
}

// --- page ---

export default function SchedulePage() {
  const { classes, teachers, rooms, physicalEquipment, students, enrollments, settings } = useData();

  // Selected dates — default: current week (Sun–Sat)
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => weekOf(new Date()));
  const [detailClass, setDetailClass] = useState<Class | null>(null);
  // editTarget — החוג שעורכים כרגע; כשהוא מוגדר מוצג ClassFormModal
  const [editTarget, setEditTarget] = useState<Class | null>(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const todayStr = toDateStr(new Date());

  // Replace the selection with a dragged consecutive range (always at least 1 date)
  const selectRange = (dates: string[]) => {
    if (dates.length > 0) setSelectedDates(new Set(dates));
  };

  // Conflict detection
  const conflictIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cls of classes) {
      if (getConflictingClassIds(cls, classes).length > 0) ids.add(cls.id);
    }
    return ids;
  }, [classes]);

  // Fetch slots for exactly the selected dates
  const slots = useMemo(
    () => getSlotsForDates(classes, Array.from(selectedDates)),
    [classes, selectedDates]
  );

  // Build DayData for the grid — sorted Sun→Sat, then reversed so Sunday appears on the right in RTL
  const days: DayData[] = useMemo(() => {
    // Ascending order (Sun→Sat); dir="rtl" on the grid puts Sunday on the right naturally
    const sortedDates = Array.from(selectedDates).sort();
    return sortedDates.map((dateStr) => {
      const date = new Date(dateStr + "T00:00:00");
      const events = slots
        .filter((s) => s.date === dateStr)
        .map(({ classId, slot }) => {
          const classItem = classes.find((c) => c.id === classId);
          if (!classItem) return null;
          return {
            classItem,
            slot,
            teacher: teachers.find((t) => t.id === classItem.teacher_id),
            room: rooms.find((r) => r.id === slot.room_id),
            enrollCount: enrollments.filter(
              (e) => e.class_id === classId && e.status === "פעיל"
            ).length,
            hasConflict: conflictIds.has(classId),
          };
        })
        .filter(Boolean) as DayData["events"];

      return { date, dateStr, isToday: dateStr === todayStr, events };
    });
  }, [selectedDates, slots, classes, teachers, rooms, enrollments, conflictIds, todayStr]);

  const totalEvents = days.reduce((n, d) => n + d.events.length, 0);

  return (
    <PageShell title="לוח זמנים">

      {/* Summary line */}
      <p className="text-xs text-gray-400 mb-3 text-right">
        {selectedDates.size === 1
          ? `תאריך אחד נבחר`
          : `${selectedDates.size} ימים נבחרו`}
        {" • "}
        {totalEvents} מפגשים
      </p>

      {/* Two-column layout: mini calendar (right) + grid (left) */}
      <div className="flex gap-4 items-start" dir="rtl">

        {/* Mini calendar sidebar */}
        <MiniCalendar
          selectedDates={selectedDates}
          onSelectRange={selectRange}
        />

        {/* Main calendar grid — takes remaining space */}
        <div className="flex-1 min-w-0">
          <CalendarGrid days={days} onEventClick={setDetailClass} />
        </div>

      </div>

      {/* Class detail modal */}
      {detailClass && (
        <ViewExistingClassDetailModal
          classItem={detailClass}
          teachers={teachers}
          rooms={rooms}
          physicalEquipment={physicalEquipment}
          students={students}
          enrollments={enrollments}
          allClasses={classes}
          onClose={() => setDetailClass(null)}
          onEdit={(c) => { setEditTarget(c); setDetailClass(null); }}
        />
      )}

      {/* Edit class modal — נפתח בלחיצה על "עריכה" בחלון הפרטים */}
      {editTarget && (
        <ClassFormModal
          mode="edit"
          classItem={editTarget}
          teachers={teachers}
          rooms={rooms}
          physicalEquipment={physicalEquipment}
          allClasses={classes}
          settings={settings}
          saving={saving}
          onClose={() => setEditTarget(null)}
          onSave={async (form) => {
            if (!form.name.trim()) { showToast("שם החוג הוא שדה חובה", "error"); return; }
            if (!form.teacher_id) { showToast("יש לבחור מדריך", "error"); return; }
            setSaving(true);
            try {
              await updateDocument("classes", editTarget.id, form);
              showToast("החוג עודכן בהצלחה", "success");
              setEditTarget(null);
            } catch { showToast("שגיאה בשמירה, נסה שוב", "error"); }
            finally { setSaving(false); }
          }}
        />
      )}
    </PageShell>
  );
}
