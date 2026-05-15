/*
  סטטוס שחקן מחושב אוטומטית — לא נשמר ב-Firestore.

  חוקים:
  - פעיל      — רשום לחוג פעיל OR רשום לתחרות
  - ליגה בלבד — חבר בקבוצת ליגה, אך לא בחוג ולא בתחרות
  - לא פעיל   — אחרת
*/

import type { Enrollment, Tournament, LeagueGroupMember } from "./types";

export type StudentStatus = "פעיל" | "ליגה בלבד" | "לא פעיל";

export function computeStudentStatus(
  studentId: string,
  enrollments: Enrollment[],
  tournaments: Tournament[],
  leagueGroupMembers: LeagueGroupMember[],
): StudentStatus {
  // In an active class enrollment?
  const inClass = enrollments.some(
    (e) => e.student_id === studentId && e.status === "פעיל",
  );
  if (inClass) return "פעיל";

  // Registered as participant in any tournament?
  const inTournament = tournaments.some((t) =>
    t.participant_ids.includes(studentId),
  );
  if (inTournament) return "פעיל";

  // Member of a league group only?
  const inLeague = leagueGroupMembers.some((m) => m.student_id === studentId);
  if (inLeague) return "ליגה בלבד";

  return "לא פעיל";
}
