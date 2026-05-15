// Hook: owns all tab + filter + modal + CRUD state for the Tournaments & Events page

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { addDocument, updateDocument, deleteDocument } from "@/firebase/firestore";
import { validateTimeRange } from "@/lib/validators";
import type { Tournament, Event } from "@/lib/types";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Validates time ranges for all rounds (or recurring time).
// Returns an error message string, or null if everything is OK.
function validateTournamentTimes(data: Omit<Tournament, "id">): string | null {
  if (data.is_recurring) {
    if (validateTimeRange(data.recurring_start_time ?? "", data.recurring_end_time ?? ""))
      return "שעת הסיום חייבת להיות אחרי שעת ההתחלה בתחרות החוזרת";
  } else {
    const badRound = (data.rounds ?? []).find((r) => validateTimeRange(r.start_time, r.end_time));
    if (badRound) return `שעת הסיום חייבת להיות אחרי שעת ההתחלה (סיבוב ${badRound.round_number})`;
  }
  return null;
}

interface Data {
  tournaments: Tournament[];
  events: Event[];
}

interface Deps {
  showToast: (msg: string, type: "success" | "error") => void;
}

export function useTournamentState(data: Data, { showToast }: Deps) {
  const { tournaments, events } = data;
  const searchParams = useSearchParams();

  // ── Tab state — synced to URL hash ──
  const [activeTab, setActiveTabState] = useState<"tournaments" | "events">("tournaments");

  useEffect(() => {
    if (window.location.hash === "#events") setActiveTabState("events");
  }, []);

  function setActiveTab(tab: "tournaments" | "events") {
    setActiveTabState(tab);
    window.location.hash = tab === "events" ? "events" : "";
  }

  // ── Tournament filter state ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Tournament["status"] | "הכל">("הכל");
  const [todayActive, setTodayActive] = useState(false);

  // If navigated from dashboard with ?today=true — auto-activate today filter
  useEffect(() => {
    if (searchParams.get("today") === "true") setTodayActive(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const today = todayStr();

  // ── Tournament modal state ──
  const [showAddTournament, setShowAddTournament] = useState(false);
  const [detailTournament, setDetailTournament] = useState<Tournament | null>(null);
  const [editTournament, setEditTournament] = useState<Tournament | null>(null);
  const [savingTournament, setSavingTournament] = useState(false);
  const [showTournamentImport, setShowTournamentImport] = useState(false);

  // ── Event modal state ──
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [showEventImport, setShowEventImport] = useState(false);

  // ── Filtered tournaments ──
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

  // ── Tournament CRUD ──
  async function handleAddTournament(formData: Omit<Tournament, "id">) {
    if (!formData.name.trim()) { showToast("שם התחרות הוא שדה חובה", "error"); return; }
    const timeErr = validateTournamentTimes(formData);
    if (timeErr) { showToast(timeErr, "error"); return; }
    setSavingTournament(true);
    try {
      await addDocument("tournaments", formData);
      showToast("התחרות נוצרה בהצלחה", "success");
      setShowAddTournament(false);
    } catch (err) {
      showToast(`שגיאה ביצירת תחרות: ${err instanceof Error ? err.message : err}`, "error");
    } finally { setSavingTournament(false); }
  }

  async function handleEditTournament(formData: Omit<Tournament, "id">) {
    if (!editTournament) return;
    if (!formData.name.trim()) { showToast("שם התחרות הוא שדה חובה", "error"); return; }
    const timeErr = validateTournamentTimes(formData);
    if (timeErr) { showToast(timeErr, "error"); return; }
    setSavingTournament(true);
    try {
      await updateDocument("tournaments", editTournament.id, formData);
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

  // ── Event CRUD ──
  async function handleAddEvent(formData: Omit<Event, "id">) {
    if (!formData.name.trim()) { showToast("שם האירוע הוא שדה חובה", "error"); return; }
    setSavingEvent(true);
    try {
      await addDocument("events", { ...formData, created_at: new Date().toISOString() });
      showToast("האירוע נוצר בהצלחה", "success");
      setShowAddEvent(false);
    } catch (err) {
      showToast(`שגיאה ביצירת אירוע: ${err instanceof Error ? err.message : err}`, "error");
    } finally { setSavingEvent(false); }
  }

  async function handleEditEvent(formData: Omit<Event, "id">) {
    if (!editEvent) return;
    if (!formData.name.trim()) { showToast("שם האירוע הוא שדה חובה", "error"); return; }
    setSavingEvent(true);
    try {
      await updateDocument("events", editEvent.id, formData);
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

  return {
    // Tab
    activeTab, setActiveTab,
    // Tournament filters
    search, setSearch,
    statusFilter, setStatusFilter,
    todayActive, setTodayActive,
    filteredTournaments,
    // Tournament modals
    showAddTournament, setShowAddTournament,
    detailTournament, setDetailTournament,
    editTournament, setEditTournament,
    savingTournament,
    showTournamentImport, setShowTournamentImport,
    // Event modals
    showAddEvent, setShowAddEvent,
    detailEvent, setDetailEvent,
    editEvent, setEditEvent,
    savingEvent,
    showEventImport, setShowEventImport,
    // Tournament actions
    handleAddTournament, handleEditTournament, handleDeleteTournament,
    // Event actions
    handleAddEvent, handleEditEvent, handleDeleteEvent,
  };
}
