// Shows the details of a single league group and the list of members.
// From here you can add players (opens AddPlayerModal) or remove them.

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import AddPlayerModal from "./AddPlayerModal";
import { addDocument, deleteDocument } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import type {
  LeagueGroup,
  LeagueGroupMember,
  Student,
} from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/config/config";

interface Props {
  group: LeagueGroup;
  members: LeagueGroupMember[]; // all members in the system (filtered inside)
  students: Student[];
  onClose: () => void;
  onEdit: (group: LeagueGroup) => void;
  onDelete: (group: LeagueGroup) => void;
  settings: typeof DEFAULT_SETTINGS;
}

export default function LeagueGroupDetailModal({
  group,
  members,
  students,
  onClose,
  onEdit,
  onDelete,
  settings,
}: Props) {
  const { showToast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Members that belong to THIS group only
  const groupMembers = members.filter((m) => m.group_id === group.id);

  function getStudent(studentId: string) {
    return students.find((s) => s.id === studentId);
  }

  async function handleAddPlayer(studentId: string) {
    setSaving(true);
    try {
      await addDocument("leagueGroupMembers", {
        group_id: group.id,
        student_id: studentId,
        joined_at: new Date().toISOString().slice(0, 10),
      });
      showToast("השחקן נוסף לקבוצה", "success");
      setAddOpen(false);
    } catch {
      showToast("שגיאה בהוספה, נסה שוב", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemovePlayer(memberId: string) {
    setSaving(true);
    try {
      await deleteDocument("leagueGroupMembers", memberId);
      showToast("השחקן הוסר מהקבוצה", "success");
    } catch {
      showToast("שגיאה בהסרה, נסה שוב", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Modal
        title={group.name}
        onClose={onClose}
        footer={
          <div className="flex gap-2 justify-between w-full">
            {/* Danger zone: delete group */}
            <Btn variant="danger" onClick={() => onDelete(group)}>
              <Trash2 size={15} />
              מחק קבוצה
            </Btn>
            <div className="flex gap-2">
              <Btn variant="secondary" onClick={() => onEdit(group)}>
                עריכה
              </Btn>
              <Btn onClick={() => setAddOpen(true)}>
                <Plus size={15} />
                הוסף שחקן
              </Btn>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Group meta */}
          {group.description && (
            <p className="text-gray-600 text-sm">{group.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>סטטוס: {group.status}</span>
            <span>ליגה: {group.leagueType}</span>
          </div>

          <hr className="border-gray-100" />

          {/* Members list */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              שחקנים ({groupMembers.length})
            </h3>

            {groupMembers.length === 0 ? (
              <p className="text-gray-400 text-sm">אין שחקנים בקבוצה עדיין</p>
            ) : (
              <ul className="space-y-1">
                {groupMembers.map((m) => {
                  const student = getStudent(m.student_id);
                  return (
                    <li
                      key={m.id}
                      className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm text-gray-800">
                        {student
                          ? `${student.first_name} ${student.last_name}`
                          : "שחקן לא ידוע"}
                        {student?.israeli_rating && (
                          <span className="mr-2 text-xs text-gray-400">
                            {student.israeli_rating}
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => handleRemovePlayer(m.id)}
                        disabled={saving}
                        className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
                      >
                        הסר
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {group.notes && (
            <>
              <hr className="border-gray-100" />
              <p className="text-gray-400 text-xs whitespace-pre-wrap">
                {group.notes}
              </p>
            </>
          )}
        </div>
      </Modal>

      {/* Add player sub-modal */}
      {addOpen && (
        <AddPlayerModal
          groupId={group.id}
          students={students}
          existingMembers={members}
          saving={saving}
          onAdd={handleAddPlayer}
          onClose={() => setAddOpen(false)}
        />
      )}
    </>
  );
}
