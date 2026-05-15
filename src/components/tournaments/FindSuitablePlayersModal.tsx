/*
  FindSuitablePlayersModal — shows all students who meet the tournament's
  rating and/or age criteria and are NOT yet registered.
  Features:
  - Select multiple students and add them in one click
  - Export the full list (suitable, not-yet-registered) to Excel with all details
  - Warning triangle next to students who are outside the age range
*/
"use client";
import { useState } from "react";
import { Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import SearchInput from "@/components/shared/SearchInput";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import type { Student } from "@/types";

interface Props {
  allStudents: Student[];
  ratingMin?: number;
  ratingMax?: number;
  ageMin?: number;
  ageMax?: number;
  alreadyAddedIds: string[];
  onAdd: (ids: string[]) => void;
  onClose: () => void;
}

// Calculate age in full years from a YYYY-MM-DD string
function calcAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Returns true if student is outside the age range
function isAgeOutOfRange(student: Student, ageMin?: number, ageMax?: number): boolean {
  if (ageMin === undefined && ageMax === undefined) return false;
  const age = calcAge(student.dob);
  if (ageMin !== undefined && age < ageMin) return true;
  if (ageMax !== undefined && age > ageMax) return true;
  return false;
}

// Export the given students to an Excel file (.xlsx) with all their details
async function exportToExcel(students: Student[], rangeLabel: string) {
  // Dynamic import so xlsx is only loaded when needed
  const XLSX = await import("xlsx");

  const rows = students.map((s) => ({
    "שם פרטי": s.first_name,
    "שם משפחה": s.last_name,
    "ת.ז.": s.israeli_id ?? "",
    "תאריך לידה": s.dob,
    "דירוג ישראלי": s.israeli_rating ?? "",
    "דירוג FIDE": s.fide_rating ?? "",
    תואר: s.chess_title ?? "",
    "מס׳ שחמטאי ישראלי": s.israeli_chess_id ?? "",
    "FIDE ID": s.fide_id ?? "",
    טלפון: s.phone ?? "",
    אימייל: s.email ?? "",
    כתובת: s.address ?? "",
    סטטוס: s.status,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "שחקנים מתאימים");
  XLSX.writeFile(wb, `שחקנים_מתאימים_${rangeLabel}.xlsx`);
}

export default function FindSuitablePlayersModal({
  allStudents,
  ratingMin,
  ratingMax,
  ageMin,
  ageMax,
  alreadyAddedIds,
  onAdd,
  onClose,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  // A student "passes" the rating filter (or no rating filter is set)
  function passesRating(s: Student): boolean {
    const r = s.israeli_rating;
    if (ratingMin !== undefined && (r === undefined || r < ratingMin)) return false;
    if (ratingMax !== undefined && (r === undefined || r > ratingMax)) return false;
    return true;
  }

  // A student "passes" the age filter (or no age filter is set)
  function passesAge(s: Student): boolean {
    if (ageMin === undefined && ageMax === undefined) return true;
    const age = calcAge(s.dob);
    if (ageMin !== undefined && age < ageMin) return false;
    if (ageMax !== undefined && age > ageMax) return false;
    return true;
  }

  // Filter: active, not already added, passes both rating AND age, matches search
  const suitable = allStudents.filter((s) => {
    if (s.status !== "פעיל") return false;
    if (alreadyAddedIds.includes(s.id)) return false;
    if (!passesRating(s)) return false;
    if (!passesAge(s)) return false;
    if (search) {
      const full = `${s.first_name} ${s.last_name}`.toLowerCase();
      if (!full.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(suitable.map((s) => s.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  function handleAdd() {
    onAdd(Array.from(selected));
    onClose();
  }

  // Label for the Excel filename
  const rangeLabel = [
    ratingMin !== undefined || ratingMax !== undefined
      ? `דירוג_${ratingMin ?? "0"}-${ratingMax ?? "∞"}`
      : null,
    ageMin !== undefined || ageMax !== undefined
      ? `גיל_${ageMin ?? "0"}-${ageMax ?? "∞"}`
      : null,
  ]
    .filter(Boolean)
    .join("_") || "כל_השחקנים";

  // Human-readable summary shown in the modal
  const parts: string[] = [];
  if (ratingMin !== undefined || ratingMax !== undefined)
    parts.push(`דירוג ${ratingMin ?? "ללא מינימום"} – ${ratingMax ?? "ללא מקסימום"}`);
  if (ageMin !== undefined || ageMax !== undefined)
    parts.push(`גיל ${ageMin ?? "ללא מינימום"} – ${ageMax ?? "ללא מקסימום"}`);
  const rangeDisplay = parts.length > 0 ? parts.join(" | ") : "ללא סינון";

  // All suitable students without the search filter — used for Excel export
  const suitableAll = allStudents.filter(
    (s) =>
      s.status === "פעיל" &&
      !alreadyAddedIds.includes(s.id) &&
      passesRating(s) &&
      passesAge(s),
  );

  return (
    <Modal
      title="שחקנים מתאימים שלא רשומים עדיין"
      onClose={onClose}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full" dir="rtl">
          <span className="text-sm text-gray-500">{selected.size} נבחרו</span>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={onClose}>
              ביטול
            </Btn>
            <Btn onClick={handleAdd} disabled={selected.size === 0}>
              הוסף {selected.size > 0 ? `(${selected.size})` : ""}
            </Btn>
          </div>
        </div>
      }
    >
      <div className="space-y-4" dir="rtl">
        {/* Range info + export button */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-500">
            מציג שחקנים פעילים {rangeDisplay}
          </span>
          {/* Export ALL suitable (not just search-filtered) to Excel */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => exportToExcel(suitableAll, rangeLabel)}
            disabled={suitableAll.length === 0}
            className="flex items-center gap-1.5 text-sm text-green-700 hover:text-green-800 font-medium"
            title="ייצא את כל השחקנים המתאימים לאקסל"
          >
            <Download size={14} />
            ייצא לאקסל ({suitableAll.length})
          </Button>
        </div>

        {/* Search */}
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="חיפוש לפי שם..."
          className="w-full"
        />

        {/* Select all / clear */}
        {suitable.length > 0 && (
          <div className="flex gap-3 text-sm">
            <Button
              type="button"
              variant="link"
              onClick={selectAll}
              className="text-teal-600 p-0 h-auto"
            >
              בחר הכל ({suitable.length})
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={clearAll}
              className="text-gray-400 p-0 h-auto"
            >
              נקה בחירה
            </Button>
          </div>
        )}

        {/* Student list */}
        {suitable.length === 0 ? (
          <p className="text-center text-gray-400 py-6 text-sm">
            {alreadyAddedIds.length > 0
              ? "כל השחקנים המתאימים כבר רשומים בתחרות"
              : "לא נמצאו שחקנים העומדים בקריטריונים"}
          </p>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {suitable.map((s) => {
              // Show a warning if this student was included via rating but fails age (or vice versa)
              const ageWarn = isAgeOutOfRange(s, ageMin, ageMax);
              return (
                <label
                  key={s.id}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selected.has(s.id)}
                      onCheckedChange={() => toggle(s.id)}
                    />
                    <span className="text-sm font-medium">
                      {s.first_name} {s.last_name}
                    </span>
                    {/* Age warning — shouldn't happen since we filter by age, but guards edge cases */}
                    {ageWarn && (
                      <span title="מחוץ לטווח הגיל של התחרות">
                        <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {s.chess_title && (
                      <span className="font-bold text-teal-600">
                        {s.chess_title}
                      </span>
                    )}
                    <span>דירוג: {s.israeli_rating ?? "—"}</span>
                    <span>גיל: {calcAge(s.dob)}</span>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
