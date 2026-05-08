/*
  Manage tournament participants.
  - Full searchable list of ALL students to pick from (not just a dropdown)
  - Out-of-range warning triangle next to players outside the tournament's rating range
  - Add external players manually (name + optional rating)
  - Remove any participant with one click
  - "Find suitable players" button (opens FindSuitablePlayersModal)
*/
"use client";
import { useState } from "react";
import { X, UserPlus, AlertTriangle } from "lucide-react";
import type { Student, ManualParticipant } from "@/lib/types";

interface Props {
  participantIds: string[]; // student IDs already added
  manualParticipants: ManualParticipant[];
  allStudents: Student[];
  onChangeIds: (ids: string[]) => void;
  onChangeManual: (list: ManualParticipant[]) => void;
  onFindSuitable: () => void; // opens FindSuitablePlayersModal
  ratingMin?: number;
  ratingMax?: number;
  ageMin?: number;
  ageMax?: number;
}

function newManualId() {
  return "m_" + Math.random().toString(36).slice(2, 8);
}

// Calculate age in full years from a YYYY-MM-DD date string
function calcAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Returns true if the student is outside the tournament's rating OR age range
function isOutOfRange(
  student: Student,
  ratingMin?: number,
  ratingMax?: number,
  ageMin?: number,
  ageMax?: number,
): boolean {
  // Check rating
  const r = student.israeli_rating;
  if (ratingMin !== undefined || ratingMax !== undefined) {
    if (r === undefined) return true; // no rating, can't confirm eligibility
    if (ratingMin !== undefined && r < ratingMin) return true;
    if (ratingMax !== undefined && r > ratingMax) return true;
  }
  // Check age
  if (ageMin !== undefined || ageMax !== undefined) {
    const age = calcAge(student.dob);
    if (ageMin !== undefined && age < ageMin) return true;
    if (ageMax !== undefined && age > ageMax) return true;
  }
  return false;
}

export default function TournamentPlayersPanel({
  participantIds,
  manualParticipants,
  allStudents,
  onChangeIds,
  onChangeManual,
  onFindSuitable,
  ratingMin,
  ratingMax,
  ageMin,
  ageMax,
}: Props) {
  const [search, setSearch] = useState("");

  // Manual add form state
  const [manualName, setManualName] = useState("");
  const [manualRating, setManualRating] = useState("");

  // All students NOT yet added, filtered by search
  const available = allStudents.filter(
    (s) =>
      !participantIds.includes(s.id) &&
      `${s.first_name} ${s.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  function addStudent(id: string) {
    onChangeIds([...participantIds, id]);
  }

  function removeStudent(id: string) {
    onChangeIds(participantIds.filter((x) => x !== id));
  }

  function addManual() {
    if (!manualName.trim()) return;
    const entry: ManualParticipant = {
      id: newManualId(),
      name: manualName.trim(),
      rating: manualRating ? Number(manualRating) : undefined,
    };
    onChangeManual([...manualParticipants, entry]);
    setManualName("");
    setManualRating("");
  }

  function removeManual(id: string) {
    onChangeManual(manualParticipants.filter((p) => p.id !== id));
  }

  // Registered students added to this tournament
  const addedStudents = participantIds
    .map((id) => allStudents.find((s) => s.id === id))
    .filter(Boolean) as Student[];

  const totalCount = participantIds.length + manualParticipants.length;

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header count + find suitable button */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {totalCount} משתתפים רשומים
        </span>
        {/* Opens FindSuitablePlayersModal — select + add players, or export to Excel */}
        <button
          type="button"
          onClick={onFindSuitable}
          className="text-sm text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2"
        >
          מצא / ייצא שחקנים מתאימים
        </button>
      </div>

      {/* Full student list — search + pick */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          הוסף שחקן רשום במערכת
        </label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
          placeholder="חפש לפי שם..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {/* Scrollable list of all students not yet added */}
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
          {available.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-400 text-center">
              אין שחקנים להוספה
            </p>
          ) : (
            available.map((s) => {
              const outOfRange = isOutOfRange(s, ratingMin, ratingMax, ageMin, ageMax);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addStudent(s.id)}
                  className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-1.5">
                    {/* Subtle warning triangle if outside rating range */}
                    {outOfRange && (
                      <AlertTriangle
                        size={13}
                        className="text-amber-400 shrink-0"
                        title="מחוץ לטווח הדירוג או הגיל של התחרות"
                      />
                    )}
                    <span>
                      {s.first_name} {s.last_name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {s.israeli_rating ?? "—"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Manual player add */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          הוסף שחקן חיצוני (לא רשום במערכת)
        </label>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="שם מלא"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
          />
          <input
            type="number"
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="דירוג"
            value={manualRating}
            onChange={(e) => setManualRating(e.target.value)}
            min={0}
          />
          <button
            type="button"
            onClick={addManual}
            disabled={!manualName.trim()}
            className="flex items-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-40 transition-colors"
          >
            <UserPlus size={15} />
            הוסף
          </button>
        </div>
      </div>

      {/* Registered student list */}
      {addedStudents.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            שחקנים רשומים
          </p>
          <div className="space-y-1">
            {addedStudents.map((s) => {
              const outOfRange = isOutOfRange(s, ratingMin, ratingMax, ageMin, ageMax);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-1.5">
                    {/* Subtle warning — out of rating range */}
                    {outOfRange && (
                      <AlertTriangle
                        size={13}
                        className="text-amber-400 shrink-0"
                        title="מחוץ לטווח הדירוג או הגיל של התחרות"
                      />
                    )}
                    <span>
                      {s.first_name} {s.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs">
                      {s.israeli_rating ?? "—"}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeStudent(s.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual player list */}
      {manualParticipants.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            שחקנים חיצוניים
          </p>
          <div className="space-y-1">
            {manualParticipants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2 text-sm"
              >
                <span>{p.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs">
                    {p.rating ?? "—"}
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
        </div>
      )}

      {/* Rating / age range reminder */}
      {(ratingMin !== undefined || ratingMax !== undefined || ageMin !== undefined || ageMax !== undefined) && (
        <div className="text-xs text-gray-400 border-t pt-3 space-y-1">
          <div className="flex items-center justify-between">
            {(ratingMin !== undefined || ratingMax !== undefined) && (
              <span>
                טווח דירוג: {ratingMin ?? "ללא מינימום"} –{" "}
                {ratingMax ?? "ללא מקסימום"}
              </span>
            )}
            {(ageMin !== undefined || ageMax !== undefined) && (
              <span>
                טווח גיל: {ageMin ?? "ללא מינימום"} –{" "}
                {ageMax ?? "ללא מקסימום"}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-amber-500">
              <AlertTriangle size={14} /> מחוץ לטווח
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
