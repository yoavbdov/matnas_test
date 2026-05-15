// Modal for adding a student to a specific league group.
// Students who are already in the group are excluded from search results.

import { useState, useMemo } from "react";
import Modal from "@/components/shared/Modal";
import SearchInput from "@/components/shared/SearchInput";
import Btn from "@/components/shared/Btn";
import type { Student, LeagueGroupMember } from "@/types";
import { Button } from "@/components/ui/button";

interface Props {
  groupId: string;
  students: Student[]; // all students in the system
  existingMembers: LeagueGroupMember[]; // members already in this group
  saving: boolean;
  onAdd: (studentId: string) => void; // called when user clicks "הוסף"
  onClose: () => void;
}

export default function AddPlayerModal({
  groupId,
  students,
  existingMembers,
  saving,
  onAdd,
  onClose,
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

  // Filter: not already in this group, matches search
  // No status filter — status is computed automatically and any student can join a league group
  const visibleStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter((s) => !inThisGroup.has(s.id))
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
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setSelected(null); // clear selection when search changes
          }}
          placeholder="חיפוש לפי שם..."
          autoFocus
          className="w-full"
        />

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
                <Button
                  key={s.id}
                  variant="outline"
                  onClick={() => !takenByOther && setSelected(s.id)}
                  disabled={takenByOther}
                  title={takenByOther ? "שחקן זה כבר שייך לקבוצת ליגה אחרת" : undefined}
                  className={`w-full justify-start text-right px-3 py-2 h-auto text-sm transition-colors border ${
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
                </Button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
