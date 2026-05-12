/*
  TournamentFormModal — create or edit a tournament.
  Tabs: Basic Info / Rounds (hidden if recurring) / Players.
  Also handles conflict warnings and the "Find Suitable Players" sub-modal.
*/
"use client";
import { useState, useMemo } from "react";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import TournamentBasicFields, {
  TournamentFormData,
} from "./TournamentBasicFields";
import TournamentRoundsEditor from "./TournamentRoundsEditor";
import TournamentPlayersPanel from "./TournamentPlayersPanel";
import { getConflictingRoundIds, computeTournamentStatus, getRecurringTournamentConflicts } from "@/lib/tournamentHelpers";
import type {
  Tournament,
  TournamentRound,
  ManualParticipant,
  Student,
  Class,
  Room,
  Teacher,
  PhysicalEquipment,
  ResourceAssignment,
  Event,
} from "@/lib/types";

interface Props {
  mode: "add" | "edit";
  tournament?: Tournament; // provided in edit mode
  allStudents: Student[];
  allClasses: Class[];
  allTournaments: Tournament[];
  allEvents: Event[];
  allRooms: Room[];
  allTeachers: Teacher[];
  physicalEquipment: PhysicalEquipment[];
  saving: boolean;
  onClose: () => void;
  onSave: (data: Omit<Tournament, "id">) => Promise<void>;
  onDelete?: () => void; // only in edit mode
}

// Build the initial form state for both add and edit modes
function buildInitial(t?: Tournament): TournamentFormData & {
  rounds: TournamentRound[];
  participant_ids: string[];
  manual_participants: ManualParticipant[];
  recurring_resource_assignments: ResourceAssignment[];
} {
  return {
    name: t?.name ?? "",
    status: t?.status ?? "מתוכנן",
    rating_min: t?.rating_min,
    rating_max: t?.rating_max,
    age_min: t?.age_min,
    age_max: t?.age_max,
    is_recurring: t?.is_recurring ?? false,
    recurring_date: t?.recurring_date,
    recurring_start_time: t?.recurring_start_time,
    recurring_end_time: t?.recurring_end_time,
    recurring_resource_assignments: t?.recurring_resource_assignments ?? [],
    resource_assignments: t?.resource_assignments ?? [],
    room: t?.room ?? "",
    color: t?.color ?? "#14b8a6",
    judge_id: t?.judge_id,
    description: t?.description ?? "",
    notes: t?.notes ?? "",
    rounds: t?.rounds ?? [],
    participant_ids: t?.participant_ids ?? [],
    manual_participants: t?.manual_participants ?? [],
  };
}

export default function TournamentFormModal({
  mode,
  tournament,
  allStudents,
  allClasses,
  allTournaments,
  allEvents,
  allRooms,
  allTeachers,
  physicalEquipment,
  saving,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [tab, setTab] = useState<"פרטים " | "סיבובים" | "שחקנים">("פרטים ");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState(() => buildInitial(tournament));

  // Live conflict detection for rounds (non-recurring tournaments)
  const conflictRoundIds = useMemo(() => {
    const fakeTournament: Tournament = {
      id: tournament?.id ?? "__new__",
      ...form,
      created_at: "",
    };
    return getConflictingRoundIds(fakeTournament, allClasses, allTournaments, allEvents);
  }, [form.rounds, allClasses, allTournaments, allEvents, tournament?.id]);

  // Live conflict detection for recurring tournaments (room + day-of-week + time)
  const recurringConflicts = useMemo(() => {
    if (!form.is_recurring) return [];
    const fakeTournament: Tournament = {
      id: tournament?.id ?? "__new__",
      ...form,
      created_at: "",
    };
    return getRecurringTournamentConflicts(fakeTournament, allTournaments);
  }, [
    form.is_recurring,
    form.room,
    form.recurring_date,
    form.recurring_start_time,
    form.recurring_end_time,
    allTournaments,
    tournament?.id,
  ]);

  const hasConflicts = conflictRoundIds.size > 0 || recurringConflicts.length > 0;

  // All tournaments show the Rounds tab (recurring uses it for date/time)
  const tabs = ["פרטים ", "סיבובים", "שחקנים"] as const;

  function patchForm(patch: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function handleSave() {
    await onSave({
      name: form.name,
      // Status is computed from dates — not stored manually
      status: computeTournamentStatus({
        ...form,
        id: tournament?.id ?? "__new__",
        rounds: form.is_recurring ? [] : form.rounds,
        participant_ids: form.participant_ids,
        manual_participants: form.manual_participants,
      }),
      rating_min: form.rating_min,
      rating_max: form.rating_max,
      age_min: form.age_min,
      age_max: form.age_max,
      is_recurring: form.is_recurring,
      recurring_date: form.is_recurring ? form.recurring_date : undefined,
      recurring_start_time: form.is_recurring ? form.recurring_start_time : undefined,
      recurring_end_time: form.is_recurring ? form.recurring_end_time : undefined,
      recurring_resource_assignments: form.is_recurring ? form.recurring_resource_assignments : undefined,
      resource_assignments: form.resource_assignments,
      room: form.room,
      judge_id: form.judge_id,
      color: form.color,
      description: form.description,
      notes: form.notes,
      // Recurring tournaments have no rounds
      rounds: form.is_recurring ? [] : form.rounds,
      participant_ids: form.participant_ids,
      manual_participants: form.manual_participants,
      created_at: tournament?.created_at ?? new Date().toISOString(),
    });
  }

  return (
    <>
      <Modal
        title={
          mode === "add" ? "תחרות חדשה" : `עריכת תחרות — ${tournament?.name}`
        }
        onClose={onClose}
        size="lg"
        footer={
          <div
            className="flex items-center justify-between w-full gap-3"
            dir="rtl"
          >
            {/* Conflict warning — rounds tournament */}
            {hasConflicts && !form.is_recurring && (
              <span className="text-red-600 text-sm font-semibold flex items-center gap-1">
                ⚠ {conflictRoundIds.size} סיבובים עם התנגשות
              </span>
            )}
            {/* Conflict warning — recurring tournament */}
            {recurringConflicts.length > 0 && (
              <span className="text-red-600 text-sm font-semibold flex items-center gap-1">
                ⚠ התנגשות חדר עם: {recurringConflicts.join(", ")}
              </span>
            )}
            <div className="flex items-center gap-2 w-full justify-between">
              {/* Delete — edit mode only */}
              {mode === "edit" && onDelete && (
                <Btn variant="danger" onClick={() => setConfirmDelete(true)} disabled={saving}>
                  מחק תחרות
                </Btn>
              )}
              <div className="flex gap-2 mr-auto">
                <Btn variant="ghost" onClick={onClose} disabled={saving}>
                  ביטול
                </Btn>
                <Btn onClick={handleSave} loading={saving} disabled={!form.name.trim()}>
                  {mode === "add" ? "צור תחרות" : "שמור שינויים"}
                </Btn>
              </div>
            </div>
          </div>
        }
      >
        {/* Tab bar */}
        <div className="flex gap-1 border-b border-gray-200 mb-5" dir="rtl">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t as typeof tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                tab === t
                  ? "border-b-2 border-teal-600 text-teal-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
              {/* Show conflict badge on rounds tab */}
              {t === "סיבובים" && hasConflicts && (
                <span className="mr-1 text-red-500 text-xs font-bold">⚠</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content — fixed height + scroll so the modal never grows */}
        <div className="h-105 overflow-y-auto">
        {tab === "פרטים " && (
          <TournamentBasicFields
            form={form}
            onChange={(patch) => patchForm(patch)}
            allTeachers={allTeachers}
            physicalEquipment={physicalEquipment}
            allClasses={allClasses}
            allTournaments={allTournaments}
            currentTournamentId={tournament?.id}
            participantCount={form.participant_ids.length + form.manual_participants.length}
            // Pass date/time so availability check uses the actual tournament schedule
            equipmentDate={form.is_recurring ? form.recurring_date : form.rounds[0]?.date}
            equipmentStartTime={form.is_recurring ? form.recurring_start_time : form.rounds[0]?.start_time}
            equipmentEndTime={form.is_recurring ? form.recurring_end_time : form.rounds[0]?.end_time}
          />
        )}

        {tab === "סיבובים" && (
          <TournamentRoundsEditor
            rounds={form.rounds}
            onChange={(rounds) => patchForm({ rounds })}
            conflictRoundIds={conflictRoundIds}
            allRooms={allRooms}
            isRecurring={form.is_recurring ?? false}
            recurringDate={form.recurring_date}
            recurringStartTime={form.recurring_start_time}
            recurringEndTime={form.recurring_end_time}
            recurringRoom={form.room}
            onRecurringChange={(patch) => patchForm(patch)}
          />
        )}

        {tab === "שחקנים" && (
          <TournamentPlayersPanel
            tournamentName={form.name}
            participantIds={form.participant_ids}
            manualParticipants={form.manual_participants}
            allStudents={allStudents}
            onChangeIds={(ids) => patchForm({ participant_ids: ids })}
            onChangeManual={(list) => patchForm({ manual_participants: list })}
            ratingMin={form.rating_min}
            ratingMax={form.rating_max}
            ageMin={form.age_min}
            ageMax={form.age_max}
          />
        )}
        </div>
      </Modal>

      {confirmDelete && onDelete && (
        <ConfirmDialog
          message={`למחוק את התחרות "${tournament?.name}"? פעולה זו אינה ניתנת לביטול.`}
          onConfirm={() => { setConfirmDelete(false); onDelete(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
