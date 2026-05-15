/*
  סטטוס מדריך מחושב אוטומטית — לא נשמר ב-Firestore.

  חוקים:
  - פעיל    — מלמד חוג פעיל OR שופט בתחרות
  - לא פעיל — אחרת
*/

import type { Class, Tournament } from "@/types";

export type TeacherStatus = "פעיל" | "לא פעיל";

export function computeTeacherStatus(
  teacherId: string,
  classes: Class[],
  tournaments: Tournament[],
): TeacherStatus {
  // Teaches an active class?
  const teachesClass = classes.some(
    (c) => c.teacher_id === teacherId && c.status === "פעיל",
  );
  if (teachesClass) return "פעיל";

  // Assigned as judge/arbiter in any tournament?
  const isJudge = tournaments.some((t) => t.judge_id === teacherId);
  if (isJudge) return "פעיל";

  return "לא פעיל";
}
