// Modal for adding a student to a specific league group.
// Students who are already in the group are excluded from search results.

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import type { Student, LeagueGroupMember, AppSettings } from "@/lib/types";

interface Props {
  groupId: string;
  students: Student[]; // all students in the system
  existingMembers: LeagueGroupMember[]; // members already in this group
  saving: boolean;
  onAdd: (studentId: string) => void; // called when user clicks "הוסף"
  onClose: () => void;
  settings: Required<AppSettings>;
}

export default function AddPlayerModal({
  groupId,
  students,
  existingMembers,
  saving,
  onAdd,
  onClose,
  settings,
}: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null); // selected student ID

  // IDs of students already in THIS group — excluded entirely
  const inThisGroup = useMemo(
    () => new Set(existingMembers.filter((m) => m.group_id === groupId).map((m) => m.student_id)),
    [existingMembers, groupId],
  );

  // IDs of students in ANY OTHER group — shown but disabled (greyed out)
  const inOtherGroup = useMemo(
    () => new Set(existingMembers.filter((m) => m.group_id !== groupId).map((m) => m.student_id)),
    [existingMembers, groupId],
  );

  // Filter: not in this group, active, matches search
  const visibleStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter((s) => !inThisGroup.has(s.id) && s.status === "פעיל")
      .filter((s) => {
        if (!q) return true;
        return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q);
      });
  }, [students, inThisGroup, search]);

  return (
    <Modal
      title="הוספת שחקן לקבוצה"
      onClose={onClose}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>ביטול</Btn>
          <Btn
            onClick={() => selected && onAdd(selected)}
            disabled={!selected}
            loading={saving}
          >
            הוסף לקבוצה
          </Btn>
        </>
      }
    >
      <div className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelected(null); // clear selection when search changes
            }}
            placeholder="חיפוש לפי שם..."
            maxLength={settings.MAX_SEARCH_LENGTH}
            className="w-full border border-gray-200 rounded-lg pr-8 pl-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
            autoFocus
          />
        </div>

        {/* Results list */}
        <div className="max-h-64 overflow-y-auto space-y-1">
          {visibleStudents.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">
              {search ? "לא נמצאו שחקנים" : "כל השחקנים כבר בקבוצה"}
            </p>
          ) : (
            visibleStudents.map((s) => {
              // Student already belongs to another group — show disabled
              const takenByOther = inOtherGroup.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => !takenByOther && setSelected(s.id)}
                  disabled={takenByOther}
                  title={takenByOther ? "שחקן זה כבר שייך לקבוצת ליגה אחרת" : undefined}
                  className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors border ${
                    takenByOther
                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                      : selected === s.id
                      ? "bg-teal-50 border-teal-400 text-teal-800"
                      : "bg-white border-gray-100 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="font-medium">
                    {s.first_name} {s.last_name}
                  </span>
                  {s.israeli_rating && (
                    <span className="mr-2 text-gray-400 text-xs">דירוג: {s.israeli_rating}</span>
                  )}
                  {/* Explain why this student is disabled */}
                  {takenByOther && (
                    <span className="mr-2 text-xs text-gray-400">שייך לקבוצה אחרת</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
