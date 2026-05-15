// Sortable table showing all tournaments with key stats
import Badge from "@/components/shared/Badge";
import { fmtDate } from "@/lib/utils";
import { computeTournamentStatus } from "@/lib/tournamentHelpers";
import type { Tournament } from "@/lib/types";

interface Props {
  tournaments: Tournament[];
  onRowClick: (t: Tournament) => void;
}

const STATUS_COLORS: Record<Tournament["status"], "blue" | "green" | "gray" | "red"> = {
  "מתוכנן": "blue",
  "פעיל": "green",
  "הסתיים": "gray",
  "בוטל": "red",
};

// Format a Date as YYYY-MM-DD using local timezone (not UTC)
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// For recurring tournaments: find the next occurrence of the weekday from recurring_date
function nextRecurringOccurrence(recurringDate: string): string {
  // Parse the anchor date in local timezone by splitting manually
  const [y, m, d] = recurringDate.split("-").map(Number);
  const anchor = new Date(y, m - 1, d);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = anchor.getDay(); // 0=Sun … 6=Sat
  const candidate = new Date(today);
  // Advance candidate until it lands on the right weekday (today counts if same day)
  while (candidate.getDay() !== dayOfWeek) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return toLocalDateStr(candidate);
}

// Get the nearest upcoming date — next round for normal tournaments, next weekday for recurring
function nextDate(t: Tournament): string {
  if (t.is_recurring && t.recurring_date) {
    return nextRecurringOccurrence(t.recurring_date);
  }
  const today = new Date().toISOString().slice(0, 10);
  const future = t.rounds
    .filter((r) => r.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  return future[0]?.date ?? "";
}

export default function TournamentsTable({ tournaments, onRowClick }: Props) {
  if (tournaments.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">🏆</p>
        <p className="text-sm">אין תחרויות. לחץ על "תחרות חדשה" כדי להוסיף.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm" dir="rtl">
        <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
          <tr>
            <th className="px-4 py-3 text-right font-semibold">שם תחרות</th>
            <th className="px-4 py-3 text-right font-semibold">סטטוס</th>
            <th className="px-4 py-3 text-right font-semibold">סיבובים</th>
            <th className="px-4 py-3 text-right font-semibold">המועד הבא</th>
            <th className="px-4 py-3 text-right font-semibold">משתתפים</th>
            <th className="px-4 py-3 text-right font-semibold">טווח דירוג</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tournaments.map((t) => {
            const next = nextDate(t);
            const status = computeTournamentStatus(t);
            const totalPlayers = t.participant_ids.length + t.manual_participants.length;
            const ratingRange =
              t.rating_min !== undefined && t.rating_max !== undefined
                ? `${t.rating_min} – ${t.rating_max}`
                : t.rating_min !== undefined
                ? `${t.rating_min} ומעלה`
                : t.rating_max !== undefined
                ? `עד ${t.rating_max}`
                : "ללא הגבלה";

            return (
              <tr
                key={t.id}
                onClick={() => onRowClick(t)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {/* Name with color dot */}
                <td className="px-4 py-3 font-medium text-gray-800">
                  <div className="flex items-center gap-2">
                    {t.color && (
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: t.color }}
                      />
                    )}
                    {t.name}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge label={status} color={STATUS_COLORS[status]} />
                </td>
                <td className="px-4 py-3 text-gray-600">{t.rounds.length}</td>
                <td className="px-4 py-3 text-gray-600">
                  {next ? fmtDate(next) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">{totalPlayers}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{ratingRange}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
