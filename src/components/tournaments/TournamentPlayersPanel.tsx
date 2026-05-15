"use client";
/*
  TournamentPlayersPanel — tab content for managing tournament participants.
  Shows the current list and a single "הוסף שחקנים" button that opens AddPlayersModal.
*/
import { useState } from "react";
import { X, AlertTriangle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddPlayersModal from "./AddPlayersModal";
import CsvExportBtn from "@/components/shared/CsvExportBtn";
import type { Student, ManualParticipant } from "@/types";

interface Props {
  tournamentName: string;
  participantIds: string[];
  manualParticipants: ManualParticipant[];
  allStudents: Student[];
  onChangeIds: (ids: string[]) => void;
  onChangeManual: (list: ManualParticipant[]) => void;
  ratingMin?: number;
  ratingMax?: number;
  ageMin?: number;
  ageMax?: number;
}

// Export current participants to CSV and trigger download
function exportParticipantsToCSV(
  registeredStudents: Student[],
  manualParticipants: ManualParticipant[],
  tournamentName: string,
) {
  const headers = [
    "שם פרטי", "שם משפחה", "טלפון", "אימייל",
    "ת.ז.", "תאריך לידה", "דירוג ישראלי", "דירוג FIDE", "תואר",
    "מס׳ שחמטאי ישראלי", "FIDE ID", "כתובת", "סטטוס", "סוג",
  ];

  const rows: string[][] = [];

  for (const s of registeredStudents) {
    rows.push([
      s.first_name, s.last_name, s.phone ?? "", s.email ?? "", s.israeli_id ?? "", s.dob,
      String(s.israeli_rating ?? ""), String(s.fide_rating ?? ""),
      s.chess_title ?? "", s.israeli_chess_id ?? "", s.fide_id ?? "",
      s.address ?? "", s.status ?? "", "רשום במערכת",
    ]);
  }

  for (const p of manualParticipants) {
    rows.push([
      p.name, "", "", "", "", "", "", "", String(p.rating ?? ""),
      "", "", "", "", "", "", "חיצוני",
    ]);
  }

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [
    "﻿" + headers.map(escape).join(","), // BOM for Excel Hebrew support
    ...rows.map((r) => r.map(escape).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `משתתפים_${tournamentName}.csv`;
  a.click();
}

function calcAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function isOutOfRange(s: Student, rMin?: number, rMax?: number, aMin?: number, aMax?: number) {
  const r = s.israeli_rating;
  if (rMin !== undefined || rMax !== undefined) {
    if (r === undefined) return true;
    if (rMin !== undefined && r < rMin) return true;
    if (rMax !== undefined && r > rMax) return true;
  }
  if (aMin !== undefined || aMax !== undefined) {
    const age = calcAge(s.dob);
    if (aMin !== undefined && age < aMin) return true;
    if (aMax !== undefined && age > aMax) return true;
  }
  return false;
}

export default function TournamentPlayersPanel({
  tournamentName,
  participantIds,
  manualParticipants,
  allStudents,
  onChangeIds,
  onChangeManual,
  ratingMin,
  ratingMax,
  ageMin,
  ageMax,
}: Props) {
  const [showAddModal, setShowAddModal] = useState(false);

  const addedStudents = participantIds
    .map((id) => allStudents.find((s) => s.id === id))
    .filter(Boolean) as Student[];

  const totalCount = participantIds.length + manualParticipants.length;

  function handleAdd(newIds: string[], newManual: ManualParticipant[]) {
    onChangeIds([...participantIds, ...newIds]);
    onChangeManual([...manualParticipants, ...newManual]);
  }

  return (
    <div className="space-y-5" dir="rtl">

      {/* Header — count + add + export */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-500 font-medium">
          {totalCount === 0 ? "אין משתתפים רשומים" : `${totalCount} משתתפים רשומים`}
        </span>
        <div className="flex items-center gap-2">
          {/* Export current participants to CSV — uses the shared CsvExportBtn for visual consistency */}
          {totalCount > 0 && (
            <CsvExportBtn
              onClick={() => exportParticipantsToCSV(addedStudents, manualParticipants, tournamentName)}
            />
          )}
          <Button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <UserPlus size={15} />
            להוספת שחקנים לחץ כאן
          </Button>
        </div>
      </div>

      {/* Current system students */}
      {addedStudents.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">שחקנים רשומים</p>
          <div className="space-y-1.5">
            {addedStudents.map((s) => {
              const out = isOutOfRange(s, ratingMin, ratingMax, ageMin, ageMax);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-2">
                    {out && (
                      <span title="מחוץ לטווח">
                        <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                      </span>
                    )}
                    <span className="font-medium text-gray-800">{s.first_name} {s.last_name}</span>
                    {s.chess_title && (
                      <span className="text-xs font-bold text-teal-600">{s.chess_title}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{s.israeli_rating ?? "—"}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onChangeIds(participantIds.filter((x) => x !== s.id))}
                      className="text-red-400 hover:text-red-600 h-6 w-6"
                    >
                      <X size={15} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual / external players */}
      {manualParticipants.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">שחקנים חיצוניים</p>
          <div className="space-y-1.5">
            {manualParticipants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-sm"
              >
                <span className="font-medium text-gray-800">{p.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{p.rating ?? "—"}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onChangeManual(manualParticipants.filter((x) => x.id !== p.id))}
                    className="text-red-400 hover:text-red-600 h-6 w-6"
                  >
                    <X size={15} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="py-10 text-center text-gray-300">
          <UserPlus size={36} className="mx-auto mb-3" />
          <p className="text-sm">לחץ על הכפתור למעלה כדי להוסיף שחקנים</p>
        </div>
      )}

      {/* Add players modal */}
      {showAddModal && (
        <AddPlayersModal
          allStudents={allStudents}
          alreadyAddedIds={participantIds}
          ratingMin={ratingMin}
          ratingMax={ratingMax}
          ageMin={ageMin}
          ageMax={ageMax}
          onAdd={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
