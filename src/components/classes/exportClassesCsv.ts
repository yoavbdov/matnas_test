// Export the visible classes list as a CSV file
// Separated from page.tsx to keep that file lean

import type { Class, Enrollment, PhysicalEquipment, Teacher } from "@/types";

export function exportClassesCsv(
  classes: Class[],
  teachers: Teacher[],
  enrollments: Enrollment[],
  physicalEquipment: PhysicalEquipment[],
) {
  const headers = [
    "שם החוג",
    "מדריך",
    "קיבולת",
    "רשומים",
    "גיל מינימלי",
    "גיל מקסימלי",
    "דירוג מינימלי",
    "דירוג מקסימלי",
    "ימים",
    "מפגשים",
    "ציוד",
    "הערות",
    "סטטוס",
  ];

  const rows = classes.map((c) => {
    const teacher = teachers.find((t) => t.id === c.teacher_id);
    const enrolled = enrollments.filter(
      (e) => e.class_id === c.id && e.status === "פעיל",
    ).length;

    // Unique days across all slots
    const days = [...new Set((c.slots ?? []).map((s) => s.day))].join(" | ");

    // Each slot as "יום שעה_התחלה-שעה_סיום"
    const slots = (c.slots ?? [])
      .map((s) => `${s.day} ${s.start_time}-${s.end_time}`)
      .join(" | ");

    // Equipment names (fall back to ID if name not found)
    const equipment = (c.resource_assignments ?? [])
      .map((a) => physicalEquipment.find((r) => r.id === a.resource_id)?.name ?? a.resource_id)
      .join(" | ");

    return [
      c.name,
      teacher ? `${teacher.first_name} ${teacher.last_name}` : "",
      c.capacity,
      enrolled,
      c.age_min ?? "",
      c.age_max ?? "",
      c.rating_min ?? "",
      c.rating_max ?? "",
      days,
      slots,
      equipment,
      c.notes ?? "",
      c.status,
    ];
  });

  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "חוגים.csv";
  a.click();
}
