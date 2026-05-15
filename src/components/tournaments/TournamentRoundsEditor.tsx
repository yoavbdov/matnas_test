/*
  TournamentRoundsEditor — manages rounds for a non-recurring tournament.
  Each round appears as a card with labeled editable fields, mirroring ClassSlotsTab.
  Auto-fill fills all rounds with 1-week intervals from a chosen anchor round.
*/
"use client";
import { useState } from "react";
import { Trash2, Wand2 } from "lucide-react";
import { autoFillRoundDates } from "@/lib/conflicts/tournamentHelpers";
import { validateTimeRange } from "@/lib/validation/validators";
import TimeSelect from "@/components/shared/TimeSelect";
import type { TournamentRound, Room } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const MAX_ROUNDS = 20;

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function makeRound(roundNumber: number): TournamentRound {
  return { id: newId(), round_number: roundNumber, date: "", start_time: "09:00", end_time: "13:00" };
}

interface Props {
  rounds: TournamentRound[];
  onChange: (rounds: TournamentRound[]) => void;
  conflictRoundIds?: Set<string>;
  allRooms: Room[];
  // Recurring fields
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
  const [autoFillApplied, setAutoFillApplied] = useState(false);
  const [startFromRound, setStartFromRound] = useState(1);

  function setRoundCount(count: number) {
    const clamped = Math.min(MAX_ROUNDS, Math.max(1, count));
    if (clamped > rounds.length) {
      const added = Array.from({ length: clamped - rounds.length }, (_, i) =>
        makeRound(rounds.length + i + 1)
      );
      onChange([...rounds, ...added]);
    } else {
      onChange(rounds.slice(0, clamped));
      if (startFromRound > clamped) setStartFromRound(1);
    }
  }

  function updateRound(id: string, patch: Partial<TournamentRound>) {
    if (patch.start_time !== undefined || patch.end_time !== undefined) {
      setAutoFillApplied(false);
    }
    onChange(rounds.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function handleAutoFill() {
    const anchorIndex = startFromRound - 1;
    const anchor = rounds[anchorIndex];
    if (!anchor?.date) return;
    onChange(
      autoFillRoundDates(rounds, anchor.date, anchor.start_time, anchor.end_time, anchor.location, anchorIndex)
    );
    setAutoFillApplied(true);
  }

  const showAutoFill = rounds.length > 1 && !!rounds[0]?.date;
  const roundsWithDate = rounds.filter((r) => !!r.date);

  return (
    <div className="space-y-4" dir="rtl">

      {/* Recurring toggle */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
        <Checkbox
          id="is_recurring"
          checked={isRecurring}
          onCheckedChange={(checked) => onRecurringChange({ is_recurring: !!checked })}
          className="w-4 h-4"
        />
        <label htmlFor="is_recurring" className="text-sm font-medium text-blue-800 cursor-pointer">
          תחרות חוזרת — מתקיימת באופן קבוע (ללא סיבובים מוגדרים)
        </label>
      </div>

      {/* Recurring mode */}
      {isRecurring && (
        <div className="grid grid-cols-2 gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">תאריך</label>
            <Input
              type="date"
              className="w-full h-9 text-sm"
              value={recurringDate ?? ""}
              onChange={(e) => onRecurringChange({ recurring_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">שעת התחלה</label>
            <TimeSelect className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 bg-white" value={recurringStartTime ?? "09:00"} onChange={(v) => onRecurringChange({ recurring_start_time: v })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">שעת סיום</label>
            <TimeSelect className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 bg-white" value={recurringEndTime ?? "13:00"} onChange={(v) => onRecurringChange({ recurring_end_time: v })} />
          </div>
          {validateTimeRange(recurringStartTime ?? "09:00", recurringEndTime ?? "13:00") && (
            <p className="col-span-2 text-xs text-red-500">שעת הסיום חייבת להיות אחרי שעת ההתחלה</p>
          )}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">חדר / אולם</label>
            <Select
              value={recurringRoom || "__none__"}
              onValueChange={(v: string) => onRecurringChange({ room: v === "__none__" ? "" : v })}
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— ללא חדר —</SelectItem>
                {allRooms.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {r.name}{r.number ? ` (${r.number})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Normal rounds mode */}
      {!isRecurring && (
        <>
          {/* Round count + auto-fill on same row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">מספר סיבובים:</label>
              <Input
                type="number"
                min={1}
                max={MAX_ROUNDS}
                value={rounds.length}
                onChange={(e) => setRoundCount(Number(e.target.value))}
                className="w-16 h-8 text-sm text-center"
              />
            </div>

            {/* Auto-fill — compact inline pill */}
            {showAutoFill && (
              <div className="flex items-center gap-2 mr-auto">
                <Select
                  value={String(startFromRound)}
                  onValueChange={(v: string) => { setStartFromRound(Number(v)); setAutoFillApplied(false); }}
                >
                  <SelectTrigger className="h-8 text-xs px-2 bg-white text-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roundsWithDate.map((r) => (
                      <SelectItem key={r.id} value={String(r.round_number)}>
                        מסיבוב {r.round_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAutoFill}
                  disabled={autoFillApplied}
                  title={autoFillApplied ? "בוצע מילוי — שנה שעה כדי לאפשר שוב" : "מלא תאריכים בהפרש שבוע"}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 h-8 rounded-lg border transition-colors ${
                    autoFillApplied
                      ? "text-gray-400 border-gray-200 bg-white cursor-not-allowed"
                      : "text-teal-700 border-teal-300 bg-teal-50 hover:bg-teal-100"
                  }`}
                >
                  <Wand2 size={13} />
                  מלא אוטומטית
                </Button>
              </div>
            )}
          </div>

          {/* Round rows — one compact line per round */}
          <div className="space-y-2">
            {rounds.map((round) => {
              const hasConflict = conflictRoundIds?.has(round.id);
              const timeErr = validateTimeRange(round.start_time, round.end_time);
              return (
                <div key={round.id} className="space-y-1">
                  <div
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 bg-gray-50 border ${
                      hasConflict ? "border-red-300" : "border-gray-100"
                    }`}
                  >
                    {/* Round number label */}
                    <span className="text-xs font-semibold text-gray-400 w-12 shrink-0">
                      סיבוב {round.round_number}
                    </span>

                    {/* תאריך */}
                    <Input
                      type="date"
                      className="w-32 h-7 text-xs shrink-0"
                      value={round.date}
                      onChange={(e) => updateRound(round.id, { date: e.target.value })}
                    />

                    {/* שעת התחלה – שעת סיום */}
                    <TimeSelect
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:border-teal-400 w-20 shrink-0"
                      value={round.start_time}
                      onChange={(v) => updateRound(round.id, { start_time: v })}
                    />
                    <span className="text-gray-400 text-xs shrink-0">–</span>
                    <TimeSelect
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:border-teal-400 w-20 shrink-0"
                      value={round.end_time}
                      onChange={(v) => updateRound(round.id, { end_time: v })}
                    />

                    {/* חדר */}
                    <Select
                      value={round.location || "__none__"}
                      onValueChange={(v: string) => updateRound(round.id, { location: v === "__none__" ? "" : v })}
                    >
                      <SelectTrigger className="flex-1 min-w-0 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— חדר —</SelectItem>
                        {allRooms.map((r) => (
                          <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {hasConflict && <span className="text-red-500 text-xs shrink-0">⚠</span>}

                    {/* Remove */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const updated = rounds
                          .filter((r) => r.id !== round.id)
                          .map((r, i) => ({ ...r, round_number: i + 1 }));
                        onChange(updated);
                      }}
                      className="text-red-300 hover:text-red-500 shrink-0 h-6 w-6"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                  {timeErr && (
                    <p className="text-xs text-red-500 px-3">שעת הסיום חייבת להיות אחרי שעת ההתחלה</p>
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
