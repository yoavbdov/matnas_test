"use client";
// חלון רישום שחקן לחוג — מציג חוגים זמינים ומאפשר רישום
// שחקן שלא עומד בקריטריון יכול להירשם, אך תוצג אזהרה בצד
import { useState } from "react";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import { calcAge } from "@/lib/utils/utils";
import { addDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import { AlertTriangle } from "lucide-react";
import type { Student, Class, Enrollment } from "@/types";

interface Props {
  student: Student;
  allClasses: Class[];
  enrollments: Enrollment[];
  onClose: () => void;
  onSaved: () => void;
}

// Returns a warning string if the student doesn't meet criteria, or null if all good.
// "כבר רשום" and "מלא" block enrollment entirely; other mismatches are warnings only.
function enrollWarning(
  student: Student,
  cls: Class,
  enrollments: Enrollment[],
): { warning: string | null; blocked: boolean } {
  // Already enrolled — hard block
  if (enrollments.some((e) => e.student_id === student.id && e.class_id === cls.id && e.status === "פעיל")) {
    return { warning: "כבר רשום", blocked: true };
  }
  // Class full — hard block
  const enrolled = enrollments.filter((e) => e.class_id === cls.id && e.status === "פעיל").length;
  if (enrolled >= cls.capacity) {
    return { warning: "מלא", blocked: true };
  }
  // Age mismatch — soft warning only
  const age = student.dob ? calcAge(student.dob) : null;
  if (age !== null && cls.age_min !== undefined && age < cls.age_min) {
    return { warning: "צעיר מדי", blocked: false };
  }
  if (age !== null && cls.age_max !== undefined && age > cls.age_max) {
    return { warning: "מבוגר מדי", blocked: false };
  }
  // Rating mismatch — soft warning only
  const r = student.israeli_rating;
  if (r !== undefined && cls.rating_min !== undefined && r < cls.rating_min) {
    return { warning: "דירוג נמוך", blocked: false };
  }
  if (r !== undefined && cls.rating_max !== undefined && r > cls.rating_max) {
    return { warning: "דירוג גבוה", blocked: false };
  }
  return { warning: null, blocked: false };
}

// Builds a short criteria line for a class (age range + rating range)
function criteriaLine(cls: Class): string {
  const parts: string[] = [];
  if (cls.age_min !== undefined || cls.age_max !== undefined) {
    parts.push(`גיל ${cls.age_min ?? "ללא מינ׳"}–${cls.age_max ?? "ללא מקס׳"}`);
  }
  if (cls.rating_min !== undefined || cls.rating_max !== undefined) {
    parts.push(`מד כושר ${cls.rating_min ?? "ללא מינ׳"}–${cls.rating_max ?? "ללא מקס׳"}`);
  }
  return parts.join(" · ");
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
      showToast(selected.size === 1 ? "הרישום בוצע" : `${selected.size} רישומים בוצעו`, "success");
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
          const { warning, blocked } = enrollWarning(student, cls, enrollments);
          const isChecked = selected.has(cls.id);
          const enrolledCount = enrollments.filter((e) => e.class_id === cls.id && e.status === "פעיל").length;
          const criteria = criteriaLine(cls);

          return (
            <label
              key={cls.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                blocked
                  ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                  : isChecked
                  ? "border-teal-400 bg-teal-50 cursor-pointer"
                  : "border-gray-200 cursor-pointer hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={blocked}
                onChange={() => !blocked && toggle(cls.id)}
                className="accent-teal-600"
              />
              {/* Color dot */}
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cls.color ?? "#ccc" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{cls.name}</p>
                <p className="text-xs text-gray-400">
                  {criteria ? `${criteria} · ` : ""}
                  {enrolledCount}/{cls.capacity} רשומים
                </p>
              </div>
              {/* Warning icon for soft mismatches, plain text for hard blocks */}
              {warning && !blocked && (
                <span className="flex items-center gap-1 text-xs text-amber-500 shrink-0">
                  <AlertTriangle size={13} />
                  {warning}
                </span>
              )}
              {warning && blocked && (
                <span className="text-xs text-red-400 shrink-0">{warning}</span>
              )}
            </label>
          );
        })}
      </div>
    </Modal>
  );
}
