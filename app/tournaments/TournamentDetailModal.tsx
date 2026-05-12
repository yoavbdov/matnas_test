/*
  TournamentDetailModal — read-only view of a tournament.
  Structure mirrors ViewExistingClassDetailModal for visual consistency:
  header → description → age restrictions → rating restrictions → rounds → equipment → participants
*/
"use client";
import { useState } from "react";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import Badge from "@/components/shared/Badge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { fmtDate } from "@/lib/utils";
import { isTournamentResourceOverbooked } from "@/lib/classHelpers";
import type { Tournament, Student, Teacher, PhysicalEquipment, Class } from "@/lib/types";

interface Props {
  tournament: Tournament;
  allStudents: Student[];
  allTeachers: Teacher[];
  physicalEquipment: PhysicalEquipment[];
  allClasses: Class[];
  allTournaments: Tournament[];
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

// Section header — same style as in class detail modal
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
      {children}
    </p>
  );
}

// Single label/value row
function Row({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-36 shrink-0">{label}</span>
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
  onEdit,
  onDelete,
  onClose,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const participantIds = tournament.participant_ids ?? [];
  const manualParticipants = tournament.manual_participants ?? [];
  const rounds = tournament.rounds ?? [];
  const totalParticipants = participantIds.length + manualParticipants.length;

  const registeredStudents = participantIds
    .map((id) => allStudents.find((s) => s.id === id))
    .filter(Boolean) as Student[];

  const judge = allTeachers.find((t) => t.id === tournament.judge_id);

  const statusColor =
    tournament.status === "פעיל" ? "green" :
    tournament.status === "מתוכנן" ? "blue" :
    tournament.status === "הסתיים" ? "gray" : "red";

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
        <div className="space-y-6" dir="rtl">

          {/* Status + color */}
          <div className="flex items-center gap-2">
            {tournament.color && (
              <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ background: tournament.color }} />
            )}
            <Badge label={tournament.status} color={statusColor} />
          </div>

          {/* Role-specific field */}
          <Row label="שופט" value={judge ? `${judge.first_name} ${judge.last_name}` : undefined} />

          {/* תיאור */}
          {tournament.description && (
            <p className="text-sm text-gray-600">{tournament.description}</p>
          )}

          {/* הגבלות גיל */}
          {(tournament.age_min !== undefined || tournament.age_max !== undefined) && (
            <section>
              <SectionHeader>הגבלות גיל</SectionHeader>
              <Row label="גיל מינימלי" value={tournament.age_min} />
              <Row label="גיל מקסימלי" value={tournament.age_max} />
            </section>
          )}

          {/* הגבלות מד כושר */}
          {(tournament.rating_min !== undefined || tournament.rating_max !== undefined) && (
            <section>
              <SectionHeader>הגבלות מד כושר</SectionHeader>
              <Row label="דירוג מינימלי" value={tournament.rating_min} />
              <Row label="דירוג מקסימלי" value={tournament.rating_max} />
            </section>
          )}

          {/* סיבובים */}
          <section>
            <SectionHeader>סיבובים ({rounds.length})</SectionHeader>
            {rounds.length === 0 ? (
              <p className="text-sm text-gray-400">אין סיבובים מוגדרים</p>
            ) : (
              <div className="space-y-1 max-h-44 overflow-y-auto">
                {rounds.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-gray-700">סיבוב {r.round_number}</span>
                    <div className="flex items-center gap-4 text-gray-500 text-xs">
                      {r.date ? fmtDate(r.date) : <span className="italic">ללא תאריך</span>}
                      {r.date && <span>{r.start_time}–{r.end_time}</span>}
                      {r.location && <span>📍 {r.location}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ציוד פיזי נדרש */}
          {(tournament.resource_assignments ?? []).length > 0 && (
            <section>
              <SectionHeader>ציוד פיזי נדרש</SectionHeader>
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
                {/* Warning: resource overbooked at the time this tournament runs */}
                {(tournament.resource_assignments ?? []).some((a) => {
                  const eq = physicalEquipment.find((e) => e.id === a.resource_id);
                  if (!eq) return false;
                  return isTournamentResourceOverbooked(eq, tournament, a.quantity, allClasses, allTournaments);
                }) && (
                  <span className="text-xs text-red-500 font-medium">⚠ חסר ציוד</span>
                )}
              </div>
            </section>
          )}

          {/* משתתפים */}
          <section>
            <SectionHeader>משתתפים ({totalParticipants})</SectionHeader>
            {totalParticipants === 0 ? (
              <p className="text-sm text-gray-400">אין משתתפים רשומים</p>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden max-h-44 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs">
                      <th className="text-right px-4 py-2 font-medium">שם</th>
                      <th className="text-right px-4 py-2 font-medium">דירוג</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredStudents.map((s) => (
                      <tr key={s.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-2 text-gray-800">{s.first_name} {s.last_name}</td>
                        <td className="px-4 py-2 text-gray-500">{s.israeli_rating ?? "—"}</td>
                      </tr>
                    ))}
                    {manualParticipants.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-2 text-gray-800">
                          {p.name} <span className="text-xs text-amber-600">(חיצוני)</span>
                        </td>
                        <td className="px-4 py-2 text-gray-500">{p.rating ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      </Modal>

      {confirmDelete && (
        <ConfirmDialog
          message={`למחוק את התחרות "${tournament.name}"? פעולה זו אינה הפיכה.`}
          onConfirm={onDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
