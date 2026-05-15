// Hook: owns all modal + form + save state for the Classes page

import { useState } from "react";
import { addDocument, updateDocument, deleteDocument } from "@/firebase/firestore";
import { computeClassStatus } from "@/lib/classHelpers";
import type { Class } from "@/lib/types";
import type { EnrollmentChanges } from "./ClassFormModal";

interface Deps {
  showToast: (msg: string, type: "success" | "error") => void;
}

export function useClassSave({ showToast }: Deps) {
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
    const badSlot = (form.slots ?? []).find((s) => s.end_time <= s.start_time);
    if (badSlot) { showToast("שעת הסיום חייבת להיות אחרי שעת ההתחלה בכל המפגשים", "error"); return; }

    // Status is computed automatically from slot dates
    const withStatus = { ...form, status: computeClassStatus({ ...form, id: editTarget?.id ?? "" }) };
    setSaving(true);
    try {
      let classId: string;
      if (formModal === "add") {
        classId = await addDocument("classes", withStatus);
      } else if (editTarget) {
        await updateDocument("classes", editTarget.id, withStatus);
        classId = editTarget.id;
      } else { return; }

      const today = new Date().toISOString().slice(0, 10);
      await Promise.all(
        enrollmentChanges.toAdd.map((studentId) =>
          addDocument("enrollments", { student_id: studentId, class_id: classId, enrolled_at: today, status: "פעיל" }),
        ),
      );
      await Promise.all(
        enrollmentChanges.toRemove.map((enrollmentId) => deleteDocument("enrollments", enrollmentId)),
      );

      showToast(formModal === "add" ? "החוג נוסף בהצלחה" : "החוג עודכן בהצלחה", "success");
      setFormModal(null);
    } catch { showToast("שגיאה בשמירה, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  return {
    importOpen, setImportOpen,
    formModal, setFormModal,
    detailClass, setDetailClass,
    editTarget,
    saving,
    openAdd,
    openEdit,
    handleSave,
  };
}
