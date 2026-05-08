"use client";
import { useState, useMemo } from "react";
import PageShell from "@/components/shared/PageShell";
import ClassesToolbar from "./ClassesToolbar";
import ClassesTable, { type SortCol, type SortDir } from "./ClassesTable";
import ClassFormModal from "./ClassFormModal";
import ViewExistingClassDetailModal from "./ViewExistingClassDetailModal";
import ClassUploadPanel from "./ClassUploadPanel";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { addDocument, updateDocument, deleteDocument } from "@/firebase/firestore";
import { CLASS_COLORS } from "@/lib/constants";
import { computeClassStatus } from "@/lib/classHelpers";
import type { Class } from "@/lib/types";
import type { EnrollmentChanges } from "./ClassFormModal";

// Hebrew day name for today (0=Sunday → ראשון)
const DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const TODAY_DAY = DAY_NAMES[new Date().getDay()];

function emptyForm(): Omit<Class, "id"> {
  return { name: "", teacher_id: "", capacity: 10, status: "מתוכנן", color: CLASS_COLORS[0], slots: [], resource_assignments: [] };
}

export default function ClassesPage() {
  const { classes, teachers, rooms, physicalEquipment, students, enrollments, settings, tournaments } = useData();
  const { showToast } = useToast();

  // --- פילטרים ---
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"הכל" | "מתוכנן" | "פעיל" | "הסתיים" | "בוטל">("הכל");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [ratingMin, setRatingMin] = useState("");
  const [ratingMax, setRatingMax] = useState("");
  const [participantsMin, setParticipantsMin] = useState("");
  const [participantsMax, setParticipantsMax] = useState("");
  const [dayFilter, setDayFilter] = useState<string[]>([]);

  // "היום" — toggle: כאשר פעיל מסנן סטטוס=פעיל + יום שבוע של היום
  const [todayActive, setTodayActive] = useState(false);

  function handleToggleToday() {
    setTodayActive((prev) => {
      if (!prev) {
        // הפעלה: איפוס שאר הפילטרים הרלוונטיים + הגדרת "היום"
        setStatusFilter("פעיל");
        setDayFilter([TODAY_DAY]);
      } else {
        // כיבוי: חזרה לברירות מחדל
        setStatusFilter("הכל");
        setDayFilter([]);
      }
      return !prev;
    });
  }

  function handleToggleDay(day: string) {
    // שינוי יום ידני — מכבה את מצב "היום" אם היה פעיל
    setTodayActive(false);
    setDayFilter((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function handleFilterStatus(v: "הכל" | "מתוכנן" | "פעיל" | "הסתיים" | "בוטל") {
    setStatusFilter(v);
    // שינוי סטטוס ידני — מכבה "היום"
    setTodayActive(false);
  }

  // --- מיון ---
  const [sortCol, setSortCol] = useState<SortCol>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  }

  // --- חישוב הרשימה המסוננת והממוינת ---
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    function enrolledCount(classId: string) {
      return enrollments.filter((e) => e.class_id === classId && e.status === "פעיל").length;
    }

    // סינון
    let result = classes.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (statusFilter !== "הכל" && c.status !== statusFilter) return false;
      if (teacherFilter && c.teacher_id !== teacherFilter) return false;
      if (ageMin !== "" && c.age_max !== undefined && c.age_max < Number(ageMin)) return false;
      if (ageMax !== "" && c.age_min !== undefined && c.age_min > Number(ageMax)) return false;
      if (ratingMin !== "" && c.rating_max !== undefined && c.rating_max < Number(ratingMin)) return false;
      if (ratingMax !== "" && c.rating_min !== undefined && c.rating_min > Number(ratingMax)) return false;
      const enrolled = enrolledCount(c.id);
      if (participantsMin !== "" && enrolled < Number(participantsMin)) return false;
      if (participantsMax !== "" && enrolled > Number(participantsMax)) return false;
      if (dayFilter.length > 0) {
        const classDays = (c.slots ?? []).map((s) => s.day);
        if (!dayFilter.some((d) => classDays.includes(d))) return false;
      }
      return true;
    });

    // מיון
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortCol === "name") {
        cmp = a.name.localeCompare(b.name, "he");
      } else if (sortCol === "teacher") {
        const ta = teachers.find((t) => t.id === a.teacher_id);
        const tb = teachers.find((t) => t.id === b.teacher_id);
        cmp = `${ta?.first_name ?? ""} ${ta?.last_name ?? ""}`.localeCompare(
          `${tb?.first_name ?? ""} ${tb?.last_name ?? ""}`, "he"
        );
      } else if (sortCol === "enrolled") {
        cmp = enrolledCount(a.id) - enrolledCount(b.id);
      } else if (sortCol === "capacity") {
        cmp = a.capacity - b.capacity;
      } else if (sortCol === "days") {
        const da = [...new Set((a.slots ?? []).map((s) => s.day))].join(", ");
        const db = [...new Set((b.slots ?? []).map((s) => s.day))].join(", ");
        cmp = da.localeCompare(db, "he");
      } else if (sortCol === "status") {
        cmp = a.status.localeCompare(b.status, "he");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [classes, search, statusFilter, teacherFilter, ageMin, ageMax, ratingMin, ratingMax, participantsMin, participantsMax, dayFilter, enrollments, teachers, sortCol, sortDir]);

  // --- מודלים ---
  const [importOpen, setImportOpen] = useState(false);
  const [formModal, setFormModal] = useState<"add" | "edit" | null>(null);
  const [detailClass, setDetailClass] = useState<Class | null>(null);
  const [editTarget, setEditTarget] = useState<Class | null>(null);
  const [saving, setSaving] = useState(false);

  function openAdd() { setEditTarget(null); setFormModal("add"); }
  function openEdit(c: Class) { setEditTarget(c); setFormModal("edit"); setDetailClass(null); }

  async function handleSave(form: Omit<Class, "id">, enrollmentChanges: EnrollmentChanges) {
    if (!form.name.trim()) { showToast("שם החוג הוא שדה חובה", "error"); return; }
    if (!form.teacher_id) { showToast("יש לבחור מדריך", "error"); return; }

    // Compute status automatically from slot dates (like tournaments)
    const withStatus = { ...form, status: computeClassStatus({ ...form, id: editTarget?.id ?? "" }) };

    setSaving(true);
    try {
      // Save the class, get back the ID (new or existing)
      let classId: string;
      if (formModal === "add") {
        classId = await addDocument("classes", withStatus);
      } else if (editTarget) {
        await updateDocument("classes", editTarget.id, withStatus);
        classId = editTarget.id;
      } else {
        return;
      }

      const today = new Date().toISOString().slice(0, 10);

      // Apply enrollment additions
      await Promise.all(
        enrollmentChanges.toAdd.map((studentId) =>
          addDocument("enrollments", {
            student_id: studentId,
            class_id: classId,
            enrolled_at: today,
            status: "פעיל",
          })
        )
      );

      // Apply enrollment removals
      await Promise.all(
        enrollmentChanges.toRemove.map((enrollmentId) =>
          deleteDocument("enrollments", enrollmentId)
        )
      );

      showToast(formModal === "add" ? "החוג נוסף בהצלחה" : "החוג עודכן בהצלחה", "success");
      setFormModal(null);
    } catch { showToast("שגיאה בשמירה, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  function exportCSV() {
    const headers = [
      "שם החוג", "מדריך", "קיבולת", "רשומים",
      "גיל מינימלי", "גיל מקסימלי", "דירוג מינימלי", "דירוג מקסימלי",
      "ימים", "מפגשים", "ציוד", "הערות", "סטטוס",
    ];
    const rows = filtered.map((c) => {
      const t = teachers.find((t) => t.id === c.teacher_id);
      const enrolled = enrollments.filter((e) => e.class_id === c.id && e.status === "פעיל").length;
      const days = [...new Set((c.slots ?? []).map((s) => s.day))].join(" | ");
      // כל מפגש: יום שעת_התחלה-שעת_סיום
      const slots = (c.slots ?? []).map((s) => `${s.day} ${s.start_time}-${s.end_time}`).join(" | ");
      const resNames = (c.resource_assignments ?? [])
        .map((a) => physicalEquipment.find((r) => r.id === a.resource_id)?.name ?? a.resource_id)
        .join(" | ");
      return [
        c.name, t ? `${t.first_name} ${t.last_name}` : "", c.capacity, enrolled,
        c.age_min ?? "", c.age_max ?? "", c.rating_min ?? "", c.rating_max ?? "",
        days, slots, resNames, c.notes ?? "", c.status,
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "חוגים.csv"; a.click();
  }

  return (
    <PageShell title="חוגים">
      <ClassesToolbar
        search={search} onSearch={setSearch}
        statusFilter={statusFilter} onFilterStatus={handleFilterStatus}
        teacherFilter={teacherFilter} onFilterTeacher={setTeacherFilter}
        ageMin={ageMin} onFilterAgeMin={setAgeMin}
        ageMax={ageMax} onFilterAgeMax={setAgeMax}
        ratingMin={ratingMin} onFilterRatingMin={setRatingMin}
        ratingMax={ratingMax} onFilterRatingMax={setRatingMax}
        participantsMin={participantsMin} onFilterParticipantsMin={setParticipantsMin}
        participantsMax={participantsMax} onFilterParticipantsMax={setParticipantsMax}
        dayFilter={dayFilter} onToggleDay={handleToggleDay}
        todayActive={todayActive} onToggleToday={handleToggleToday}
        teachers={teachers}
        onAddClass={openAdd}
        onExport={exportCSV}
        onImport={() => setImportOpen(true)}
        maxSearchLength={settings.MAX_SEARCH_LENGTH}
      />

      <p className="text-xs text-gray-400 mb-3">{filtered.length} חוגים</p>

      <ClassesTable
        classes={filtered}
        teachers={teachers}
        enrollments={enrollments}
        onRowClick={setDetailClass}
        sortCol={sortCol}
        sortDir={sortDir}
        onSort={handleSort}
      />

      {importOpen && (
        <ClassUploadPanel teachers={teachers} onClose={() => setImportOpen(false)} />
      )}

      {formModal && (
        <ClassFormModal
          mode={formModal}
          classItem={editTarget}
          teachers={teachers}
          rooms={rooms}
          physicalEquipment={physicalEquipment}
          students={students}
          enrollments={enrollments}
          allClasses={classes}
          allTournaments={tournaments}
          settings={settings}
          saving={saving}
          onClose={() => setFormModal(null)}
          onSave={handleSave}
        />
      )}

      {detailClass && (
        <ViewExistingClassDetailModal
          classItem={detailClass}
          teachers={teachers}
          rooms={rooms}
          physicalEquipment={physicalEquipment}
          students={students}
          enrollments={enrollments}
          allClasses={classes}
          allTournaments={tournaments}
          onClose={() => setDetailClass(null)}
          onEdit={openEdit}
        />
      )}
    </PageShell>
  );
}
