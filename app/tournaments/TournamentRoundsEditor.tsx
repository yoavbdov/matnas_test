/*
  Manage rounds for a tournament:
  - Toggle: "recurring tournament" — when on, show only date+time instead of rounds
  - Set number of rounds (1–20)
  - Each round: date, start time, end time, location, notes
  - "Auto-fill" button: fills all rounds with 1-week intervals from round 1
  - Inline editing per round (expand/collapse)
*/
"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Wand2 } from "lucide-react";
import { autoFillRoundDates } from "@/lib/tournamentHelpers";
import TimeSelect from "@/components/shared/TimeSelect";
import type { TournamentRound, Room } from "@/lib/types";

interface Props {
  rounds: TournamentRound[];
  onChange: (rounds: TournamentRound[]) => void;
  conflictRoundIds?: Set<string>; // round IDs with scheduling conflicts
  allRooms: Room[];
  // Recurring fields — passed from parent form
  isRecurring: boolean;
  recurringDate?: string;
  recurringStartTime?: string;
  recurringEndTime?: string;
  recurringRoom?: string;
  onRecurringChange: (patch: {
    is_recurring?: boolean;
    recurring_date?: string;
    recurring_start_time?: string;
    recurring_end_time?: string;
    room?: string;
  }) => void;
}

const MAX_ROUNDS = 20;

// Small reusable room dropdown used in both recurring and per-round contexts
function RoomSelect({
  allRooms,
  value,
  onChange,
}: {
  allRooms: Room[];
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <select
      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">— ללא חדר —</option>
      {allRooms.map((r) => (
        <option key={r.id} value={r.name}>
          {r.name}
          {r.number ? ` (${r.number})` : ""}
        </option>
      ))}
    </select>
  );
}

// Generate a stable unique ID for a new round
function newId() {
  return Math.random().toString(36).slice(2, 10);
}

// Build a default round object for a given round number
function makeRound(roundNumber: number): TournamentRound {
  return { id: newId(), round_number: roundNumber, date: "", start_time: "09:00", end_time: "13:00" };
}

export default function TournamentRoundsEditor({
  rounds,
  onChange,
  conflictRoundIds,
  allRooms,
  isRecurring,
  recurringDate,
  recurringStartTime,
  recurringEndTime,
  recurringRoom,
  onRecurringChange,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Track whether auto-fill was already applied; reset when a round time is manually changed
  const [autoFillApplied, setAutoFillApplied] = useState(false);
  // 1-based round number to start auto-fill from (default: round 1)
  const [startFromRound, setStartFromRound] = useState(1);

  // Change the total number of rounds — add or remove from the end
  function setRoundCount(count: number) {
    const clamped = Math.min(MAX_ROUNDS, Math.max(1, count));
    if (clamped > rounds.length) {
      const added = Array.from({ length: clamped - rounds.length }, (_, i) =>
        makeRound(rounds.length + i + 1)
      );
      onChange([...rounds, ...added]);
    } else {
      onChange(rounds.slice(0, clamped));
      // Reset start-from if the selected round was removed
      if (startFromRound > clamped) setStartFromRound(1);
    }
  }

  // Update a single field on a single round.
  // If the user changes a time field, unlock the auto-fill button.
  function updateRound(id: string, patch: Partial<TournamentRound>) {
    if (patch.start_time !== undefined || patch.end_time !== undefined) {
      setAutoFillApplied(false);
    }
    onChange(rounds.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  // Auto-fill rounds starting from `startFromRound` with 1-week intervals.
  // The anchor round must have a date; rounds before it are left untouched.
  function handleAutoFill() {
    const anchorIndex = startFromRound - 1; // convert 1-based to 0-based
    const anchor = rounds[anchorIndex];
    if (!anchor?.date) return;
    onChange(
      autoFillRoundDates(
        rounds,
        anchor.date,
        anchor.start_time,
        anchor.end_time,
        anchor.location,
        anchorIndex
      )
    );
    setAutoFillApplied(true); // lock button until user manually changes a time
  }

  // Show auto-fill button only when round 1 has a date and there are multiple rounds
  const showAutoFill = rounds.length > 1 && !!rounds[0]?.date;

  // Rounds that have a date filled — valid choices for "start from"
  const roundsWithDate = rounds.filter((r) => !!r.date);

  return (
    <div className="space-y-4" dir="rtl">

      {/* Recurring toggle — moved here from Basic Fields */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
        <input
          type="checkbox"
          id="is_recurring"
          checked={isRecurring}
          onChange={(e) => onRecurringChange({ is_recurring: e.target.checked })}
          className="w-4 h-4 accent-blue-600"
        />
        <label htmlFor="is_recurring" className="text-sm font-medium text-blue-800 cursor-pointer">
          תחרות חוזרת — מתקיימת באופן קבוע (ללא סיבובים מוגדרים)
        </label>
      </div>

      {/* Recurring mode: show date, time, and room */}
      {isRecurring && (
        <div className="grid grid-cols-2 gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">תאריך</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              value={recurringDate ?? ""}
              onChange={(e) => onRecurringChange({ recurring_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">שעת התחלה</label>
            <TimeSelect
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              value={recurringStartTime ?? "09:00"}
              onChange={(v) => onRecurringChange({ recurring_start_time: v })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">שעת סיום</label>
            <TimeSelect
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              value={recurringEndTime ?? "13:00"}
              onChange={(v) => onRecurringChange({ recurring_end_time: v })}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">חדר / אולם</label>
            <RoomSelect
              allRooms={allRooms}
              value={recurringRoom ?? ""}
              onChange={(val) => onRecurringChange({ room: val })}
            />
          </div>
        </div>
      )}

      {/* Normal rounds mode */}
      {!isRecurring && (
      <>
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">מספר סיבובים:</label>
        <input
          type="number"
          min={1}
          max={MAX_ROUNDS}
          value={rounds.length}
          onChange={(e) => setRoundCount(Number(e.target.value))}
          className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-center"
        />
        <span className="text-xs text-gray-400">(מקסימום {MAX_ROUNDS})</span>
      </div>

      {/* Auto-fill controls — appear after round 1 has a date */}
      {showAutoFill && (
        <div className="flex flex-wrap items-center gap-3 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">

          {/* "Start from round X" selector — only shows rounds that already have a date */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-teal-800 font-medium whitespace-nowrap">החל מסיבוב:</label>
            <select
              className="border border-teal-300 rounded-lg px-2 py-1 text-sm bg-white"
              value={startFromRound}
              onChange={(e) => {
                setStartFromRound(Number(e.target.value));
                setAutoFillApplied(false); // reset lock when anchor changes
              }}
            >
              {roundsWithDate.map((r) => (
                <option key={r.id} value={r.round_number}>
                  סיבוב {r.round_number} ({r.date})
                </option>
              ))}
            </select>
          </div>

          {/* The fill button itself */}
          <button
            type="button"
            onClick={handleAutoFill}
            disabled={autoFillApplied}
            title={autoFillApplied ? "כבר בוצע מילוי אוטומטי — שנה שעה של סיבוב כדי לאפשר שוב" : undefined}
            className={`flex items-center gap-2 text-sm font-medium border rounded-lg px-3 py-1.5 transition-colors ${
              autoFillApplied
                ? "text-gray-400 border-gray-200 bg-white cursor-not-allowed"
                : "text-teal-700 hover:text-teal-800 border-teal-400 bg-white hover:bg-teal-100"
            }`}
          >
            <Wand2 size={15} />
            מלא אוטומטית — הפרש שבוע
          </button>
        </div>
      )}

      {/* List of rounds */}
      <div className="space-y-2" dir="rtl">
        {rounds.map((round) => {
          const isExpanded = expandedId === round.id;
          const hasConflict = conflictRoundIds?.has(round.id);

          return (
            <div
              key={round.id}
              className={`border rounded-lg overflow-hidden ${
                hasConflict ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
              }`}
            >
              {/* Round header — click to expand/collapse */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : round.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700">סיבוב {round.round_number}</span>
                  {round.date && (
                    <span className="text-gray-500">
                      {round.date} • {round.start_time}–{round.end_time}
                    </span>
                  )}
                  {!round.date && <span className="text-gray-400 italic">ללא תאריך</span>}
                  {hasConflict && (
                    <span className="text-red-600 font-bold text-xs">⚠ התנגשות</span>
                  )}
                </div>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {/* Expanded round editor */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-100 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">תאריך</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                      value={round.date}
                      onChange={(e) => updateRound(round.id, { date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">חדר / אולם</label>
                    <RoomSelect
                      allRooms={allRooms}
                      value={round.location ?? ""}
                      onChange={(val) => updateRound(round.id, { location: val })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">שעת התחלה</label>
                    <TimeSelect
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                      value={round.start_time}
                      onChange={(v) => updateRound(round.id, { start_time: v })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">שעת סיום</label>
                    <TimeSelect
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                      value={round.end_time}
                      onChange={(v) => updateRound(round.id, { end_time: v })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">הערות לסיבוב</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                      value={round.notes ?? ""}
                      onChange={(e) => updateRound(round.id, { notes: e.target.value })}
                      placeholder="הערות (אופציונלי)"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </>
      )}
    </div>
  );
}
