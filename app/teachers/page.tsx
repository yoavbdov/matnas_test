"use client";
import { useState, useMemo } from "react";
import PageShell from "@/components/shared/PageShell";
import TeachersToolbar from "./TeachersToolbar";
import TeachersTable from "./TeachersTable";
import TeacherFormModal from "./TeacherFormModal";
import TeacherDetailModal from "./TeacherDetailModal";
import TeacherUploadPanel from "./TeacherUploadPanel";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { addDocument, updateDocument } from "@/firebase/firestore";
import type { Teacher } from "@/lib/types";

function emptyForm(): Omit<Teacher, "id"> {
  return { first_name: "", last_name: "", status: "פעיל", certifications: [] };
}

export default function TeachersPage() {
  const { teachers, classes, enrollments, settings } = useData();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"הכל" | "פעיל" | "לא פעיל">("הכל");

  const [formModal, setFormModal] = useState<"add" | "edit" | null>(null);
  const [detailTeacher, setDetailTeacher] = useState<Teacher | null>(null);
  const [editTarget, setEditTarget] = useState<Teacher | null>(null);
  const [form, setForm] = useState<Omit<Teacher, "id">>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers.filter((t) => {
      if (statusFilter !== "הכל" && t.status !== statusFilter) return false;
      if (!q) return true;
      return `${t.first_name} ${t.last_name}`.toLowerCase().includes(q) ||
        (t.email ?? "").toLowerCase().includes(q) || (t.phone ?? "").includes(q);
    });
  }, [teachers, search, statusFilter]);

  function openAdd() { setForm(emptyForm()); setEditTarget(null); setFormModal("add"); }
  function openEdit(t: Teacher) { setEditTarget(t); setForm({ ...t, certifications: t.certifications ?? [] }); setFormModal("edit"); setDetailTeacher(null); }

  async function handleSave() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      showToast("שם פרטי ושם משפחה הם שדות חובה", "error"); return;
    }
    setSaving(true);
    try {
      if (formModal === "add") {
        await addDocument("teachers", form);
        showToast("המדריך נוסף בהצלחה", "success");
      } else if (editTarget) {
        await updateDocument("teachers", editTarget.id, form);
        showToast("הפרטים עודכנו בהצלחה", "success");
      }
      setFormModal(null);
    } catch { showToast("שגיאה בשמירה, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  // ייצוא מלא — כולל כל השדות + ספירת חוגים פעילים
  function exportCSV() {
    const headers = ["שם פרטי", "שם משפחה", "סטטוס", "טלפון", "אימייל", "הסמכות", "הערות", "חוגים פעילים"];
    const rows = filtered.map((t) => {
      const activeClasses = classes.filter((c) => c.teacher_id === t.id && c.status === "פעיל").length;
      // סטטוס נגזר: 0 חוגים פעילים = לא פעיל
      const status = activeClasses === 0 ? "לא פעיל" : t.status;
      return [
        t.first_name, t.last_name, status,
        t.phone ?? "", t.email ?? "",
        (t.certifications ?? []).join("|"),
        t.notes ?? "", activeClasses,
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "מדריכים.csv"; a.click();
  }

  return (
    <PageShell title="מדריכים">
      <TeachersToolbar
        search={search}
        onSearch={setSearch}
        statusFilter={statusFilter}
        onFilterStatus={setStatusFilter}
        onAddTeacher={openAdd}
        onExport={exportCSV}
        onImport={() => setImportOpen(true)}
        maxSearchLength={settings.MAX_SEARCH_LENGTH}
      />

      <p className="text-xs text-gray-400 mb-3">{filtered.length} מדריכים</p>

      <TeachersTable
        teachers={filtered}
        classes={classes}
        onRowClick={setDetailTeacher}
      />

      {formModal && (
        <TeacherFormModal
          mode={formModal}
          form={form}
          setForm={setForm}
          saving={saving}
          onClose={() => setFormModal(null)}
          onSave={handleSave}
          settings={settings}
        />
      )}

      {importOpen && (
        <TeacherUploadPanel onClose={() => setImportOpen(false)} />
      )}

      {detailTeacher && (
        <TeacherDetailModal
          teacher={detailTeacher}
          classes={classes}
          enrollments={enrollments}
          onClose={() => setDetailTeacher(null)}
          onEdit={openEdit}
        />
      )}
    </PageShell>
  );
}
