"use client";
/*
  TournamentRoundsModal — shows all planned rounds for a tournament (read-only).
  Opened from TournamentDetailModal via "לחץ כאן לסיבובים המתוכננים".
*/
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import { fmtDate } from "@/lib/utils";
import type { TournamentRound } from "@/lib/types";

interface Props {
  tournamentName: string;
  rounds: TournamentRound[];
  onClose: () => void;
}

export default function TournamentRoundsModal({ tournamentName, rounds, onClose }: Props) {
  return (
    <Modal
      title={`סיבובים — ${tournamentName}`}
      onClose={onClose}
      size="md"
      footer={<Btn variant="secondary" onClick={onClose}>סגור</Btn>}
    >
      <div dir="rtl">
        {rounds.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">אין סיבובים מוגדרים</p>
        ) : (
          <div className="space-y-1.5">
            {rounds.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5 text-sm"
              >
                <span className="font-medium text-gray-700 w-24">סיבוב {r.round_number}</span>
                <div className="flex items-center gap-4 text-gray-500 text-xs">
                  {r.date ? fmtDate(r.date) : <span className="italic">ללא תאריך</span>}
                  {r.date && <span>{r.start_time}–{r.end_time}</span>}
                  {r.location && <span>📍 {r.location}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
