"use client";
import { useState, useMemo } from "react";
import PageShell from "@/components/shared/PageShell";
import StudentsToolbar from "./StudentsToolbar";
import StudentsTable from "./StudentsTable";
import StudentFormModal from "./StudentFormModal";
import StudentDetailModal from "./StudentDetailModal";
import ExcelUploadPanel from "./ExcelUploadPanel";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { addDocument, updateDocument } from "@/firebase/firestore";
import type { Student } from "@/lib/types";

function emptyForm(): Omit<Student, "id"> {
  return { first_name: "", last_name: "", dob: "", status: "פעיל" };
}

// Export visible students as CSV
function exportCSV(students: Student[]) {
  const headers = ["שם פרטי", "שם משפחה", "תאריך לידה", "טלפון", "שם הורה", "טלפון הורה", "דירוג ישראלי", "סטטוס"];
  const rows = students.map((s) => [
    s.first_name, s.last_name, s.dob, s.phone ?? "", s.parent_name ?? "",
    s.parent_phone ?? "", s.israeli_rating ?? "", s.status,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "תלמידים.csv";
  a.click();
}

export default function StudentsPage() {
  const { students, classes, enrollments, settings } = useData();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"הכל" | "פעיל" | "לא פעיל">("הכל");
  const [classFilter, setClassFilter] = useState("");

  // Which modal is open
  const [formModal, setFormModal] = useState<"add" | "edit" | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const [form, setForm] = useState<Omit<Student, "id">>(emptyForm());
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);

  // Filter students
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (statusFilter !== "הכל" && s.status !== statusFilter) return false;
      if (classFilter) {
        const enrolled = enrollments.some((e) => e.student_id === s.id && e.class_id === classFilter && e.status === "פעיל");
        if (!enrolled) return false;
      }
      if (!q) return true;
      return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        (s.israeli_id ?? "").includes(q) || (s.phone ?? "").includes(q);
    });
  }, [students, search, statusFilter, classFilter, enrollments]);

  function openAdd() { setForm(emptyForm()); setEditTarget(null); setFormModal("add"); }
  function openEdit(s: Student) { setEditTarget(s); setForm({ ...s }); setFormModal("edit"); setDetailStudent(null); }

  async function handleSave() {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.dob) {
      showToast("שם ותאריך לידה הם שדות חובה", "error"); return;
    }
    setSaving(true);
    try {
      if (formModal === "add") {
        await addDocument("students", { ...form, created_at: new Date().toISOString().slice(0, 10) });
        showToast("התלמיד נוסף בהצלחה", "success");
      } else if (editTarget) {
        await updateDocument("students", editTarget.id, form);
        showToast("הפרטים עודכנו בהצלחה", "success");
      }
      setFormModal(null);
    } catch { showToast("שגיאה בשמירה, נסה שוב", "error"); }
    finally { setSaving(false); }
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
        classes={classes}
        onAddStudent={openAdd}
        onExport={() => exportCSV(filtered)}
        onImport={() => setImportOpen(true)}
        maxSearchLength={settings.MAX_SEARCH_LENGTH}
      />

      <p className="text-xs text-gray-400 mb-3">{filtered.length} תלמידים</p>

      <StudentsTable
        students={filtered}
        enrollments={enrollments}
        onRowClick={setDetailStudent}
        settings={settings}
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
        <ExcelUploadPanel onClose={() => setImportOpen(false)} settings={settings} />
      )}
    </PageShell>
  );
}
