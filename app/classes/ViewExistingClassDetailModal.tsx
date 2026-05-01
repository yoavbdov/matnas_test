"use client";
// חלון פרטים של חוג קיים — מידע, מפגשים, ציוד, תלמידים רשומים
import { useState } from "react";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import Badge from "@/components/shared/Badge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { deleteDocument, deleteWhere } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import { getConflictingClassIds } from "@/lib/classHelpers";
import type { Class, Teacher, Room, Resource, Child, Enrollment } from "@/lib/types";

interface Props {
  classItem: Class;
  teachers: Teacher[];
  rooms: Room[];
  resources: Resource[];
  students: Child[];
  enrollments: Enrollment[];
  allClasses: Class[];
  onClose: () => void;
  onEdit: (c: Class) => void;
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

export default function ViewExistingClassDetailModal({
  classItem, teachers, rooms, resources, students, enrollments, allClasses, onClose, onEdit,
}: Props) {
  const { showToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [unenrollTarget, setUnenrollTarget] = useState<Enrollment | null>(null);

  const teacher = teachers.find((t) => t.id === classItem.teacher_id);
  const activeEnrollments = enrollments.filter((e) => e.class_id === classItem.id && e.status === "פעיל");
  const conflictIds = getConflictingClassIds(classItem, allClasses);

  async function handleDelete() {
    try {
      await deleteDocument("classes", classItem.id);
      await deleteWhere("enrollments", "class_id", classItem.id);
      showToast("החוג נמחק", "success");
      onClose();
    } catch { showToast("שגיאה, נסה שוב", "error"); }
    finally { setConfirmDelete(false); }
  }

  async function handleUnenroll() {
    if (!unenrollTarget) return;
    try {
      await deleteDocument("enrollments", unenrollTarget.id);
      showToast("הרישום הוסר", "success");
    } catch { showToast("שגיאה, נסה שוב", "error"); }
    finally { setUnenrollTarget(null); }
  }

  return (
    <>
      <Modal
        title={classItem.name}
        onClose={onClose}
        size="xl"
        footer={
          <div className="flex justify-between w-full">
            <Btn variant="danger" onClick={() => setConfirmDelete(true)}>מחיקה</Btn>
            <div className="flex gap-2">
              <Btn variant="secondary" onClick={onClose}>סגור</Btn>
              <Btn onClick={() => onEdit(classItem)}>עריכה</Btn>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Basic info */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: classItem.color ?? "#ccc" }} />
              <Badge label={classItem.status} color={classItem.status === "פעיל" ? "green" : "gray"} />
            </div>
            <Row label="מדריך" value={teacher ? `${teacher.first_name} ${teacher.last_name}` : "—"} />
            <Row label="קיבולת" value={classItem.capacity} />
            <Row label="גיל מינימלי" value={classItem.age_min} />
            <Row label="גיל מקסימלי" value={classItem.age_max} />
            <Row label="דירוג מינימלי" value={classItem.rating_min} />
            <Row label="דירוג מקסימלי" value={classItem.rating_max} />
            {classItem.notes && <Row label="הערות" value={classItem.notes} />}
          </section>

          {/* Schedule slots */}
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">מפגשים קבועים</p>
            {(classItem.slots ?? []).length === 0 ? (
              <p className="text-sm text-gray-400">אין מפגשים מוגדרים</p>
            ) : (
              <div className="space-y-1.5">
                {(classItem.slots ?? []).map((slot) => {
                  const room = rooms.find((r) => r.id === slot.room_id);
                  // Check if this slot has a conflict with another class
                  const hasConflict = conflictIds.length > 0;
                  return (
                    <div
                      key={slot.id}
                      className={`flex items-center gap-3 text-sm px-3 py-2 rounded-lg ${
                        hasConflict ? "bg-red-50 border border-red-200" : "bg-gray-50"
                      }`}
                    >
                      <span className="font-medium text-gray-700">{slot.day}</span>
                      <span className="text-gray-500">{slot.start_time}–{slot.end_time}</span>
                      <span className="text-gray-400">{room?.name ?? "ללא חדר"}</span>
                      <span className="text-xs text-gray-400">{slot.recurrence}</span>
                      {hasConflict && <span className="text-xs text-red-500 mr-auto">⚠ קונפליקט</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Resources */}
          {(classItem.resource_ids ?? []).length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ציוד נדרש</p>
              <div className="flex flex-wrap gap-2">
                {(classItem.resource_ids ?? []).map((id) => {
                  const res = resources.find((r) => r.id === id);
                  return res ? (
                    <span key={id} className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">
                      {res.name}
                    </span>
                  ) : null;
                })}
              </div>
            </section>
          )}

          {/* Enrolled students */}
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              תלמידים רשומים ({activeEnrollments.length} / {classItem.capacity})
            </p>
            {activeEnrollments.length === 0 ? (
              <p className="text-sm text-gray-400">אין תלמידים רשומים</p>
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
                      const student = students.find((s) => s.id === enr.child_id);
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
          </section>
        </div>
      </Modal>

      {confirmDelete && (
        <ConfirmDialog
          message={`למחוק את החוג "${classItem.name}"? כל הרישומים יימחקו גם כן.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

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
