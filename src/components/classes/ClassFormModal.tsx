"use client";
/*
  ClassFormModal — create or edit a class.
  Tabs: פרטים / מפגשים / תלמידים
  Mirrors the structure of TournamentFormModal for visual consistency.
*/
import { useState } from "react";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import ClassBasicFields from "./ClassBasicFields";
import ClassResources from "./ClassResources";
import ClassSlotsTab from "./ClassSlotsTab";
import ClassStudentsTab from "./ClassStudentsTab";
import { CLASS_COLORS } from "@/lib/constants";
import { LIMITS } from "@/lib/validators";
import { DEFAULT_SETTINGS } from "@/lib/config";
import type {
  Class,
  Teacher,
  Room,
  PhysicalEquipment,
  ScheduleSlot,
  ResourceAssignment,
  Tournament,
  Student,
  Enrollment,
} from "@/types";

type FormData = Omit<Class, "id">;

// Enrollment changes to apply on save
export interface EnrollmentChanges {
  toAdd: string[];    // student IDs to enroll
  toRemove: string[]; // enrollment document IDs to delete
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
  settings: typeof DEFAULT_SETTINGS;
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
  const [tab, setTab] = useState<"פרטים" | "מפגשים" | "תלמידים">("פרטים");
  const [form, setForm] = useState<FormData>(() =>
    classItem
      ? {
          ...classItem,
          slots: [...(classItem.slots ?? [])],
          resource_assignments: [...(classItem.resource_assignments ?? [])],
        }
      : emptyForm()
  );

  // Pending enrollment changes — applied on save
  const [pendingAdd, setPendingAdd] = useState<string[]>([]);
  const [pendingRemove, setPendingRemove] = useState<string[]>([]);

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function setSlots(slots: ScheduleSlot[]) {
    setForm((f) => ({ ...f, slots }));
  }

  function setAssignments(next: ResourceAssignment[]) {
    setForm((f) => ({ ...f, resource_assignments: next }));
  }

  function handleSave() {
    onSave(form, { toAdd: pendingAdd, toRemove: pendingRemove });
  }

  const tabs = ["פרטים", "מפגשים", "תלמידים"] as const;

  return (
    <Modal
      title={mode === "add" ? "הוספת חוג" : `עריכת חוג — ${classItem?.name}`}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full gap-3" dir="rtl">
          <div className="flex gap-2 mr-auto">
            <Btn variant="ghost" onClick={onClose} disabled={saving}>ביטול</Btn>
            <Btn onClick={handleSave} loading={saving} disabled={!form.name.trim()}>
              {mode === "add" ? "צור חוג" : "שמור שינויים"}
            </Btn>
          </div>
        </div>
      }
    >
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-5" dir="rtl">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t
                ? "border-b-2 border-teal-600 text-teal-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="h-105 overflow-y-auto">

        {tab === "פרטים" && (
          <div className="space-y-5" dir="rtl">
            {/* Name, instructor, description, ratings, age, capacity, color */}
            <ClassBasicFields
              form={form}
              teachers={teachers}
              settings={settings}
              onChange={set}
            />

            <hr className="border-gray-100" />

            {/* Equipment */}
            <ClassResources
              assignments={form.resource_assignments ?? []}
              physicalEquipment={physicalEquipment}
              allClasses={allClasses}
              allTournaments={allTournaments}
              currentClassId={classItem?.id}
              currentClassSlots={form.slots ?? []}
              onChange={setAssignments}
            />

            <hr className="border-gray-100" />

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-gray-600">הערות</label>
              <textarea
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 resize-none"
                rows={3}
                value={form.notes ?? ""}
                maxLength={LIMITS.NOTES}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
          </div>
        )}

        {tab === "מפגשים" && (
          <ClassSlotsTab
            slots={form.slots ?? []}
            rooms={rooms}
            allClasses={allClasses}
            allTournaments={allTournaments}
            teacherId={form.teacher_id}
            currentClassId={classItem?.id}
            onChange={setSlots}
          />
        )}

        {tab === "תלמידים" && (
          <ClassStudentsTab
            className={form.name}
            students={students}
            allEnrollments={enrollments}
            allClasses={allClasses}
            allTournaments={allTournaments}
            formSlots={form.slots ?? []}
            currentClassId={classItem?.id}
            pendingAdd={pendingAdd}
            pendingRemove={pendingRemove}
            onAddStudent={(id) => setPendingAdd((p) => [...p, id])}
            onRemoveEnrollment={(enrollId) => setPendingRemove((p) => [...p, enrollId])}
            onUndoAdd={(id) => setPendingAdd((p) => p.filter((x) => x !== id))}
          />
        )}
      </div>
    </Modal>
  );
}
