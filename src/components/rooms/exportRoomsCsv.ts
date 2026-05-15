// Build and download a CSV of the given rooms list
import type { Room } from "@/types";

export function exportRoomsCsv(rooms: Room[]) {
  const headers = ["שם החדר", "קיבולת", "מספר חדר", "תכונות", "הערות"];
  const rows = rooms.map((r) => [
    r.name,
    r.capacity,
    r.number ?? "",
    (r.features ?? []).join("|"),
    r.notes ?? "",
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "חדרים.csv";
  a.click();
}
