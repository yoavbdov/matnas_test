"use client";
/*
  דף תחרויות ואירועים — שני טאבים:
  1. תחרויות (הלוגיקה הקיימת)
  2. אירועים (חדש)
*/
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PageShell from "@/components/shared/PageShell";
import TournamentsToolbar from "./TournamentsToolbar";
import TournamentsTable from "./TournamentsTable";
import TournamentFormModal from "./TournamentFormModal";
import TournamentDetailModal from "./TournamentDetailModal";
import EventsTable from "./events/EventsTable";
import EventFormModal from "./events/EventFormModal";
import EventDetailModal from "./events/EventDetailModal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { addDocument, updateDocument, deleteDocument } from "@/firebase/firestore";
import type { Tournament, Event } from "@/lib/types";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// --- Tab Button ---
function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
        active
          ? "border-teal-600 text-teal-700 bg-white"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

export default function TournamentsPage() {
  const { tournaments, students, classes, rooms, teachers, physicalEquipment, events } = useData();
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  // --- Tab state — מסונכרן עם #hash בURL (כמו דף החדרים) ---
  const [activeTab, setActiveTabState] = useState<"tournaments" | "events">("tournaments");

  useEffect(() => {
    // קרא את ה-hash בטעינה ראשונית
    if (window.location.hash === "#events") setActiveTabState("events");
  }, []);

  function setActiveTab(tab: "tournaments" | "events") {
    setActiveTabState(tab);
    window.location.hash = tab === "events" ? "events" : "";
  }

  // --- Tournaments state ---
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Tournament["status"] | "הכל">("הכל");
  const [todayActive, setTodayActive] = useState(false);
  const [showAddTournament, setShowAddTournament] = useState(false);
  const [detailTournament, setDetailTournament] = useState<Tournament | null>(null);
  const [editTournament, setEditTournament] = useState<Tournament | null>(null);
  const [savingTournament, setSavingTournament] = useState(false);

  // --- Events state ---
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);

  // אם הגענו מלוח הבקרה עם ?today=true — הפעל פילטר "היום"
  useEffect(() => {
    if (searchParams.get("today") === "true") setTodayActive(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const today = todayStr();

  // --- Filtered tournaments ---
  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      if (statusFilter !== "הכל" && t.status !== statusFilter) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (todayActive) {
        if (t.status === "בוטל") return false;
        const hasToday = t.is_recurring
          ? t.recurring_date === today
          : t.rounds.some((r) => r.date === today);
        if (!hasToday) return false;
      }
      return true;
    });
  }, [tournaments, search, statusFilter, todayActive, today]);

  // --- Tournament CRUD ---
  async function handleAddTournament(data: Omit<Tournament, "id">) {
    if (!data.name.trim()) { showToast("שם התחרות הוא שדה חובה", "error"); return; }
    setSavingTournament(true);
    try {
      await addDocument("tournaments", data);
      showToast("התחרות נוצרה בהצלחה", "success");
      setShowAddTournament(false);
    } catch (err) {
      showToast(`שגיאה ביצירת תחרות: ${err instanceof Error ? err.message : err}`, "error");
    } finally { setSavingTournament(false); }
  }

  async function handleEditTournament(data: Omit<Tournament, "id">) {
    if (!editTournament) return;
    if (!data.name.trim()) { showToast("שם התחרות הוא שדה חובה", "error"); return; }
    setSavingTournament(true);
    try {
      await updateDocument("tournaments", editTournament.id, data);
      showToast("התחרות עודכנה בהצלחה", "success");
      setEditTournament(null);
    } catch (err) {
      showToast(`שגיאה בשמירת התחרות: ${err instanceof Error ? err.message : err}`, "error");
    } finally { setSavingTournament(false); }
  }

  async function handleDeleteTournament(t: Tournament) {
    try {
      await deleteDocument("tournaments", t.id);
      showToast("התחרות נמחקה", "success");
      setDetailTournament(null);
    } catch (err) {
      showToast(`שגיאה במחיקת התחרות: ${err instanceof Error ? err.message : err}`, "error");
    }
  }

  // --- Event CRUD ---
  async function handleAddEvent(data: Omit<Event, "id">) {
    if (!data.name.trim()) { showToast("שם האירוע הוא שדה חובה", "error"); return; }
    setSavingEvent(true);
    try {
      await addDocument("events", { ...data, created_at: new Date().toISOString() });
      showToast("האירוע נוצר בהצלחה", "success");
      setShowAddEvent(false);
    } catch (err) {
      showToast(`שגיאה ביצירת אירוע: ${err instanceof Error ? err.message : err}`, "error");
    } finally { setSavingEvent(false); }
  }

  async function handleEditEvent(data: Omit<Event, "id">) {
    if (!editEvent) return;
    if (!data.name.trim()) { showToast("שם האירוע הוא שדה חובה", "error"); return; }
    setSavingEvent(true);
    try {
      await updateDocument("events", editEvent.id, data);
      showToast("האירוע עודכן בהצלחה", "success");
      setEditEvent(null);
    } catch (err) {
      showToast(`שגיאה בשמירת האירוע: ${err instanceof Error ? err.message : err}`, "error");
    } finally { setSavingEvent(false); }
  }

  async function handleDeleteEvent(ev: Event) {
    try {
      await deleteDocument("events", ev.id);
      showToast("האירוע נמחק", "success");
      setDetailEvent(null);
    } catch (err) {
      showToast(`שגיאה במחיקת האירוע: ${err instanceof Error ? err.message : err}`, "error");
    }
  }

  return (
    <PageShell title="תחרויות ואירועים">

      {/* טאבים */}
      <div className="flex gap-1 border-b border-gray-200 mb-5" dir="rtl">
        <TabBtn label="🏆 תחרויות" active={activeTab === "tournaments"} onClick={() => setActiveTab("tournaments")} />
        <TabBtn label="📅 אירועים" active={activeTab === "events"} onClick={() => setActiveTab("events")} />
      </div>

      {/* ===== טאב תחרויות ===== */}
      {activeTab === "tournaments" && (
        <>
          <TournamentsToolbar
            search={search}
            onSearch={setSearch}
            statusFilter={statusFilter}
            onStatusFilter={setStatusFilter}
            todayActive={todayActive}
            onToggleToday={() => setTodayActive((p) => !p)}
            onAdd={() => setShowAddTournament(true)}
          />
          <TournamentsTable tournaments={filteredTournaments} onRowClick={setDetailTournament} />
        </>
      )}

      {/* ===== טאב אירועים ===== */}
      {activeTab === "events" && (
        <>
          {/* כפתור הוספת אירוע */}
          <div className="flex justify-start mb-4" dir="rtl">
            <button
              type="button"
              onClick={() => setShowAddEvent(true)}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700"
            >
              + אירוע חדש
            </button>
          </div>
          <EventsTable events={events} onRowClick={setDetailEvent} />
        </>
      )}

      {/* ===== מודאלים — תחרויות ===== */}
      {showAddTournament && (
        <TournamentFormModal
          mode="add"
          allStudents={students}
          allClasses={classes}
          allTournaments={tournaments}
          allEvents={events}
          allRooms={rooms}
          allTeachers={teachers}
          physicalEquipment={physicalEquipment}
          saving={savingTournament}
          onClose={() => setShowAddTournament(false)}
          onSave={handleAddTournament}
        />
      )}
      {editTournament && (
        <TournamentFormModal
          mode="edit"
          tournament={editTournament}
          allStudents={students}
          allClasses={classes}
          allTournaments={tournaments}
          allEvents={events}
          allRooms={rooms}
          allTeachers={teachers}
          physicalEquipment={physicalEquipment}
          saving={savingTournament}
          onClose={() => setEditTournament(null)}
          onSave={handleEditTournament}
        />
      )}
      {detailTournament && (
        <TournamentDetailModal
          tournament={detailTournament}
          allStudents={students}
          allTeachers={teachers}
          physicalEquipment={physicalEquipment}
          allClasses={classes}
          allTournaments={tournaments}
          onEdit={() => { setEditTournament(detailTournament); setDetailTournament(null); }}
          onDelete={() => handleDeleteTournament(detailTournament)}
          onClose={() => setDetailTournament(null)}
        />
      )}

      {/* ===== מודאלים — אירועים ===== */}
      {/* DetailModal מרונדר ראשון — FormModal (add/edit) תמיד מעל */}
      {detailEvent && !editEvent && !showAddEvent && (
        <EventDetailModal
          event={detailEvent}
          onEdit={() => { setEditEvent(detailEvent); setDetailEvent(null); }}
          onDelete={() => handleDeleteEvent(detailEvent)}
          onClose={() => setDetailEvent(null)}
        />
      )}
      {showAddEvent && (
        <EventFormModal
          mode="add"
          allClasses={classes}
          allTournaments={tournaments}
          allEvents={events}
          rooms={rooms}
          saving={savingEvent}
          onClose={() => setShowAddEvent(false)}
          onSave={handleAddEvent}
        />
      )}
      {editEvent && (
        <EventFormModal
          mode="edit"
          event={editEvent}
          allClasses={classes}
          allTournaments={tournaments}
          allEvents={events}
          rooms={rooms}
          saving={savingEvent}
          onClose={() => setEditEvent(null)}
          onSave={handleEditEvent}
        />
      )}

    </PageShell>
  );
}
