"use client";
/*
  AddPlayersModal — large, aesthetic modal for adding participants to a tournament.
  Features:
  - Search across all students not yet registered
  - Checkbox multi-select with select-all / clear
  - Per-student cards showing rating, age, title
  - Out-of-range warning if student falls outside the tournament's criteria
  - Manual external player add (name + rating)
  - Export students to CSV (all unregistered OR only suitable ones)
*/
import { useState, useRef, useEffect } from "react";
import { X, AlertTriangle, UserPlus, Search } from "lucide-react";
import Btn from "@/components/shared/Btn";
import CsvExportBtn from "@/components/shared/CsvExportBtn";
import type { Student, ManualParticipant } from "@/lib/types";

interface Props {
  allStudents: Student[];
  alreadyAddedIds: string[];
  ratingMin?: number;
  ratingMax?: number;
  ageMin?: number;
  ageMax?: number;
  onAdd: (studentIds: string[], manualPlayers: ManualParticipant[]) => void;
  onClose: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function calcAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function isOutOfRange(
  s: Student,
  ratingMin?: number,
  ratingMax?: number,
  ageMin?: number,
  ageMax?: number,
): boolean {
  const r = s.israeli_rating;
  if (ratingMin !== undefined || ratingMax !== undefined) {
    if (r === undefined) return true;
    if (ratingMin !== undefined && r < ratingMin) return true;
    if (ratingMax !== undefined && r > ratingMax) return true;
  }
  if (ageMin !== undefined || ageMax !== undefined) {
    const age = calcAge(s.dob);
    if (ageMin !== undefined && age < ageMin) return true;
    if (ageMax !== undefined && age > ageMax) return true;
  }
  return false;
}

// Converts a list of students to a CSV string and triggers a download
function exportToCsv(students: Student[], filename: string) {
  const headers = [
    "שם פרטי",
    "שם משפחה",
    "ת.ז.",
    "תאריך לידה",
    "דירוג ישראלי",
    "דירוג FIDE",
    "תואר",
    "מס׳ שחמטאי ישראלי",
    "FIDE ID",
    "טלפון",
    "הורה",
    "טלפון הורה",
    "אימייל",
    "סטטוס",
  ];
  const rows = students.map((s) => [
    s.first_name,
    s.last_name,
    s.israeli_id ?? "",
    s.dob,
    s.israeli_rating ?? "",
    s.fide_rating ?? "",
    s.chess_title ?? "",
    s.israeli_chess_id ?? "",
    s.fide_id ?? "",
    s.phone ?? "",
    s.parent_name ?? "",
    s.parent_phone ?? "",
    s.email ?? "",
    s.status,
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
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

function newManualId() {
  return "m_" + Math.random().toString(36).slice(2, 8);
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function AddPlayersModal({
  allStudents,
  alreadyAddedIds,
  ratingMin,
  ratingMax,
  ageMin,
  ageMax,
  onAdd,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [manualName, setManualName] = useState("");
  const [manualRating, setManualRating] = useState("");
  const [manualList, setManualList] = useState<ManualParticipant[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close the export dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(e.target as Node)
      ) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // All students not yet added (before search filter)
  const allAvailable = allStudents.filter(
    (s) => !alreadyAddedIds.includes(s.id),
  );

  // Students not yet added, matching search
  const available = allAvailable.filter((s) => {
    if (!search) return true;
    return `${s.first_name} ${s.last_name}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  // Students not yet added who also meet the tournament's rating/age criteria
  const suitableStudents = allAvailable.filter(
    (s) => !isOutOfRange(s, ratingMin, ratingMax, ageMin, ageMax),
  );

  // Build the range label for CSV filename
  const rangeLabel =
    [
      ratingMin !== undefined || ratingMax !== undefined
        ? `דירוג_${ratingMin ?? 0}-${ratingMax ?? "∞"}`
        : null,
      ageMin !== undefined || ageMax !== undefined
        ? `גיל_${ageMin ?? 0}-${ageMax ?? "∞"}`
        : null,
    ]
      .filter(Boolean)
      .join("_") || "כל_השחקנים";

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addManual() {
    if (!manualName.trim()) return;
    setManualList((prev) => [
      ...prev,
      {
        id: newManualId(),
        name: manualName.trim(),
        rating: manualRating ? Number(manualRating) : undefined,
      },
    ]);
    setManualName("");
    setManualRating("");
  }

  function removeManual(id: string) {
    setManualList((prev) => prev.filter((p) => p.id !== id));
  }

  function handleConfirm() {
    onAdd(Array.from(selected), manualList);
    onClose();
  }

  const totalAdding = selected.size + manualList.length;

  return (
    // Full-screen backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel — very large */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              הוספת שחקנים לתחרות
            </h2>
            {/* Show the tournament criteria as subtle chips */}
            {(ratingMin !== undefined ||
              ratingMax !== undefined ||
              ageMin !== undefined ||
              ageMax !== undefined) && (
              <div className="flex gap-2 mt-1.5">
                {(ratingMin !== undefined || ratingMax !== undefined) && (
                  <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2.5 py-0.5">
                    מד כושר {ratingMin ?? "ללא מינ׳"} –{" "}
                    {ratingMax ?? "ללא מקס׳"}
                  </span>
                )}
                {(ageMin !== undefined || ageMax !== undefined) && (
                  <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">
                    גיל {ageMin ?? "ללא מינ׳"} – {ageMax ?? "ללא מקס׳"}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש שחקן לפי שם..."
              className="w-full pr-9 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50"
            />
          </div>

          {/* Select all / clear + export */}
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
            {/* Export dropdown — toggle on CsvExportBtn click */}
            <div className="relative" ref={exportMenuRef}>
              <CsvExportBtn onClick={() => setShowExportMenu((v) => !v)} />
              {showExportMenu && (
                <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-60">
                  <button
                    type="button"
                    onClick={() => {
                      exportToCsv(
                        allAvailable,
                        `שחקנים_לא_רשומים_${rangeLabel}.csv`,
                      );
                      setShowExportMenu(false);
                    }}
                    disabled={allAvailable.length === 0}
                    className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    ייצא את כל השחקנים שלא רשומים ({allAvailable.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportToCsv(
                        suitableStudents,
                        `שחקנים_מתאימים_${rangeLabel}.csv`,
                      );
                      setShowExportMenu(false);
                    }}
                    disabled={suitableStudents.length === 0}
                    className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    ייצא רק שחקנים שעומדים בקריטריונים (
                    {suitableStudents.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Student cards */}
          {available.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p className="text-base">לא נמצאו שחקנים</p>
              <p className="text-sm mt-1">כל השחקנים הפעילים כבר רשומים</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {available.map((s) => {
                const out = isOutOfRange(
                  s,
                  ratingMin,
                  ratingMax,
                  ageMin,
                  ageMax,
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
                          <span className="text-xs font-bold text-teal-600">
                            {s.chess_title}
                          </span>
                        )}
                        {out && (
                          <span title="מחוץ לטווח הדירוג או הגיל של התחרות">
                            <AlertTriangle
                              size={13}
                              className="text-amber-400 shrink-0"
                            />
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
                        <span>דירוג: {s.israeli_rating ?? "—"}</span>
                        <span>גיל: {calcAge(s.dob)}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* ── Manual / external player ── */}
          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              שחקן חיצוני (לא רשום במערכת)
            </p>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="שם מלא"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addManual()}
              />
              <input
                type="number"
                className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="דירוג"
                value={manualRating}
                onChange={(e) => setManualRating(e.target.value)}
                min={0}
              />
              <button
                type="button"
                onClick={addManual}
                disabled={!manualName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium disabled:opacity-40 transition-colors"
              >
                <UserPlus size={15} />
                הוסף
              </button>
            </div>

            {/* Manual list preview */}
            {manualList.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {manualList.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <span className="font-medium text-gray-800">{p.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {p.rating ?? "ללא דירוג"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeManual(p.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100 bg-gray-50">
          <span className="text-sm text-gray-500">
            {totalAdding > 0
              ? `${totalAdding} שחקנים יתווספו`
              : "לא נבחרו שחקנים"}
          </span>
          <div className="flex gap-3">
            <Btn variant="ghost" onClick={onClose}>
              ביטול
            </Btn>
            <Btn
              onClick={handleConfirm}
              disabled={totalAdding === 0}
              className="px-6"
            >
              הוסף לתחרות {totalAdding > 0 ? `(${totalAdding})` : ""}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
