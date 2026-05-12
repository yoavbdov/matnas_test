"use client";
/*
  TournamentParticipantsModal — shows all registered participants for a tournament (read-only).
  Opened from TournamentDetailModal via "לחץ כאן לרשימת המשתתפים".
*/
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import type { Tournament, Student } from "@/lib/types";

interface Props {
  tournament: Tournament;
  allStudents: Student[];
  onClose: () => void;
}

export default function TournamentParticipantsModal({ tournament, allStudents, onClose }: Props) {
  const registered = (tournament.participant_ids ?? [])
    .map((id) => allStudents.find((s) => s.id === id))
    .filter(Boolean) as Student[];

  const manual = tournament.manual_participants ?? [];
  const total = registered.length + manual.length;

  return (
    <Modal
      title={`משתתפים — ${tournament.name} (${total})`}
      onClose={onClose}
      size="md"
      footer={<Btn variant="secondary" onClick={onClose}>סגור</Btn>}
    >
      <div dir="rtl">
        {total === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">אין משתתפים רשומים</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs">
                  <th className="text-right px-4 py-2 font-medium">שם</th>
                  <th className="text-right px-4 py-2 font-medium">דירוג</th>
                </tr>
              </thead>
              <tbody>
                {registered.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-2 text-gray-800">{s.first_name} {s.last_name}</td>
                    <td className="px-4 py-2 text-gray-500">{s.israeli_rating ?? "—"}</td>
                  </tr>
                ))}
                {manual.map((p) => (
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
      </div>
    </Modal>
  );
}
