"use client";
/*
  ViewExistingClassDetailModal — read-only view of a class.
  Structure mirrors TournamentDetailModal for visual consistency:
  header → description → age restrictions → rating restrictions → schedule → equipment → participants
*/
import { useState } from "react";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import Badge from "@/components/shared/Badge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { deleteDocument, deleteWhere } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import { getConflictingClassIds, isClassResourceOverbooked } from "@/lib/classHelpers";
import type { Class, Teacher, Room, PhysicalEquipment, Student, Enrollment, Tournament } from "@/lib/types";

interface Props {
  classItem: Class;
  teachers: Teacher[];
  rooms: Room[];
  physicalEquipment: PhysicalEquipment[];
  students: Student[];
  enrollments: Enrollment[];
  allClasses: Class[];
  allTournaments: Tournament[];
  onClose: () => void;
  onEdit: (c: Class) => void;
}

// Section header — same style as in tournament detail modal
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
      {children}
    </p>
  );
}

// Single label/value row
function Row({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

export default function ViewExistingClassDetailModal({
  classItem, teachers, rooms, physicalEquipment, students, enrollments, allClasses, allTournaments, onClose, onEdit,
}: Props) {
  const { showToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [unenrollTarget, setUnenrollTarget] = useState<Enrollment | null>(null);

  const teacher = teachers.find((t) => t.id === classItem.teacher_id);
  const activeEnrollments = enrollments.filter((e) => e.class_id === classItem.id && e.status === "פעיל");
  const conflictIds = getConflictingClassIds(classItem, allClasses);

  const statusColor =
    classItem.status === "פעיל" ? "green" :
    classItem.status === "מתוכנן" ? "blue" :
    classItem.status === "הסתיים" ? "gray" : "red";

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
        <div className="space-y-6" dir="rtl">

          {/* Status + color */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ background: classItem.color ?? "#ccc" }} />
            <Badge label={classItem.status} color={statusColor} />
          </div>

          {/* Role-specific field */}
          <Row label="מדריך" value={teacher ? `${teacher.first_name} ${teacher.last_name}` : undefined} />

          {/* תיאור */}
          {classItem.description && (
            <p className="text-sm text-gray-600">{classItem.description}</p>
          )}

          {/* הגבלות גיל */}
          {(classItem.age_min !== undefined || classItem.age_max !== undefined) && (
            <section>
              <SectionHeader>הגבלות גיל</SectionHeader>
              <Row label="גיל מינימלי" value={classItem.age_min} />
              <Row label="גיל מקסימלי" value={classItem.age_max} />
            </section>
          )}

          {/* הגבלות מד כושר */}
          {(classItem.rating_min !== undefined || classItem.rating_max !== undefined) && (
            <section>
              <SectionHeader>הגבלות מד כושר</SectionHeader>
              <Row label="דירוג מינימלי" value={classItem.rating_min} />
              <Row label="דירוג מקסימלי" value={classItem.rating_max} />
            </section>
          )}

          {/* מפגשים קבועים */}
          <section>
            <SectionHeader>מפגשים קבועים</SectionHeader>
            {(classItem.slots ?? []).length === 0 ? (
              <p className="text-sm text-gray-400">אין מפגשים מוגדרים</p>
            ) : (
              <div className="space-y-1.5">
                {(classItem.slots ?? []).map((slot, i) => {
                  const room = rooms.find((r) => r.id === slot.room_id);
                  const hasConflict = conflictIds.length > 0;
                  return (
                    <div
                      key={slot.id ?? i}
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

          {/* ציוד פיזי נדרש */}
          {(classItem.resource_assignments ?? []).length > 0 && (
            <section>
              <SectionHeader>ציוד פיזי נדרש</SectionHeader>
              <div className="flex flex-wrap gap-2 items-center">
                {(classItem.resource_assignments ?? []).map((a) => {
                  const res = physicalEquipment.find((r) => r.id === a.resource_id);
                  return res ? (
                    <span
                      key={a.resource_id}
                      className="bg-teal-50 border border-teal-200 text-teal-800 text-xs rounded-lg px-3 py-1"
                    >
                      {res.name} × {a.quantity}
                    </span>
                  ) : null;
                })}
                {/* Warning: resource overbooked during this class's time slots */}
                {(classItem.resource_assignments ?? []).some((a) => {
                  const res = physicalEquipment.find((r) => r.id === a.resource_id);
                  if (!res) return false;
                  return isClassResourceOverbooked(res, classItem, a.quantity, allClasses, allTournaments);
                }) && (
                  <span className="text-xs text-red-500 font-medium">⚠ חסר ציוד</span>
                )}
              </div>
            </section>
          )}

          {/* משתתפים */}
          <section>
            <SectionHeader>
              משתתפים ({activeEnrollments.length} / {classItem.capacity})
            </SectionHeader>
            {activeEnrollments.length === 0 ? (
              <p className="text-sm text-gray-400">אין שחקנים רשומים</p>
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
