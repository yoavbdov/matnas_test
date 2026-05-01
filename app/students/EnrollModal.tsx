"use client";
// חלון רישום תלמיד לחוג — מציג חוגים זמינים ומאפשר רישום
import { useState } from "react";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import { calcAge } from "@/lib/utils";
import { addDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import type { Student, Class, Enrollment } from "@/lib/types";

interface Props {
  student: Student;
  allClasses: Class[];
  enrollments: Enrollment[];
  onClose: () => void;
  onSaved: () => void;
}

// Returns why a student can't enroll, or null if they can
function ineligibleReason(student: Student, cls: Class, enrollments: Enrollment[]): string | null {
  if (enrollments.some((e) => e.student_id === student.id && e.class_id === cls.id && e.status === "פעיל")) {
    return "כבר רשום";
  }
  const age = student.dob ? calcAge(student.dob) : null;
  if (age !== null && cls.age_min !== undefined && age < cls.age_min) return "צעיר מדי";
  if (age !== null && cls.age_max !== undefined && age > cls.age_max) return "מבוגר מדי";
  const enrolled = enrollments.filter((e) => e.class_id === cls.id && e.status === "פעיל").length;
  if (enrolled >= cls.capacity) return "מלא";
  return null;
}

export default function EnrollModal({ student, allClasses, enrollments, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const activeClasses = allClasses.filter((c) => c.status === "פעיל");

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (selected.size === 0) { showToast("לא נבחר אף חוג", "error"); return; }
    setSaving(true);
    try {
      await Promise.all([...selected].map((classId) =>
        addDocument("enrollments", {
          student_id: student.id,
          class_id: classId,
          enrolled_at: new Date().toISOString().slice(0, 10),
          status: "פעיל",
        })
      ));
      showToast(`${selected.size === 1 ? "הרישום בוצע" : `${selected.size} רישומים בוצעו`}`, "success");
      onSaved();
      onClose();
    } catch {
      showToast("שגיאה בשמירה, נסה שוב", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`רישום ${student.first_name} ${student.last_name} לחוג`}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>ביטול</Btn>
          <Btn onClick={handleSave} loading={saving} disabled={selected.size === 0}>
            רשום ({selected.size})
          </Btn>
        </>
      }
    >
      <div className="space-y-2">
        {activeClasses.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">אין חוגים פעילים</p>
        )}
        {activeClasses.map((cls) => {
          const reason = ineligibleReason(student, cls, enrollments);
          const canEnroll = !reason;
          const isChecked = selected.has(cls.id);

          return (
            <label
              key={cls.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                canEnroll
                  ? "border-gray-200 cursor-pointer hover:bg-gray-50"
                  : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
              } ${isChecked ? "border-teal-400 bg-teal-50" : ""}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={!canEnroll}
                onChange={() => canEnroll && toggle(cls.id)}
                className="accent-teal-600"
              />
              {/* Color dot */}
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cls.color ?? "#ccc" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{cls.name}</p>
                <p className="text-xs text-gray-400">
                  {cls.age_min !== undefined && cls.age_max !== undefined
                    ? `גיל ${cls.age_min}–${cls.age_max} · `
                    : ""}
                  {enrollments.filter((e) => e.class_id === cls.id && e.status === "פעיל").length}/{cls.capacity} רשומים
                </p>
              </div>
              {reason && (
                <span className="text-xs text-red-400 shrink-0">{reason}</span>
              )}
            </label>
          );
        })}
      </div>
    </Modal>
  );
}
