/*
  TournamentDetailModal — compact read-only view of a tournament.
  Layout: status → judge → description → age range → rating range →
          rounds/recurrence → equipment → participants link
*/
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import Badge from "@/components/shared/Badge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import TournamentRoundsModal from "./TournamentRoundsModal";
import TournamentParticipantsModal from "./TournamentParticipantsModal";
import { isTournamentResourceOverbooked } from "@/lib/schedule/classHelpers";
import type { Tournament, Student, Teacher, PhysicalEquipment, Class } from "@/types";

interface Props {
  tournament: Tournament;
  allStudents: Student[];
  allTeachers: Teacher[];
  physicalEquipment: PhysicalEquipment[];
  allClasses: Class[];
  allTournaments: Tournament[];
  // For recurring tournaments: the specific calendar date the user clicked.
  // Enables exact-date equipment check (e.g. June 5 won't show May's conflicts).
  occurrenceDate?: string;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

// Compact label/value row — returns null if value is empty
function Row({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex gap-2 py-1 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-32 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

export default function TournamentDetailModal({
  tournament,
  allStudents,
  allTeachers,
  physicalEquipment,
  allClasses,
  allTournaments,
  occurrenceDate,
  onEdit,
  onDelete,
  onClose,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showRounds, setShowRounds] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const judge = allTeachers.find((t) => t.id === tournament.judge_id);
  const totalParticipants =
    (tournament.participant_ids ?? []).length + (tournament.manual_participants ?? []).length;
  const rounds = tournament.rounds ?? [];

  const statusColor =
    tournament.status === "פעיל" ? "green" :
    tournament.status === "מתוכנן" ? "blue" :
    tournament.status === "הסתיים" ? "gray" : "red";

  // Compact range strings — only shown if at least one bound is set
  const ageRange = [tournament.age_min, tournament.age_max]
    .filter((v) => v !== undefined).join("–") || undefined;
  const ratingRange = [tournament.rating_min, tournament.rating_max]
    .filter((v) => v !== undefined).join("–") || undefined;

  // Recurring schedule description — e.g. "יום חמישי 16:00–17:30, חדר שחמט קטן"
  const recurringLabel = tournament.is_recurring
    ? [
        tournament.recurring_date
          ? `כל ${new Date(tournament.recurring_date).toLocaleDateString("he-IL", { weekday: "long" })}`
          : undefined,
        tournament.recurring_start_time && tournament.recurring_end_time
          ? `${tournament.recurring_start_time}–${tournament.recurring_end_time}`
          : undefined,
        tournament.room || undefined,
      ]
        .filter(Boolean)
        .join(", ")
    : undefined;

  return (
    <>
      <Modal
        title={tournament.name}
        onClose={onClose}
        size="lg"
        footer={
          <div className="flex gap-2 justify-end w-full" dir="rtl">
            <Btn variant="danger" onClick={() => setConfirmDelete(true)}>מחק תחרות</Btn>
            <Btn onClick={onEdit}>עריכה</Btn>
          </div>
        }
      >
        <div className="space-y-4" dir="rtl">

          {/* Status badge + color dot */}
          <div className="flex items-center gap-2">
            {tournament.color && (
              <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ background: tournament.color }} />
            )}
            <Badge label={tournament.status} color={statusColor} />
          </div>

          {/* Basic info rows */}
          <div>
            <Row label="שופט" value={judge ? `${judge.first_name} ${judge.last_name}` : undefined} />
            <Row label="תיאור" value={tournament.description} />
            <Row label="טווח גילאים" value={ageRange} />
            <Row label="טווח מד כושר" value={ratingRange} />
          </div>

          {/* Recurring schedule — one compact line */}
          {tournament.is_recurring && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">לוח זמנים</p>
              <p className="text-sm text-gray-700">{recurringLabel || "—"}</p>
            </div>
          )}

          {/* Non-recurring: rounds count + link to rounds modal */}
          {!tournament.is_recurring && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">סיבובים</p>
              {rounds.length === 0 ? (
                <p className="text-sm text-gray-400">אין סיבובים מוגדרים</p>
              ) : (
                <Button
                  variant="link"
                  onClick={() => setShowRounds(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2 p-0 h-auto"
                >
                  {rounds.length} סיבובים מתוכננים — לחץ כאן לפרטים ←
                </Button>
              )}
            </div>
          )}

          {/* Physical equipment */}
          {(tournament.resource_assignments ?? []).length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ציוד פיזי</p>
              <div className="flex flex-wrap gap-2 items-center">
                {(tournament.resource_assignments ?? []).map((a) => {
                  const eq = physicalEquipment.find((e) => e.id === a.resource_id);
                  return (
                    <span
                      key={a.resource_id}
                      className="bg-teal-50 border border-teal-200 text-teal-800 text-xs rounded-lg px-3 py-1"
                    >
                      {eq?.name ?? a.resource_id} × {a.quantity}
                    </span>
                  );
                })}
                {/* Warn if any resource is overbooked */}
                {(tournament.resource_assignments ?? []).some((a) => {
                  const eq = physicalEquipment.find((e) => e.id === a.resource_id);
                  if (!eq) return false;
                  return isTournamentResourceOverbooked(eq, tournament, a.quantity, allClasses, allTournaments, occurrenceDate);
                }) && (
                  <span className="text-xs text-red-500 font-medium">⚠ חסר ציוד</span>
                )}
              </div>
            </section>
          )}

          {/* Participants — click to open full list modal */}
          <div className="pt-1">
            <Button
              variant="link"
              onClick={() => setShowParticipants(true)}
              className="text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2 p-0 h-auto"
            >
              כמות משתתפים: {totalParticipants} — לחץ כאן לרשימה ←
            </Button>
          </div>

        </div>
      </Modal>

      {/* Confirm deletion */}
      {confirmDelete && (
        <ConfirmDialog
          message={`למחוק את התחרות "${tournament.name}"? פעולה זו אינה הפיכה.`}
          onConfirm={onDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {/* Rounds list modal */}
      {showRounds && (
        <TournamentRoundsModal
          tournamentName={tournament.name}
          rounds={rounds}
          onClose={() => setShowRounds(false)}
        />
      )}

      {/* Participants list modal */}
      {showParticipants && (
        <TournamentParticipantsModal
          tournament={tournament}
          allStudents={allStudents}
          onClose={() => setShowParticipants(false)}
        />
      )}
    </>
  );
}
