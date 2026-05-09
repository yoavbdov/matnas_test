"use client";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PageShell from "@/components/shared/PageShell";
import TournamentsToolbar from "./TournamentsToolbar";
import TournamentsTable from "./TournamentsTable";
import TournamentFormModal from "./TournamentFormModal";
import TournamentDetailModal from "./TournamentDetailModal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { addDocument, updateDocument, deleteDocument } from "@/firebase/firestore";
import type { Tournament, Room } from "@/lib/types";

// תאריך היום בפורמט YYYY-MM-DD
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function TournamentsPage() {
  const { tournaments, students, classes, rooms, teachers, physicalEquipment } = useData();
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Tournament["status"] | "הכל">("הכל");
  // כאשר פעיל — מסנן תחרויות שיש להן סבב/מועד היום
  const [todayActive, setTodayActive] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [detailTournament, setDetailTournament] = useState<Tournament | null>(null);
  const [editTournament, setEditTournament] = useState<Tournament | null>(null);
  const [saving, setSaving] = useState(false);

  // אם הגענו מלוח הבקרה עם ?today=true — הפעל פילטר "היום" אוטומטית
  useEffect(() => {
    if (searchParams.get("today") === "true") {
      setTodayActive(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleToggleToday() {
    setTodayActive((prev) => !prev);
  }

  const today = todayStr();

  // Filter tournaments by search, status, and optionally "today"
  const filtered = useMemo(() => {
    return tournaments.filter((t) => {
      if (statusFilter !== "הכל" && t.status !== statusFilter) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (todayActive) {
        if (t.status === "בוטל") return false;
        const hasRoundToday = t.is_recurring
          ? t.recurring_date === today
          : t.rounds.some((r) => r.date === today);
        if (!hasRoundToday) return false;
      }
      return true;
    });
  }, [tournaments, search, statusFilter, todayActive, today]);

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
        todayActive={todayActive}
        onToggleToday={handleToggleToday}
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
