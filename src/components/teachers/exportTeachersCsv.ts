// Build and download a CSV of the given teachers list
import { computeTeacherStatus } from "@/lib/helpers/teacherHelpers";
import type { Teacher, Class, Tournament } from "@/types";

export function exportTeachersCsv(
  teachers: Teacher[],
  classes: Class[],
  tournaments: Tournament[],
) {
  const headers = [
    "שם פרטי",
    "שם משפחה",
    "סטטוס",
    "טלפון",
    "אימייל",
    "הסמכות",
    "הערות",
    "חוגים פעילים",
  ];

  const rows = teachers.map((t) => {
    const activeClasses = classes.filter(
      (c) => c.teacher_id === t.id && c.status === "פעיל",
    ).length;
    // Status is computed: has active class OR is judge in a tournament = פעיל
    const status = computeTeacherStatus(t.id, classes, tournaments);
    return [
      t.first_name,
      t.last_name,
      status,
      t.phone ?? "",
      t.email ?? "",
      (t.certifications ?? []).join("|"),
      t.notes ?? "",
      activeClasses,
    ];
  });

  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "מדריכים.csv";
  a.click();
}
