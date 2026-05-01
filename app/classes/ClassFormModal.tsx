"use client";
// טופס הוספה/עריכה של חוג — מורכב משלושה חלקים: שדות בסיסיים, מפגשים, ציוד
import { useState } from "react";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import ClassBasicFields from "./ClassBasicFields";
import ClassScheduleSlots from "./ClassScheduleSlots";
import ClassResources from "./ClassResources";
import { CLASS_COLORS } from "@/lib/constants";
import type { Class, Teacher, Room, Resource, ScheduleSlot, AppSettings } from "@/lib/types";

interface Assignment { resource_id: string; quantity: number; }

// Build a flat resource_ids array from assignments (just the IDs)
function toResourceIds(assignments: Assignment[]): string[] {
  return assignments.map((a) => a.resource_id);
}

// Build assignments list from a class's resource_ids
function fromResourceIds(ids: string[]): Assignment[] {
  return ids.map((id) => ({ resource_id: id, quantity: 1 }));
}

type FormData = Omit<Class, "id">;

interface Props {
  mode: "add" | "edit";
  classItem: Class | null;   // null = add mode
  teachers: Teacher[];
  rooms: Room[];
  resources: Resource[];
  allClasses: Class[];
  settings: Required<AppSettings>;
  saving: boolean;
  onClose: () => void;
  onSave: (form: FormData) => void;
}

function emptyForm(): FormData {
  return {
    name: "", teacher_id: "", capacity: 10,
    status: "פעיל", color: CLASS_COLORS[0], slots: [], resource_ids: [],
  };
}

export default function ClassFormModal({
  mode, classItem, teachers, rooms, resources, allClasses, settings, saving, onClose, onSave,
}: Props) {
  const [form, setForm] = useState<FormData>(() =>
    classItem
      ? { ...classItem, slots: [...(classItem.slots ?? [])], resource_ids: [...(classItem.resource_ids ?? [])] }
      : emptyForm()
  );

  // Track resource assignments separately (includes quantity per assignment)
  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    fromResourceIds(classItem?.resource_ids ?? [])
  );

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
    setForm((f) => ({
      ...f,
      slots: [...(f.slots ?? []), {
        id: crypto.randomUUID(), day: "ראשון",
        start_time: "16:00", end_time: "17:00",
        room_id: "", recurrence: "שבועי",
        start_date: new Date().toISOString().slice(0, 10),
      }],
    }));
  }

  function removeSlot(idx: number) {
    setForm((f) => ({ ...f, slots: (f.slots ?? []).filter((_, i) => i !== idx) }));
  }

  function handleSave() {
    onSave({ ...form, resource_ids: toResourceIds(assignments) });
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
      <ClassBasicFields form={form} teachers={teachers} settings={settings} onChange={set} />

      <hr className="my-5 border-gray-100" />
      <ClassScheduleSlots
        slots={form.slots ?? []}
        rooms={rooms}
        allClasses={allClasses}
        currentClassId={classItem?.id}
        onAdd={addSlot}
        onRemove={removeSlot}
        onChange={handleSlotChange}
      />

      <hr className="my-5 border-gray-100" />
      <ClassResources
        assignments={assignments}
        resources={resources}
        allClasses={allClasses}
        currentClassId={classItem?.id}
        onChange={setAssignments}
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
