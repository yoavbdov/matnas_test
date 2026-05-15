// Hook: owns all modal + form + save state for the Students page
// Separates CRUD concerns from filtering concerns

import { useState } from "react";
import { addDocument, updateDocument } from "@/firebase/firestore";
import { formatPhone } from "@/lib/utils";
import { validatePhone, VALIDATION_ERRORS } from "@/lib/validators";
import type { Student } from "@/lib/types";

function emptyForm(): Omit<Student, "id"> {
  return { first_name: "", last_name: "", dob: "" };
}

interface Deps {
  showToast: (msg: string, type: "success" | "error") => void;
}

export function useStudentSave({ showToast }: Deps) {
  // Which modal is open
  const [formModal, setFormModal] = useState<"add" | "edit" | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);

  // Form data
  const [form, setForm] = useState<Omit<Student, "id">>(emptyForm());
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);

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
    if (validatePhone(form.phone)) {
      showToast(VALIDATION_ERRORS.PHONE, "error");
      return;
    }
    // Format phone as "053-2422215" before writing to Firestore
    const docData = { ...form, phone: form.phone ? formatPhone(form.phone) : undefined };
    setSaving(true);
    try {
      if (formModal === "add") {
        await addDocument("students", { ...docData, created_at: new Date().toISOString().slice(0, 10) });
        showToast("השחקן נוסף בהצלחה", "success");
      } else if (editTarget) {
        await updateDocument("students", editTarget.id, docData);
        showToast("הפרטים עודכנו בהצלחה", "success");
      }
      setFormModal(null);
    } catch { showToast("שגיאה בשמירה, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  return {
    formModal, setFormModal,
    detailStudent, setDetailStudent,
    importOpen, setImportOpen,
    availabilityOpen, setAvailabilityOpen,
    form, setForm,
    editTarget,
    saving,
    openAdd,
    openEdit,
    handleSave,
  };
}
