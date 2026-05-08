"use client";
import { useState, useMemo } from "react";
import PageShell from "@/components/shared/PageShell";
import TournamentsToolbar from "./TournamentsToolbar";
import TournamentsTable from "./TournamentsTable";
import TournamentFormModal from "./TournamentFormModal";
import TournamentDetailModal from "./TournamentDetailModal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { addDocument, updateDocument, deleteDocument } from "@/firebase/firestore";
import type { Tournament, Room } from "@/lib/types";

export default function TournamentsPage() {
  const { tournaments, students, classes, rooms, teachers, physicalEquipment } = useData();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Tournament["status"] | "הכל">("הכל");
  const [showAdd, setShowAdd] = useState(false);
  const [detailTournament, setDetailTournament] = useState<Tournament | null>(null);
  const [editTournament, setEditTournament] = useState<Tournament | null>(null);
  const [saving, setSaving] = useState(false);

  // Filter tournaments by search and status
  const filtered = useMemo(() => {
    return tournaments.filter((t) => {
      if (statusFilter !== "הכל" && t.status !== statusFilter) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tournaments, search, statusFilter]);

  async function handleAdd(data: Omit<Tournament, "id">) {
    if (!data.name.trim()) { showToast("שם התחרות הוא שדה חובה", "error"); return; }
    setSaving(true);
    try {
      await addDocument("tournaments", data);
      showToast("התחרות נוצרה בהצלחה", "success");
      setShowAdd(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`שגיאה ביצירת תחרות: ${msg}`, "error");
      console.error("handleAdd error:", err);
    }
    finally { setSaving(false); }
  }

  async function handleEdit(data: Omit<Tournament, "id">) {
    if (!editTournament) return;
    if (!data.name.trim()) { showToast("שם התחרות הוא שדה חובה", "error"); return; }
    setSaving(true);
    try {
      await updateDocument("tournaments", editTournament.id, data);
      showToast("התחרות עודכנה בהצלחה", "success");
      setEditTournament(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`שגיאה בשמירת התחרות: ${msg}`, "error");
      console.error("handleEdit error:", err);
    }
    finally { setSaving(false); }
  }

  async function handleDelete(t: Tournament) {
    try {
      await deleteDocument("tournaments", t.id);
      showToast("התחרות נמחקה", "success");
      setDetailTournament(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`שגיאה במחיקת התחרות: ${msg}`, "error");
      console.error("handleDelete error:", err);
    }
  }

  return (
    <PageShell title="תחרויות">

      <TournamentsToolbar
        search={search}
        onSearch={setSearch}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        onAdd={() => setShowAdd(true)}
      />

      <TournamentsTable
        tournaments={filtered}
        onRowClick={setDetailTournament}
      />

      {/* Add modal */}
      {showAdd && (
        <TournamentFormModal
          mode="add"
          allStudents={students}
          allClasses={classes}
          allTournaments={tournaments}
          allRooms={rooms}
          allTeachers={teachers}
          physicalEquipment={physicalEquipment}
          saving={saving}
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
        />
      )}

      {/* Edit modal */}
      {editTournament && (
        <TournamentFormModal
          mode="edit"
          tournament={editTournament}
          allStudents={students}
          allClasses={classes}
          allTournaments={tournaments}
          allRooms={rooms}
          allTeachers={teachers}
          physicalEquipment={physicalEquipment}
          saving={saving}
          onClose={() => setEditTournament(null)}
          onSave={handleEdit}
        />
      )}

      {/* Detail modal */}
      {detailTournament && (
        <TournamentDetailModal
          tournament={detailTournament}
          allStudents={students}
          allTeachers={teachers}
          physicalEquipment={physicalEquipment}
          allClasses={classes}
          allTournaments={tournaments}
          onEdit={() => {
            setEditTournament(detailTournament);
            setDetailTournament(null);
          }}
          onDelete={() => handleDelete(detailTournament)}
          onClose={() => setDetailTournament(null)}
        />
      )}

    </PageShell>
  );
}
