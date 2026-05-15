// Utility functions for the Students page — kept here so page.tsx stays lean

import { computeStudentStatus } from "@/lib/studentHelpers";
import { gradeFromDob } from "@/lib/utils";
import type { Student, Enrollment, Tournament, LeagueGroupMember } from "@/types";

// Map URL param value (e.g. ?status=active) to the Hebrew filter label
export function parseStatusParam(
  raw: string | null,
): "הכל" | "פעיל" | "ליגה בלבד" | "לא פעיל" {
  if (raw === "active") return "פעיל";
  if (raw === "inactive") return "לא פעיל";
  if (raw === "league") return "ליגה בלבד";
  return "הכל";
}

// Get the effective grade label for a student — manual override wins, then DOB-based
export function effectiveGrade(
  s: Student,
  firstAge: number,
  adultAge: number,
): string {
  if (s.grade_override) return s.grade_override;
  if (s.dob) return gradeFromDob(s.dob, firstAge, adultAge);
  return "";
}

// Build and download a CSV of the given students list
export function exportStudentsCsv(
  students: Student[],
  allEnrollments: Enrollment[],
  allTournaments: Tournament[],
  allLeagueMembers: LeagueGroupMember[],
) {
  const headers = [
    "שם פרטי",
    "שם משפחה",
    "תאריך לידה",
    "תעודת זהות",
    "טלפון",
    "אימייל",
    "כתובת",
    "מספר שחמטאי ישראלי",
    "מספר FIDE",
    "דירוג ישראלי",
    "דירוג FIDE",
    "תואר שחמט",
    "כיתה (ידני)",
    "הערות",
    "סטטוס",
    "תאריך הצטרפות",
  ];

  const rows = students.map((s) => [
    s.first_name,
    s.last_name,
    s.dob,
    s.israeli_id ?? "",
    s.phone ?? "",
    s.email ?? "",
    s.address ?? "",
    s.israeli_chess_id ?? "",
    s.fide_id ?? "",
    s.israeli_rating ?? "",
    s.fide_rating ?? "",
    s.chess_title ?? "",
    s.grade_override ?? "",
    s.notes ?? "",
    computeStudentStatus(s.id, allEnrollments, allTournaments, allLeagueMembers),
    s.created_at ?? "",
  ]);

  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "שחקנים.csv";
  a.click();
}
