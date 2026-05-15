"use client";
// תצוגת פרטי אירוע (קריאה בלבד) — עם כפתורי עריכה ומחיקה
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatRecurringEventSummary } from "@/lib/conflicts/eventHelpers";
import { DAYS } from "@/lib/config/constants";
import type { Event } from "@/types";

interface Props {
  event: Event;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

// שורת מידע בסיסית לתצוגה
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-500 min-w-28 shrink-0">{label}:</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}

export default function EventDetailModal({
  event,
  onEdit,
  onDelete,
  onClose,
}: Props) {
  // שלב אישור מחיקה — כדי למנוע מחיקה בטעות
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isRecurring = event.recurrence_type === "חוזר";

  // הצג את הימים לפי הסדר
  const sortedDays = (event.days_of_week ?? [])
    .slice()
    .sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b))
    .join(", ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        {/* כותרת + צבע */}
        <div className="flex items-center gap-3 mb-5">
          {event.color && (
            <span
              className="w-4 h-4 rounded-full shrink-0"
              style={{ background: event.color }}
            />
          )}
          <h2 className="text-xl font-bold text-gray-800">{event.name}</h2>
        </div>

        {/* פרטים */}
        <div className="space-y-2.5 mb-6">
          <InfoRow
            label="סוג"
            value={isRecurring ? "אירוע אירוע קבוע" : "אירוע חד-פעמי"}
          />

          {/* חד פעמי */}
          {!isRecurring && <InfoRow label="תאריך" value={event.date} />}

          {/* חוזר */}
          {isRecurring && (
            <>
              <InfoRow label="ימים" value={sortedDays || "—"} />
              <InfoRow label="מתאריך" value={event.start_date} />
              <InfoRow
                label="עד תאריך"
                value={
                  event.is_permanent ? "ללא הגבלה (תמידי)" : event.end_date
                }
              />
            </>
          )}

          <InfoRow
            label="שעות"
            value={`${event.start_time} – ${event.end_time}`}
          />
          <InfoRow label="חדר" value={event.room} />
          <InfoRow label="תיאור" value={event.description} />
          <InfoRow label="הערות" value={event.notes} />
        </div>

        {/* תקציר (רק לחוזר) */}
        {isRecurring && (
          <p className="text-xs text-gray-400 mb-5 bg-gray-50 rounded-lg px-3 py-2">
            {formatRecurringEventSummary(event)}
          </p>
        )}

        {/* אישור מחיקה */}
        {confirmingDelete && (
          <div
            className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700"
            dir="rtl"
          >
            <p className="font-semibold mb-2">
              האם למחוק את האירוע "{event.name}"?
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={onDelete}
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700 text-xs"
              >
                כן, מחק
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmingDelete(false)}
                className="border-red-300 text-red-700 hover:bg-red-100 text-xs"
              >
                ביטול
              </Button>
            </div>
          </div>
        )}

        {/* כפתורים */}
        <div className="flex gap-3 justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmingDelete(true)}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            מחק
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              סגור
            </Button>
            <Button
              type="button"
              onClick={onEdit}
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              ערוך
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
