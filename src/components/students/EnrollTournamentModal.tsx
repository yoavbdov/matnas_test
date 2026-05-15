"use client";
// חלון רישום שחקן לתחרות — מציג תחרויות זמינות ומאפשר רישום
// שחקן שלא עומד בקריטריון יכול להירשם, אך תוצג אזהרה בצד
import { useState } from "react";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import { calcAge } from "@/lib/utils";
import { updateDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import { AlertTriangle } from "lucide-react";
import type { Student, Tournament } from "@/types";

interface Props {
  student: Student;
  allTournaments: Tournament[];
  onClose: () => void;
}

// Returns a warning if the student doesn't meet criteria, or null if all good.
// "כבר רשום" blocks enrollment; rating/age mismatches are warnings only.
function tournamentWarning(
  student: Student,
  t: Tournament,
): { warning: string | null; blocked: boolean } {
  if ((t.participant_ids ?? []).includes(student.id)) {
    return { warning: "כבר רשום", blocked: true };
  }
  const r = student.israeli_rating;
  if (r !== undefined && t.rating_min !== undefined && r < t.rating_min) {
    return { warning: "דירוג נמוך", blocked: false };
  }
  if (r !== undefined && t.rating_max !== undefined && r > t.rating_max) {
    return { warning: "דירוג גבוה", blocked: false };
  }
  const age = student.dob ? calcAge(student.dob) : null;
  if (age !== null && t.age_min !== undefined && age < t.age_min) {
    return { warning: "צעיר מדי", blocked: false };
  }
  if (age !== null && t.age_max !== undefined && age > t.age_max) {
    return { warning: "מבוגר מדי", blocked: false };
  }
  return { warning: null, blocked: false };
}

// Builds a short criteria line (age range + rating range)
function criteriaLine(t: Tournament): string {
  const parts: string[] = [];
  if (t.age_min !== undefined || t.age_max !== undefined) {
    parts.push(`גיל ${t.age_min ?? "ללא מינ׳"}–${t.age_max ?? "ללא מקס׳"}`);
  }
  if (t.rating_min !== undefined || t.rating_max !== undefined) {
    parts.push(`מד כושר ${t.rating_min ?? "ללא מינ׳"}–${t.rating_max ?? "ללא מקס׳"}`);
  }
  return parts.join(" · ");
}

export default function EnrollTournamentModal({ student, allTournaments, onClose }: Props) {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Only show active / planned tournaments
  const activeTournaments = allTournaments.filter(
    (t) => t.status === "פעיל" || t.status === "מתוכנן",
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (selected.size === 0) { showToast("לא נבחרה אף תחרות", "error"); return; }
    setSaving(true);
    try {
      // For each selected tournament, add this student's ID to participant_ids
      await Promise.all(
        [...selected].map((tid) => {
          const t = allTournaments.find((x) => x.id === tid)!;
          const updated = [...(t.participant_ids ?? []), student.id];
          return updateDocument("tournaments", tid, { participant_ids: updated });
        }),
      );
      showToast(selected.size === 1 ? "הרישום בוצע" : `${selected.size} רישומים בוצעו`, "success");
      onClose();
    } catch {
      showToast("שגיאה בשמירה, נסה שוב", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`רישום ${student.first_name} ${student.last_name} לתחרות`}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>ביטול</Btn>
          <Btn onClick={handleSave} loading={saving} disabled={selected.size === 0}>
            רשום ({selected.size})
          </Btn>
        </>
      }
    >
      <div className="space-y-2">
        {activeTournaments.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">אין תחרויות פעילות או מתוכננות</p>
        )}
        {activeTournaments.map((t) => {
          const { warning, blocked } = tournamentWarning(student, t);
          const isChecked = selected.has(t.id);
          const criteria = criteriaLine(t);

          return (
            <label
              key={t.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                blocked
                  ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                  : isChecked
                  ? "border-teal-400 bg-teal-50 cursor-pointer"
                  : "border-gray-200 cursor-pointer hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={blocked}
                onChange={() => !blocked && toggle(t.id)}
                className="accent-teal-600"
              />
              {/* Color dot */}
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color ?? "#ccc" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{t.name}</p>
                {criteria && (
                  <p className="text-xs text-gray-400 mt-0.5">{criteria}</p>
                )}
              </div>
              {/* Warning icon for soft mismatches, plain text for hard blocks */}
              {warning && !blocked && (
                <span className="flex items-center gap-1 text-xs text-amber-500 shrink-0">
                  <AlertTriangle size={13} />
                  {warning}
                </span>
              )}
              {warning && blocked && (
                <span className="text-xs text-red-400 shrink-0">{warning}</span>
              )}
            </label>
          );
        })}
      </div>
    </Modal>
  );
}
