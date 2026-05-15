// ייצוא ציוד לקובץ CSV
import type { PhysicalEquipment } from "@/types";

function escapeCell(v: string | number): string {
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportEquipmentCsv(equipment: PhysicalEquipment[]): void {
  const headers = ["שם*", "כמות*", "הערות"];
  const rows = equipment.map((e) => [e.name, e.quantity, e.notes ?? ""]);
  const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ציוד.csv";
  a.click();
}
