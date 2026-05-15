// טבלת אירועים — מציגה כל האירועים עם פרטים בסיסיים
import type { Event } from "@/types";
import { formatRecurringEventSummary } from "@/lib/conflicts/eventHelpers";

interface Props {
  events: Event[];
  onRowClick: (event: Event) => void;
}

export default function EventsTable({ events, onRowClick }: Props) {
  if (events.length === 0) {
    return (
      <div className="text-center text-gray-400 py-16 text-sm">
        אין אירועים להצגה
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-xl border border-gray-200"
      dir="rtl"
    >
      <table className="w-full text-sm text-right">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3">שם</th>
            <th className="px-4 py-3">סוג</th>
            <th className="px-4 py-3">תאריך / ימים</th>
            <th className="px-4 py-3">שעות</th>
            <th className="px-4 py-3">חדר</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {events.map((ev) => (
            <tr
              key={ev.id}
              onClick={() => onRowClick(ev)}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {/* שם + צבע */}
              <td className="px-4 py-3 font-medium text-gray-800">
                <div className="flex items-center gap-2">
                  {ev.color && (
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: ev.color }}
                    />
                  )}
                  {ev.name}
                </div>
              </td>

              {/* סוג */}
              <td className="px-4 py-3 text-gray-500">
                {ev.recurrence_type === "חד פעמי" ? "חד-פעמי" : "אירוע קבוע"}
              </td>

              {/* תאריך / ימים */}
              <td className="px-4 py-3 text-gray-600 max-w-xs">
                {ev.recurrence_type === "חד פעמי"
                  ? (ev.date ?? "—")
                  : formatRecurringEventSummary(ev)}
              </td>

              {/* שעות */}
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {ev.start_time} – {ev.end_time}
              </td>

              {/* חדר */}
              <td className="px-4 py-3 text-gray-600">{ev.room || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
