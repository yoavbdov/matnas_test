"use client";
/*
  AddStudentsModal — large modal for adding students to a class.
  Mirrors AddPlayersModal (tournaments) for visual consistency.
  Features:
  - Search across all students not yet enrolled
  - Checkbox multi-select with select-all / clear
  - Per-student cards with rating and schedule-conflict warning
  - CSV export dropdown: all unregistered OR only those without conflicts
*/
import { useState, useRef, useEffect } from "react";
import { X, AlertTriangle, UserPlus, Search } from "lucide-react";
import Btn from "@/components/shared/Btn";
import CsvExportBtn from "@/components/shared/CsvExportBtn";
import { slotsOverlapTime } from "@/lib/classHelpers";
import { timeToMins } from "@/lib/utils";
import type { Student, Enrollment, Class, Tournament, ScheduleSlot } from "@/types";

const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

interface Props {
  className: string;
  allStudents: Student[];
  alreadyAddedIds: string[];
  formSlots: ScheduleSlot[];
  allClasses: Class[];
  allEnrollments: Enrollment[];
  allTournaments: Tournament[];
  currentClassId?: string;
  onAdd: (studentIds: string[]) => void;
  onClose: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

// Returns a conflict description if the student's schedule clashes with formSlots
function getConflict(
  studentId: string,
  formSlots: ScheduleSlot[],
  allClasses: Class[],
  allEnrollments: Enrollment[],
  allTournaments: Tournament[],
  currentClassId?: string,
): string | null {
  if (formSlots.length === 0) return null;

  // Check other classes the student is enrolled in
  const otherClassIds = allEnrollments
    .filter((e) => e.student_id === studentId && e.status === "פעיל" && e.class_id !== currentClassId)
    .map((e) => e.class_id);

  for (const classId of otherClassIds) {
    const cls = allClasses.find((c) => c.id === classId);
    if (!cls) continue;
    for (const slotA of formSlots) {
      for (const slotB of cls.slots ?? []) {
        if (slotsOverlapTime(slotA, slotB)) return `חוג: ${cls.name}`;
      }
    }
  }

  // Check recurring tournaments
  for (const t of allTournaments) {
    if (!(t.participant_ids ?? []).includes(studentId)) continue;
    if (t.is_recurring && t.recurring_date) {
      const [y, m, d] = t.recurring_date.split("-").map(Number);
      const tourDay = HEBREW_DAYS[new Date(y, m - 1, d).getDay()];
      for (const slot of formSlots) {
        const s1 = timeToMins(slot.start_time);
        const e1 = timeToMins(slot.end_time);
        const s2 = timeToMins(t.recurring_start_time ?? "00:00");
        const e2 = timeToMins(t.recurring_end_time ?? "01:00");
        if (slot.day === tourDay && s1 < e2 && s2 < e1) return `תחרות: ${t.name}`;
      }
    }
  }

  return null;
}

// Converts a list of students to a CSV string and triggers a download
function exportToCsv(students: Student[], filename: string) {
  const headers = [
    "שם פרטי", "שם משפחה", "טלפון", "אימייל",
    "ת.ז.", "תאריך לידה", "דירוג ישראלי", "דירוג FIDE", "תואר",
    "מס׳ שחמטאי ישראלי", "FIDE ID", "כתובת", "סטטוס",
  ];
  const rows = students.map((s) => [
    s.first_name, s.last_name, s.phone ?? "", s.email ?? "", s.israeli_id ?? "", s.dob,
    s.israeli_rating ?? "", s.fide_rating ?? "", s.chess_title ?? "",
    s.israeli_chess_id ?? "", s.fide_id ?? "", s.address ?? "", s.status,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  // Prepend UTF-8 BOM so Excel opens Hebrew correctly
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function AddStudentsModal({
  className,
  allStudents,
  alreadyAddedIds,
  formSlots,
  allClasses,
  allEnrollments,
  allTournaments,
  currentClassId,
  onAdd,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // All students not yet enrolled (before search filter)
  const allAvailable = allStudents.filter((s) => !alreadyAddedIds.includes(s.id));

  // Filtered by search
  const available = allAvailable.filter((s) => {
    if (!search) return true;
    return `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase());
  });

  // Students with no schedule conflict — the "suitable" group for CSV export
  const suitableStudents = allAvailable.filter(
    (s) => !getConflict(s.id, formSlots, allClasses, allEnrollments, allTournaments, currentClassId),
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    onAdd(Array.from(selected));
    onClose();
  }

  return (
    // Full-screen backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel — very large, matches AddPlayersModal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">הוספת תלמידים לחוג</h2>
            <p className="text-sm text-gray-400 mt-0.5">{className}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש תלמיד לפי שם..."
              className="w-full pr-9 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50"
            />
          </div>

          {/* Select all / clear + CSV export */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setSelected(new Set(available.map((s) => s.id)))}
                className="text-teal-600 hover:underline font-medium"
              >
                בחר הכל ({available.length})
              </button>
              {selected.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-gray-400 hover:underline"
                >
                  נקה בחירה
                </button>
              )}
            </div>

            {/* Export dropdown — same pattern as AddPlayersModal */}
            <div className="relative" ref={exportMenuRef}>
              <CsvExportBtn onClick={() => setShowExportMenu((v) => !v)} />
              {showExportMenu && (
                <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-64">
                  <button
                    type="button"
                    onClick={() => {
                      exportToCsv(allAvailable, `תלמידים_לא_רשומים_${className}.csv`);
                      setShowExportMenu(false);
                    }}
                    disabled={allAvailable.length === 0}
                    className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    ייצא את כל התלמידים שלא רשומים ({allAvailable.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportToCsv(suitableStudents, `תלמידים_ללא_התנגשות_${className}.csv`);
                      setShowExportMenu(false);
                    }}
                    disabled={suitableStudents.length === 0}
                    className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    ייצא רק תלמידים ללא התנגשות בלוח זמנים ({suitableStudents.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Student cards */}
          {available.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p className="text-base">לא נמצאו תלמידים</p>
              <p className="text-sm mt-1">כל התלמידים הפעילים כבר רשומים לחוג</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {available.map((s) => {
                const conflict = getConflict(
                  s.id, formSlots, allClasses, allEnrollments, allTournaments, currentClassId,
                );
                const isChecked = selected.has(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? "border-teal-400 bg-teal-50"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(s.id)}
                      className="w-4 h-4 accent-teal-600 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {s.first_name} {s.last_name}
                        </span>
                        {s.chess_title && (
                          <span className="text-xs font-bold text-teal-600">{s.chess_title}</span>
                        )}
                        {conflict && (
                          <span title={`התנגשות עם: ${conflict}`}>
                            <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
                        <span>דירוג: {s.israeli_rating ?? "—"}</span>
                        {conflict && (
                          <span className="text-amber-500">התנגשות: {conflict}</span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100 bg-gray-50">
          <span className="text-sm text-gray-500">
            {selected.size > 0 ? `${selected.size} תלמידים יתווספו` : "לא נבחרו תלמידים"}
          </span>
          <div className="flex gap-3">
            <Btn variant="ghost" onClick={onClose}>ביטול</Btn>
            <Btn onClick={handleConfirm} disabled={selected.size === 0} className="px-6">
              הוסף לחוג {selected.size > 0 ? `(${selected.size})` : ""}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
