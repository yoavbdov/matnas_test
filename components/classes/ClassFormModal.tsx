"use client";
import Modal from "@/components/shared/Modal";
import Field from "@/components/shared/Field";
import Btn from "@/components/shared/Btn";
import SlotEditor from "./SlotEditor";
import { CLASS_COLORS } from "@/lib/constants";
import type { Class, Teacher, Room, ScheduleSlot, AppSettings } from "@/lib/types";

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

interface Props {
  mode: "add" | "edit";
  form: Omit<Class, "id">;
  setForm: React.Dispatch<React.SetStateAction<Omit<Class, "id">>>;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  teachers: Teacher[];
  rooms: Room[];
  settings: Required<AppSettings>;
}

export default function ClassFormModal({ mode, form, setForm, saving, onClose, onSave, teachers, rooms, settings }: Props) {
  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
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

  return (
    <Modal
      title={mode === "add" ? "הוספת חוג" : "עריכת חוג"}
      onClose={onClose}
      size="xl"
      footer={<><Btn variant="secondary" onClick={onClose}>ביטול</Btn><Btn onClick={onSave} loading={saving}>שמור</Btn></>}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="שם החוג" required>
          <input className={inp} value={form.name} maxLength={settings.MAX_STRING_LENGTH} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="מדריך" required>
          <select className={inp} value={form.teacher_id} onChange={(e) => set("teacher_id", e.target.value)}>
            <option value="">— בחר מדריך —</option>
            {teachers.filter((t) => t.status === "פעיל").map((t) => (
              <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
            ))}
          </select>
        </Field>
        <Field label="קיבולת">
          <input type="number" className={inp} value={form.capacity} min={1} max={settings.MAX_ROOM_CAPACITY} onChange={(e) => set("capacity", Math.max(1, Number(e.target.value)))} />
        </Field>
        <Field label="סטטוס">
          <select className={inp} value={form.status} onChange={(e) => set("status", e.target.value as Class["status"])}>
            <option>פעיל</option><option>לא פעיל</option>
          </select>
        </Field>
        <Field label="גיל מינימלי">
          <input type="number" className={inp} value={form.age_min ?? ""} min={0} max={settings.MAX_AGE} onChange={(e) => set("age_min", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>
        <Field label="גיל מקסימלי">
          <input type="number" className={inp} value={form.age_max ?? ""} min={0} max={settings.MAX_AGE} onChange={(e) => set("age_max", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>
        <Field label="דירוג מינימלי">
          <input type="number" className={inp} value={form.rating_min ?? ""} min={0} max={settings.MAX_INT_INPUT} onChange={(e) => set("rating_min", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>
        <Field label="דירוג מקסימלי">
          <input type="number" className={inp} value={form.rating_max ?? ""} min={0} max={settings.MAX_INT_INPUT} onChange={(e) => set("rating_max", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="צבע">
          <div className="flex gap-2 mt-1">
            {CLASS_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => set("color", c)}
                className={`w-7 h-7 rounded-full border-2 transition-transform ${form.color === c ? "border-gray-700 scale-110" : "border-transparent"}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </Field>
      </div>

      <hr className="my-5 border-gray-100" />
      <SlotEditor
        slots={form.slots ?? []}
        rooms={rooms}
        onAdd={addSlot}
        onRemove={removeSlot}
        onChange={handleSlotChange}
      />

      <hr className="my-5 border-gray-100" />
      <Field label="הערות">
        <textarea className={inp} rows={3} value={form.notes ?? ""} maxLength={settings.MAX_NOTE_LENGTH} onChange={(e) => set("notes", e.target.value)} />
      </Field>
    </Modal>
  );
}
