"use client";
// חלון פרטים מלאים של מדריך — מידע אישי + רשימת חוגים שהוא מלמד
import { useState } from "react";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import Badge from "@/components/shared/Badge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { deleteDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import type { Teacher, Class, Enrollment } from "@/lib/types";

interface Props {
  teacher: Teacher;
  classes: Class[];
  enrollments: Enrollment[];
  onClose: () => void;
  onEdit: (t: Teacher) => void;
}

function Row({ label, value }: { label: string; value?: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

export default function TeacherDetailModal({ teacher, classes, enrollments, onClose, onEdit }: Props) {
  const { showToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Classes taught by this teacher
  const myClasses = classes.filter((c) => c.teacher_id === teacher.id);
  const activeClasses = myClasses.filter((c) => c.status === "פעיל");

  async function handleDelete() {
    try {
      await deleteDocument("teachers", teacher.id);
      showToast("המדריך נמחק", "success");
      onClose();
    } catch { showToast("שגיאה, נסה שוב", "error"); }
    finally { setConfirmDelete(false); }
  }

  return (
    <>
      <Modal
        title={`${teacher.first_name} ${teacher.last_name}`}
        onClose={onClose}
        size="md"
        footer={
          <div className="flex justify-between w-full">
            <Btn variant="danger" onClick={() => setConfirmDelete(true)}>מחיקה</Btn>
            <div className="flex gap-2">
              <Btn variant="secondary" onClick={onClose}>סגור</Btn>
              <Btn onClick={() => onEdit(teacher)}>עריכה</Btn>
            </div>
          </div>
        }
      >
        <div className="mb-3">
          <Badge label={teacher.status} color={teacher.status === "פעיל" ? "green" : "gray"} />
        </div>

        <Row label="שם מלא" value={`${teacher.first_name} ${teacher.last_name}`} />
        <Row label="טלפון" value={teacher.phone} />
        <Row label="אימייל" value={teacher.email} />
        <Row label="תחום" value={teacher.subject} />

        {(teacher.certifications ?? []).length > 0 && (
          <div className="py-1.5 border-b border-gray-50">
            <span className="text-xs text-gray-400 block mb-1">הסמכות</span>
            <div className="flex flex-wrap gap-1">
              {(teacher.certifications ?? []).map((c) => (
                <span key={c} className="text-xs bg-teal-50 text-teal-700 rounded-full px-2.5 py-0.5">{c}</span>
              ))}
            </div>
          </div>
        )}

        {teacher.notes && (
          <>
            <hr className="my-3 border-gray-100" />
            <p className="text-xs text-gray-400 mb-1">הערות</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{teacher.notes}</p>
          </>
        )}

        {/* Classes section */}
        <hr className="my-4 border-gray-100" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          חוגים ({activeClasses.length} פעילים / {myClasses.length} סה״כ)
        </p>

        {myClasses.length === 0 ? (
          <p className="text-sm text-gray-400">לא מלמד חוגים</p>
        ) : (
          <div className="space-y-1.5">
            {myClasses.map((cls) => {
              const enrolled = enrollments.filter((e) => e.class_id === cls.id && e.status === "פעיל").length;
              return (
                <div key={cls.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: cls.color ?? "#ccc" }} />
                    <span className="text-sm text-gray-800">{cls.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{enrolled}/{cls.capacity}</span>
                    <Badge label={cls.status} color={cls.status === "פעיל" ? "green" : "gray"} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {confirmDelete && (
        <ConfirmDialog
          message={`למחוק את ${teacher.first_name} ${teacher.last_name}?`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
