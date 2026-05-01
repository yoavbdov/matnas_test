"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageShell from "@/components/shared/PageShell";
import ClassesToolbar from "./ClassesToolbar";
import ClassesTable from "./ClassesTable";
import ClassFormModal from "./ClassFormModal";
import ViewExistingClassDetailModal from "./ViewExistingClassDetailModal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { addDocument, updateDocument } from "@/firebase/firestore";
import { CLASS_COLORS } from "@/lib/constants";
import type { Class } from "@/lib/types";

function emptyForm(): Omit<Class, "id"> {
  return { name: "", teacher_id: "", capacity: 10, status: "פעיל", color: CLASS_COLORS[0], slots: [], resource_ids: [] };
}

// Map URL param value to Hebrew status filter
function parseStatusParam(raw: string | null): "הכל" | "פעיל" | "לא פעיל" {
  if (raw === "active") return "פעיל";
  if (raw === "inactive") return "לא פעיל";
  return "הכל";
}

export default function ClassesPage() {
  const { classes, teachers, rooms, resources, students, enrollments, settings } = useData();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params (e.g. ?status=active from dashboard links)
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState<"הכל" | "פעיל" | "לא פעיל">(
    parseStatusParam(searchParams.get("status"))
  );

  // Keep URL in sync whenever filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter === "פעיל") params.set("status", "active");
    else if (statusFilter === "לא פעיל") params.set("status", "inactive");
    if (search) params.set("search", search);

    const qs = params.toString();
    router.replace(qs ? `/classes?${qs}` : "/classes", { scroll: false });
  }, [statusFilter, search, router]);

  const [formModal, setFormModal] = useState<"add" | "edit" | null>(null);
  const [detailClass, setDetailClass] = useState<Class | null>(null);
  const [editTarget, setEditTarget] = useState<Class | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classes.filter((c) => {
      if (statusFilter !== "הכל" && c.status !== statusFilter) return false;
      if (!q) return true;
      const t = teachers.find((t) => t.id === c.teacher_id);
      return c.name.toLowerCase().includes(q) ||
        (t ? `${t.first_name} ${t.last_name}`.toLowerCase().includes(q) : false);
    });
  }, [classes, search, statusFilter, teachers]);

  function openAdd() { setEditTarget(null); setFormModal("add"); }
  function openEdit(c: Class) { setEditTarget(c); setFormModal("edit"); setDetailClass(null); }

  async function handleSave(form: Omit<Class, "id">) {
    if (!form.name.trim()) { showToast("שם החוג הוא שדה חובה", "error"); return; }
    if (!form.teacher_id) { showToast("יש לבחור מדריך", "error"); return; }
    setSaving(true);
    try {
      if (formModal === "add") {
        await addDocument("classes", form);
        showToast("החוג נוסף בהצלחה", "success");
      } else if (editTarget) {
        await updateDocument("classes", editTarget.id, form);
        showToast("החוג עודכן בהצלחה", "success");
      }
      setFormModal(null);
    } catch { showToast("שגיאה בשמירה, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  function exportCSV() {
    const rows = filtered.map((c) => {
      const t = teachers.find((t) => t.id === c.teacher_id);
      const enrolled = enrollments.filter((e) => e.class_id === c.id && e.status === "פעיל").length;
      return [c.name, t ? `${t.first_name} ${t.last_name}` : "", enrolled, c.capacity, c.status].join(",");
    });
    const csv = ["שם,מדריך,רשומים,קיבולת,סטטוס", ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "חוגים.csv"; a.click();
  }

  return (
    <PageShell title="חוגים">
      <ClassesToolbar
        search={search}
        onSearch={setSearch}
        statusFilter={statusFilter}
        onFilterStatus={setStatusFilter}
        onAddClass={openAdd}
        onExport={exportCSV}
        maxSearchLength={settings.MAX_SEARCH_LENGTH}
      />

      <p className="text-xs text-gray-400 mb-3">{filtered.length} חוגים</p>

      <ClassesTable
        classes={filtered}
        teachers={teachers}
        enrollments={enrollments}
        onRowClick={setDetailClass}
      />

      {formModal && (
        <ClassFormModal
          mode={formModal}
          classItem={editTarget}
          teachers={teachers}
          rooms={rooms}
          resources={resources}
          allClasses={classes}
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
          resources={resources}
          students={students}
          enrollments={enrollments}
          allClasses={classes}
          onClose={() => setDetailClass(null)}
          onEdit={openEdit}
        />
      )}
    </PageShell>
  );
}
