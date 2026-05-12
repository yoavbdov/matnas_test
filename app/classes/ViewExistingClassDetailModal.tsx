"use client";
/*
  ViewExistingClassDetailModal — compact read-only view of a class.
  Layout: header → teacher → description → age range → rating range → weekly slots → equipment → participants link
*/
import { useState } from "react";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import Badge from "@/components/shared/Badge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import ClassEnrollmentsModal from "./ClassEnrollmentsModal";
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

// Compact label + value row
function Row({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex gap-2 py-1 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-32 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

export default function ViewExistingClassDetailModal({
  classItem, teachers, rooms, physicalEquipment, students, enrollments, allClasses, allTournaments, onClose, onEdit,
}: Props) {
  const { showToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEnrollments, setShowEnrollments] = useState(false);

  const teacher = teachers.find((t) => t.id === classItem.teacher_id);
  const activeEnrollments = enrollments.filter((e) => e.class_id === classItem.id && e.status === "פעיל");
  const conflictIds = getConflictingClassIds(classItem, allClasses);

  const statusColor =
    classItem.status === "פעיל" ? "green" :
    classItem.status === "מתוכנן" ? "blue" :
    classItem.status === "הסתיים" ? "gray" : "red";

  // Build compact age/rating range strings
  const ageRange = [classItem.age_min, classItem.age_max].filter((v) => v !== undefined).join("–") || undefined;
  const ratingRange = [classItem.rating_min, classItem.rating_max].filter((v) => v !== undefined).join("–") || undefined;

  async function handleDelete() {
    try {
      await deleteDocument("classes", classItem.id);
      await deleteWhere("enrollments", "class_id", classItem.id);
      showToast("החוג נמחק", "success");
      onClose();
    } catch {
      showToast("שגיאה, נסה שוב", "error");
    } finally {
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <Modal
        title={classItem.name}
        onClose={onClose}
        size="lg"
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
        <div className="space-y-4" dir="rtl">

          {/* Status badge + color dot */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ background: classItem.color ?? "#ccc" }} />
            <Badge label={classItem.status} color={statusColor} />
          </div>

          {/* Basic info rows */}
          <div>
            <Row label="מדריך" value={teacher ? `${teacher.first_name} ${teacher.last_name}` : undefined} />
            <Row label="תיאור" value={classItem.description} />
            <Row label="טווח גילאים" value={ageRange} />
            <Row label="טווח מד כושר" value={ratingRange} />
          </div>

          {/* Weekly slots */}
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">מפגשים שבועיים</p>
            {(classItem.slots ?? []).length === 0 ? (
              <p className="text-sm text-gray-400">אין מפגשים מוגדרים</p>
            ) : (
              <div className="space-y-1">
                {(classItem.slots ?? []).map((slot, i) => {
                  const room = rooms.find((r) => r.id === slot.room_id);
                  const hasConflict = conflictIds.length > 0;
                  return (
                    <div
                      key={slot.id ?? i}
                      className={`flex items-center gap-3 text-sm px-3 py-1.5 rounded-lg ${
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

          {/* Physical equipment */}
          {(classItem.resource_assignments ?? []).length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ציוד פיזי</p>
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
                {/* Warn if any resource is overbooked */}
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

          {/* Participants — click to open full list modal */}
          <div className="pt-1">
            <button
              onClick={() => setShowEnrollments(true)}
              className="text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2"
            >
              לרשימת המשתתפים ({activeEnrollments.length} / {classItem.capacity}) ←
            </button>
          </div>

        </div>
      </Modal>

      {/* Confirm class deletion */}
      {confirmDelete && (
        <ConfirmDialog
          message={`למחוק את החוג "${classItem.name}"? כל הרישומים יימחקו גם כן.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {/* Enrollments list modal */}
      {showEnrollments && (
        <ClassEnrollmentsModal
          classItem={classItem}
          students={students}
          enrollments={enrollments}
          onClose={() => setShowEnrollments(false)}
        />
      )}
    </>
  );
}
