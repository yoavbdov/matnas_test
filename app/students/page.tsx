"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageShell from "@/components/shared/PageShell";
import StudentsToolbar from "./StudentsToolbar";
import StudentsTable from "./StudentsTable";
import type { SortCol, SortDir } from "./StudentsTable";
import StudentFormModal from "./StudentFormModal";
import StudentDetailModal from "./StudentDetailModal";
import ExcelUploadPanel from "./ExcelUploadPanel";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { addDocument, updateDocument } from "@/firebase/firestore";
import { calcAge, gradeFromDob } from "@/lib/utils";
import type { Student } from "@/lib/types";

function emptyForm(): Omit<Student, "id"> {
  return { first_name: "", last_name: "", dob: "", status: "פעיל" };
}

// Export visible students as CSV
function exportCSV(students: Student[]) {
  const headers = [
    "שם פרטי", "שם משפחה", "תאריך לידה", "טלפון",
    "שם הורה", "טלפון הורה", "דירוג ישראלי", "סטטוס",
  ];
  const rows = students.map((s) => [
    s.first_name, s.last_name, s.dob,
    s.phone ?? "", s.parent_name ?? "", s.parent_phone ?? "",
    s.israeli_rating ?? "", s.status,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "תלמידים.csv";
  a.click();
}

// Map URL param value to Hebrew status filter
function parseStatusParam(raw: string | null): "הכל" | "פעיל" | "לא פעיל" {
  if (raw === "active") return "פעיל";
  if (raw === "inactive") return "לא פעיל";
  return "הכל";
}

// Get the effective grade label for a student (manual override or computed)
function effectiveGrade(s: Student, firstAge: number, adultAge: number): string {
  if (s.grade_override) return s.grade_override;
  if (s.dob) return gradeFromDob(s.dob, firstAge, adultAge);
  return "";
}

export default function StudentsPage() {
  const { students, classes, enrollments, settings } = useData();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters — initialized from URL params (e.g. ?status=active from dashboard links)
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState<"הכל" | "פעיל" | "לא פעיל">(
    parseStatusParam(searchParams.get("status")),
  );
  const [classFilter, setClassFilter] = useState(searchParams.get("class") ?? "");
  const [gradeFilter, setGradeFilter] = useState("");   // grade label or ""
  const [minRating, setMinRating] = useState("");       // numeric string or ""
  const [maxRating, setMaxRating] = useState("");       // numeric string or ""
  const [minFideRating, setMinFideRating] = useState(""); // FIDE rating filters
  const [maxFideRating, setMaxFideRating] = useState("");

  // Sort state
  const [sortCol, setSortCol] = useState<SortCol>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  }

  // Keep URL in sync whenever filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter === "פעיל") params.set("status", "active");
    else if (statusFilter === "לא פעיל") params.set("status", "inactive");
    if (search) params.set("search", search);
    if (classFilter) params.set("class", classFilter);
    const qs = params.toString();
    router.replace(qs ? `/students?${qs}` : "/students", { scroll: false });
  }, [statusFilter, search, classFilter, router]);

  // Which modal is open
  const [formModal, setFormModal] = useState<"add" | "edit" | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const [form, setForm] = useState<Omit<Student, "id">>(emptyForm());
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);

  // Filter + sort students
  const displayedStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const minR = minRating ? Number(minRating) : null;
    const maxR = maxRating ? Number(maxRating) : null;
    const minFide = minFideRating ? Number(minFideRating) : null;
    const maxFide = maxFideRating ? Number(maxFideRating) : null;

    // 1. Filter
    const filtered = students.filter((s) => {
      if (statusFilter !== "הכל" && s.status !== statusFilter) return false;
      if (classFilter) {
        const enrolled = enrollments.some(
          (e) => e.student_id === s.id && e.class_id === classFilter && e.status === "פעיל",
        );
        if (!enrolled) return false;
      }
      if (gradeFilter) {
        const grade = effectiveGrade(s, settings.GRADE_FIRST_AGE, settings.GRADE_ADULT_AGE);
        if (grade !== gradeFilter) return false;
      }
      if (minR !== null && (s.israeli_rating ?? 0) < minR) return false;
      if (maxR !== null && (s.israeli_rating ?? 0) > maxR) return false;
      if (minFide !== null && (s.fide_rating ?? 0) < minFide) return false;
      if (maxFide !== null && (s.fide_rating ?? 0) > maxFide) return false;
      if (q) {
        const nameMatch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(q);
        const idMatch = (s.israeli_id ?? "").includes(q);
        const phoneMatch = (s.phone ?? "").includes(q);
        if (!nameMatch && !idMatch && !phoneMatch) return false;
      }
      return true;
    });

    // 2. Sort
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case "name":
          cmp = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, "he");
          break;
        case "age":
          // Sort by DOB descending = youngest first when asc
          cmp = (b.dob ?? "").localeCompare(a.dob ?? "");
          break;
        case "grade": {
          const ga = effectiveGrade(a, settings.GRADE_FIRST_AGE, settings.GRADE_ADULT_AGE);
          const gb = effectiveGrade(b, settings.GRADE_FIRST_AGE, settings.GRADE_ADULT_AGE);
          cmp = ga.localeCompare(gb, "he");
          break;
        }
        case "rating":
          cmp = (a.israeli_rating ?? 0) - (b.israeli_rating ?? 0);
          break;
        case "fide_rating":
          cmp = (a.fide_rating ?? 0) - (b.fide_rating ?? 0);
          break;
        case "phone":
          cmp = (a.parent_phone || a.phone || "").localeCompare(b.parent_phone || b.phone || "");
          break;
        case "classes": {
          const ca = enrollments.filter((e) => e.student_id === a.id && e.status === "פעיל").length;
          const cb = enrollments.filter((e) => e.student_id === b.id && e.status === "פעיל").length;
          cmp = ca - cb;
          break;
        }
        case "status":
          cmp = a.status.localeCompare(b.status, "he");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [students, search, statusFilter, classFilter, gradeFilter, minRating, maxRating, minFideRating, maxFideRating, enrollments, sortCol, sortDir, settings]);

  function openAdd() {
    setForm(emptyForm());
    setEditTarget(null);
    setFormModal("add");
  }
  function openEdit(s: Student) {
    setEditTarget(s);
    setForm({ ...s });
    setFormModal("edit");
    setDetailStudent(null);
  }

  async function handleSave() {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.dob) {
      showToast("שם ותאריך לידה הם שדות חובה", "error");
      return;
    }
    setSaving(true);
    try {
      if (formModal === "add") {
        await addDocument("students", {
          ...form,
          created_at: new Date().toISOString().slice(0, 10),
        });
        showToast("התלמיד נוסף בהצלחה", "success");
      } else if (editTarget) {
        await updateDocument("students", editTarget.id, form);
        showToast("הפרטים עודכנו בהצלחה", "success");
      }
      setFormModal(null);
    } catch {
      showToast("שגיאה בשמירה, נסה שוב", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title="תלמידים">
      <StudentsToolbar
        search={search}
        onSearch={setSearch}
        statusFilter={statusFilter}
        onFilterStatus={setStatusFilter}
        classFilter={classFilter}
        onFilterClass={setClassFilter}
        gradeFilter={gradeFilter}
        onFilterGrade={setGradeFilter}
        minRating={minRating}
        onFilterMinRating={setMinRating}
        maxRating={maxRating}
        onFilterMaxRating={setMaxRating}
        minFideRating={minFideRating}
        onFilterMinFideRating={setMinFideRating}
        maxFideRating={maxFideRating}
        onFilterMaxFideRating={setMaxFideRating}
        classes={classes}
        onAddStudent={openAdd}
        onExport={() => exportCSV(displayedStudents)}
        onImport={() => setImportOpen(true)}
        maxSearchLength={settings.MAX_SEARCH_LENGTH}
      />

      <p className="text-xs text-gray-400 mb-3">{displayedStudents.length} תלמידים</p>

      <StudentsTable
        students={displayedStudents}
        enrollments={enrollments}
        onRowClick={setDetailStudent}
        settings={settings}
        sortCol={sortCol}
        sortDir={sortDir}
        onSort={handleSort}
      />

      {/* Add / Edit form */}
      {formModal && (
        <StudentFormModal
          mode={formModal}
          form={form}
          setForm={setForm}
          saving={saving}
          onClose={() => setFormModal(null)}
          onSave={handleSave}
          settings={settings}
        />
      )}

      {/* Detail view */}
      {detailStudent && (
        <StudentDetailModal
          student={detailStudent}
          classes={classes}
          enrollments={enrollments}
          onClose={() => setDetailStudent(null)}
          onEdit={openEdit}
          settings={settings}
        />
      )}

      {/* CSV import panel */}
      {importOpen && (
        <ExcelUploadPanel
          onClose={() => setImportOpen(false)}
          settings={settings}
        />
      )}
    </PageShell>
  );
}
