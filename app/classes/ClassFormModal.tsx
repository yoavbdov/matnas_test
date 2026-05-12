"use client";
// טופס הוספה/עריכה של חוג — שדות, מפגשים, ציוד, תלמידים
import { useState } from "react";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import ClassBasicFields from "./ClassBasicFields";
import ClassScheduleSlots from "./ClassScheduleSlots";
import ClassResources from "./ClassResources";
import ClassEnrollmentPanel from "./ClassEnrollmentPanel";
import { CLASS_COLORS } from "@/lib/constants";
import type {
  Class,
  Teacher,
  Room,
  PhysicalEquipment,
  ScheduleSlot,
  AppSettings,
  ResourceAssignment,
  Tournament,
  Student,
  Enrollment,
} from "@/lib/types";

type FormData = Omit<Class, "id">;

// Enrollment changes to apply on save
export interface EnrollmentChanges {
  toAdd: string[];       // student IDs to enroll
  toRemove: string[];    // enrollment document IDs to delete
}

interface Props {
  mode: "add" | "edit";
  classItem: Class | null;
  teachers: Teacher[];
  rooms: Room[];
  physicalEquipment: PhysicalEquipment[];
  students: Student[];
  enrollments: Enrollment[];
  allClasses: Class[];
  allTournaments: Tournament[];
  settings: Required<AppSettings>;
  saving: boolean;
  onClose: () => void;
  onSave: (form: FormData, enrollmentChanges: EnrollmentChanges) => void;
}

function emptyForm(): FormData {
  return {
    name: "",
    description: "",
    teacher_id: "",
    capacity: 10,
    status: "מתוכנן",
    color: CLASS_COLORS[0],
    slots: [],
    resource_assignments: [],
  };
}

export default function ClassFormModal({
  mode,
  classItem,
  teachers,
  rooms,
  physicalEquipment,
  students,
  enrollments,
  allClasses,
  allTournaments,
  settings,
  saving,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<FormData>(() =>
    classItem
      ? { ...classItem, slots: [...(classItem.slots ?? [])], resource_assignments: [...(classItem.resource_assignments ?? [])] }
      : emptyForm()
  );

  // Pending enrollment changes — applied when the user clicks Save
  const [pendingAdd, setPendingAdd] = useState<string[]>([]);
  const [pendingRemove, setPendingRemove] = useState<string[]>([]);

  const assignments: ResourceAssignment[] = form.resource_assignments ?? [];
  function setAssignments(next: ResourceAssignment[]) {
    setForm((f) => ({ ...f, resource_assignments: next }));
  }

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSlotChange(idx: number, patch: Partial<ScheduleSlot>) {
    setForm((f) => {
      const slots = [...(f.slots ?? [])];
      slots[idx] = { ...slots[idx], ...patch };
      return { ...f, slots };
    });
  }

  function addSlot() {
    // Use local date (not toISOString which is UTC and can shift the date in Israel UTC+3)
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    // Derive day name from local date so slot.day and start_date are always in sync
    const HDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    const todayDay = HDAYS[now.getDay()];

    setForm((f) => ({
      ...f,
      slots: [
        ...(f.slots ?? []),
        {
          id: crypto.randomUUID(),
          day: todayDay,
          start_time: "16:00",
          end_time: "17:00",
          room_id: "",
          recurrence: "שבועי",
          start_date: localDate,
        },
      ],
    }));
  }

  function removeSlot(idx: number) {
    setForm((f) => ({
      ...f,
      slots: (f.slots ?? []).filter((_, i) => i !== idx),
    }));
  }

  // Enrollment handlers
  function handleAddStudent(studentId: string) {
    setPendingAdd((prev) => [...prev, studentId]);
  }

  function handleRemoveEnrollment(enrollmentId: string) {
    setPendingRemove((prev) => [...prev, enrollmentId]);
  }

  function handleUndoAdd(studentId: string) {
    setPendingAdd((prev) => prev.filter((id) => id !== studentId));
  }

  function handleSave() {
    onSave(form, { toAdd: pendingAdd, toRemove: pendingRemove });
  }

  return (
    <Modal
      title={mode === "add" ? "הוספת חוג" : "עריכת חוג"}
      onClose={onClose}
      size="xl"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>ביטול</Btn>
          <Btn onClick={handleSave} loading={saving}>שמור</Btn>
        </>
      }
    >
      <ClassBasicFields
        form={form}
        teachers={teachers}
        settings={settings}
        onChange={set}
      />

      <hr className="my-5 border-gray-100" />
      <ClassScheduleSlots
        slots={form.slots ?? []}
        rooms={rooms}
        allClasses={allClasses}
        allTournaments={allTournaments}
        teacherId={form.teacher_id}
        currentClassId={classItem?.id}
        onAdd={addSlot}
        onRemove={removeSlot}
        onChange={handleSlotChange}
      />

      <hr className="my-5 border-gray-100" />
      <ClassResources
        assignments={assignments}
        physicalEquipment={physicalEquipment}
        allClasses={allClasses}
        allTournaments={allTournaments}
        currentClassId={classItem?.id}
        currentClassSlots={form.slots ?? []}
        onChange={setAssignments}
      />

      <hr className="my-5 border-gray-100" />
      {/* Enrollment section — add/remove students with conflict warnings */}
      <ClassEnrollmentPanel
        students={students}
        allEnrollments={enrollments}
        allClasses={allClasses}
        allTournaments={allTournaments}
        formSlots={form.slots ?? []}
        currentClassId={classItem?.id}
        pendingAdd={pendingAdd}
        pendingRemove={pendingRemove}
        onAddStudent={handleAddStudent}
        onRemoveEnrollment={handleRemoveEnrollment}
        onUndoAdd={handleUndoAdd}
      />

      <hr className="my-5 border-gray-100" />
      <div>
        <label className="text-xs font-medium text-gray-600">הערות</label>
        <textarea
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
          rows={3}
          value={form.notes ?? ""}
          maxLength={settings.MAX_NOTE_LENGTH}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>
    </Modal>
  );
}
