"use client";
/*
  EventFormModal — create or edit an event.
  Step 1: choose one-time or recurring.
  Step 2: fill the relevant fields.
  Conflict warnings are shown live based on room + time overlap.
*/

import { useState, useMemo } from "react";
import Field from "@/components/shared/Field";
import { CLASS_COLORS } from "@/lib/constants";
import { getEventConflicts } from "@/lib/eventHelpers";
import EventOneTimeFields from "./EventOneTimeFields";
import EventRecurringFields from "./EventRecurringFields";
import type { Event, Class, Tournament, Room } from "@/lib/types";

interface Props {
  mode: "add" | "edit";
  event?: Event; // populated in edit mode
  allClasses: Class[];
  allTournaments: Tournament[];
  allEvents: Event[];
  rooms: Room[];
  saving: boolean;
  onClose: () => void;
  onSave: (data: Omit<Event, "id">) => void;
}

// Initial blank state for a new event
function emptyForm() {
  return {
    name: "",
    description: "",
    notes: "",
    color: CLASS_COLORS[0],
    recurrence_type: "" as "" | "חד פעמי" | "חוזר",
    // one-time
    date: "",
    // recurring
    daysOfWeek: [] as string[],
    startDate: "",
    isPermanent: false,
    endDate: "",
    // shared
    startTime: "09:00",
    endTime: "10:00",
    room: "",
  };
}

export default function EventFormModal({
  mode,
  event,
  allClasses,
  allTournaments,
  allEvents,
  rooms,
  saving,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState(() => {
    if (mode === "edit" && event) {
      return {
        name: event.name,
        description: event.description ?? "",
        notes: event.notes ?? "",
        color: event.color ?? CLASS_COLORS[0],
        recurrence_type: event.recurrence_type as "" | "חד פעמי" | "חוזר",
        date: event.date ?? "",
        daysOfWeek: event.days_of_week ?? [],
        startDate: event.start_date ?? "",
        isPermanent: event.is_permanent ?? false,
        endDate: event.end_date ?? "",
        startTime: event.start_time,
        endTime: event.end_time,
        room: event.room,
      };
    }
    return emptyForm();
  });

  function patch(update: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...update }));
  }

  // Build a draft Event object from form state (for conflict checking)
  const draft = useMemo(
    (): Omit<Event, "id"> => ({
      name: form.name,
      description: form.description || undefined,
      notes: form.notes || undefined,
      color: form.color,
      recurrence_type: form.recurrence_type as "חד פעמי" | "חוזר",
      start_time: form.startTime,
      end_time: form.endTime,
      room: form.room,
      date: form.recurrence_type === "חד פעמי" ? form.date : undefined,
      days_of_week:
        form.recurrence_type === "חוזר" ? form.daysOfWeek : undefined,
      start_date: form.recurrence_type === "חוזר" ? form.startDate : undefined,
      is_permanent:
        form.recurrence_type === "חוזר" ? form.isPermanent : undefined,
      end_date:
        form.recurrence_type === "חוזר" && !form.isPermanent
          ? form.endDate
          : undefined,
    }),
    [form],
  );

  // Live conflict detection
  const conflicts = useMemo(() => {
    if (!form.recurrence_type || !form.room) return [];
    return getEventConflicts(
      draft,
      allClasses,
      allTournaments,
      allEvents,
      rooms,
      event?.id,
    );
  }, [
    draft,
    allClasses,
    allTournaments,
    allEvents,
    rooms,
    event?.id,
    form.recurrence_type,
    form.room,
  ]);

  function handleSave() {
    if (!form.name.trim()) return;
    if (!form.recurrence_type) return;
    onSave(draft);
  }

  const title = mode === "add" ? "אירוע חדש" : "עריכת אירוע";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-5">{title}</h2>

        {/* שם האירוע */}
        <div className="space-y-4 mb-5">
          <Field label="שם האירוע" required>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="לדוגמה: טורניר פתיחת שנה"
            />
          </Field>

          <Field label="תיאור">
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              rows={2}
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="תיאור קצר (אופציונלי)"
            />
          </Field>
        </div>

        {/* בחירת סוג האירוע — שאלה ראשונה */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            האם האירוע חד-פעמי או חוזר?
          </p>
          <div className="flex gap-3">
            {(["חד פעמי", "חוזר"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => patch({ recurrence_type: type })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                  form.recurrence_type === type
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
                }`}
              >
                {type === "חד פעמי" ? "🗓 חד-פעמי" : "🔁 אירוע קבוע"}
              </button>
            ))}
          </div>
        </div>

        {/* שדות לפי סוג */}
        {form.recurrence_type === "חד פעמי" && (
          <EventOneTimeFields
            date={form.date}
            startTime={form.startTime}
            endTime={form.endTime}
            room={form.room}
            rooms={rooms}
            onChange={(p) =>
              patch({
                date: p.date ?? form.date,
                startTime: p.startTime ?? form.startTime,
                endTime: p.endTime ?? form.endTime,
                room: p.room ?? form.room,
              })
            }
          />
        )}

        {form.recurrence_type === "חוזר" && (
          <EventRecurringFields
            daysOfWeek={form.daysOfWeek}
            startDate={form.startDate}
            isPermanent={form.isPermanent}
            endDate={form.endDate}
            startTime={form.startTime}
            endTime={form.endTime}
            room={form.room}
            rooms={rooms}
            onChange={(p) =>
              patch({
                daysOfWeek: p.daysOfWeek ?? form.daysOfWeek,
                startDate: p.startDate ?? form.startDate,
                isPermanent: p.isPermanent ?? form.isPermanent,
                endDate: p.endDate ?? form.endDate,
                startTime: p.startTime ?? form.startTime,
                endTime: p.endTime ?? form.endTime,
                room: p.room ?? form.room,
              })
            }
          />
        )}

        {/* הערות */}
        {form.recurrence_type && (
          <div className="mt-4 space-y-4">
            <Field label="הערות">
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                rows={2}
                value={form.notes}
                onChange={(e) => patch({ notes: e.target.value })}
              />
            </Field>

            {/* צבע */}
            <Field label="צבע בלוח הזמנים">
              <div className="flex gap-2 flex-wrap">
                {CLASS_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => patch({ color: c })}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      form.color === c
                        ? "border-gray-800 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* אזהרות קונפליקטים */}
        {conflicts.length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-red-700 mb-1">
              ⚠️ התנגשות לוח זמנים
            </p>
            <ul className="text-sm text-red-600 space-y-0.5 list-disc list-inside">
              {conflicts.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* כפתורים */}
        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.name.trim() || !form.recurrence_type}
            className="px-5 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? "שומר..." : mode === "add" ? "צור אירוע" : "שמור שינויים"}
          </button>
        </div>
      </div>
    </div>
  );
}
