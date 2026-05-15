// Hook: owns all filter + modal + save state for the Teachers page

import { useState, useMemo } from "react";
import { addDocument, updateDocument } from "@/firebase/firestore";
import { formatPhone } from "@/lib/utils/utils";
import { validatePhone, VALIDATION_ERRORS } from "@/lib/validation/validators";
import { computeTeacherStatus } from "@/lib/helpers/teacherHelpers";
import type { Teacher, Class, Tournament } from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/config/config";

function emptyForm(): Omit<Teacher, "id"> {
  return { first_name: "", last_name: "", certifications: [] };
}

interface Data {
  teachers: Teacher[];
  classes: Class[];
  tournaments: Tournament[];
  settings: typeof DEFAULT_SETTINGS;
}

interface Deps {
  showToast: (msg: string, type: "success" | "error") => void;
}

export function useTeacherState(data: Data, { showToast }: Deps) {
  const { teachers, classes, tournaments } = data;

  // ── Filter state ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"הכל" | "פעיל" | "לא פעיל">("הכל");

  // ── Modal + form state ──
  const [formModal, setFormModal] = useState<"add" | "edit" | null>(null);
  const [detailTeacher, setDetailTeacher] = useState<Teacher | null>(null);
  const [editTarget, setEditTarget] = useState<Teacher | null>(null);
  const [form, setForm] = useState<Omit<Teacher, "id">>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);

  // Filtered teachers — computed from filter state
  const filteredTeachers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers.filter((t) => {
      // Status is computed dynamically — never read from the stored field
      const status = computeTeacherStatus(t.id, classes, tournaments);
      if (statusFilter !== "הכל" && status !== statusFilter) return false;
      if (!q) return true;
      return (
        `${t.first_name} ${t.last_name}`.toLowerCase().includes(q) ||
        (t.email ?? "").toLowerCase().includes(q) ||
        (t.phone ?? "").includes(q)
      );
    });
  }, [teachers, classes, tournaments, search, statusFilter]);

  function openAdd() { setForm(emptyForm()); setEditTarget(null); setFormModal("add"); }
  function openEdit(t: Teacher) {
    setEditTarget(t);
    setForm({ ...t, certifications: t.certifications ?? [] });
    setFormModal("edit");
    setDetailTeacher(null);
  }

  async function handleSave() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      showToast("שם פרטי ושם משפחה הם שדות חובה", "error");
      return;
    }
    if (validatePhone(form.phone)) {
      showToast(VALIDATION_ERRORS.PHONE, "error");
      return;
    }
    // Format phone as "053-2422215" before writing to Firestore
    const docData = { ...form, phone: form.phone ? formatPhone(form.phone) : undefined };
    setSaving(true);
    try {
      if (formModal === "add") {
        await addDocument("teachers", docData);
        showToast("המדריך נוסף בהצלחה", "success");
      } else if (editTarget) {
        await updateDocument("teachers", editTarget.id, docData);
        showToast("הפרטים עודכנו בהצלחה", "success");
      }
      setFormModal(null);
    } catch { showToast("שגיאה בשמירה, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  return {
    // Filter
    search, setSearch,
    statusFilter, setStatusFilter,
    filteredTeachers,
    // Modal + form
    formModal, setFormModal,
    detailTeacher, setDetailTeacher,
    form, setForm,
    editTarget,
    saving,
    importOpen, setImportOpen,
    availabilityOpen, setAvailabilityOpen,
    // Actions
    openAdd, openEdit, handleSave,
  };
}
