"use client";
/*
  ClassEnrollmentsModal — shows the list of enrolled students for a class.
  Opened from ViewExistingClassDetailModal when the user clicks "לרשימת המשתתפים".
*/
import { useState } from "react";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { deleteDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import type { Class, Student, Enrollment } from "@/types";

interface Props {
  classItem: Class;
  students: Student[];
  enrollments: Enrollment[];
  onClose: () => void;
}

export default function ClassEnrollmentsModal({ classItem, students, enrollments, onClose }: Props) {
  const { showToast } = useToast();
  const [unenrollTarget, setUnenrollTarget] = useState<Enrollment | null>(null);

  const activeEnrollments = enrollments.filter(
    (e) => e.class_id === classItem.id && e.status === "פעיל"
  );

  async function handleUnenroll() {
    if (!unenrollTarget) return;
    try {
      await deleteDocument("enrollments", unenrollTarget.id);
      showToast("הרישום הוסר", "success");
    } catch {
      showToast("שגיאה, נסה שוב", "error");
    } finally {
      setUnenrollTarget(null);
    }
  }

  return (
    <>
      <Modal
        title={`משתתפים — ${classItem.name} (${activeEnrollments.length} / ${classItem.capacity})`}
        onClose={onClose}
        size="md"
        footer={<Btn variant="secondary" onClick={onClose}>סגור</Btn>}
      >
        <div dir="rtl">
          {activeEnrollments.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">אין שחקנים רשומים</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs">
                    <th className="text-right px-4 py-2 font-medium">שם</th>
                    <th className="text-right px-4 py-2 font-medium">דירוג</th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {activeEnrollments.map((enr) => {
                    const student = students.find((s) => s.id === enr.student_id);
                    return (
                      <tr key={enr.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-2 text-gray-800">
                          {student ? `${student.first_name} ${student.last_name}` : "—"}
                        </td>
                        <td className="px-4 py-2 text-gray-500">{student?.israeli_rating ?? "—"}</td>
                        <td className="px-4 py-2">
                          <Btn
                            variant="ghost"
                            className="text-xs px-2 py-1 text-red-400 hover:text-red-600"
                            onClick={() => setUnenrollTarget(enr)}
                          >
                            הסר רישום
                          </Btn>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {unenrollTarget && (
        <ConfirmDialog
          message="להסיר את הרישום לחוג זה?"
          onConfirm={handleUnenroll}
          onCancel={() => setUnenrollTarget(null)}
        />
      )}
    </>
  );
}
