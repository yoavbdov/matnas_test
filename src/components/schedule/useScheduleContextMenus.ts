// Hook: returns handlers that open the right-click context menu
// for each entity type (class, tournament, event)

import { updateDocument, deleteDocument, deleteWhere } from "@/firebase/firestore";
import type { Class, Tournament, TournamentRound, Event as AppEvent } from "@/types";
import type { ContextMenuTarget } from "./ScheduleContextMenu";

// Note: this is not a React hook — it's a factory that returns plain functions.
// Call it once in the page and pass the setContextMenu + showToast it needs.
export function buildContextMenuHandlers(
  setContextMenu: (target: ContextMenuTarget | null) => void,
  showToast: (msg: string, type: "success" | "error") => void,
) {
  // ── Class ──
  function openClassContextMenu(e: React.MouseEvent, cls: Class, dateStr: string) {
    const isRecurring = cls.slots.some((s) => s.recurrence !== "חד פעמי");
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      label: cls.name,
      dateStr,
      isRecurring,
      // Cancel this single occurrence — adds the date to cancelled_dates
      onDeleteSingle: async () => {
        try {
          const cancelled = [...(cls.cancelled_dates ?? []), dateStr];
          await updateDocument("classes", cls.id, { cancelled_dates: cancelled });
          showToast("המפגש בוטל", "success");
        } catch { showToast("שגיאה בביטול המפגש", "error"); }
      },
      // Delete the entire class + all its enrollments
      onDeleteAll: async () => {
        try {
          await deleteDocument("classes", cls.id);
          await deleteWhere("enrollments", "class_id", cls.id);
          showToast("החוג נמחק", "success");
        } catch { showToast("שגיאה במחיקה", "error"); }
      },
    });
  }

  // ── Tournament ──
  function openTournamentContextMenu(
    e: React.MouseEvent,
    t: Tournament,
    round: TournamentRound,
    dateStr: string,
  ) {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      label: t.name,
      dateStr,
      isRecurring: !!t.is_recurring,
      // Recurring → add to cancelled_dates; Regular → remove the round
      onDeleteSingle: async () => {
        try {
          if (t.is_recurring) {
            const cancelled = [...(t.cancelled_dates ?? []), dateStr];
            await updateDocument("tournaments", t.id, { cancelled_dates: cancelled });
            showToast("המפגש בוטל", "success");
          } else {
            const updatedRounds = (t.rounds ?? []).filter((r) => r.id !== round.id);
            await updateDocument("tournaments", t.id, { rounds: updatedRounds });
            showToast("הסיבוב נמחק", "success");
          }
        } catch { showToast("שגיאה במחיקה", "error"); }
      },
      // Delete the entire tournament
      onDeleteAll: async () => {
        try {
          await deleteDocument("tournaments", t.id);
          showToast("התחרות נמחקה", "success");
        } catch { showToast("שגיאה במחיקה", "error"); }
      },
    });
  }

  // ── Event ──
  function openEventContextMenu(e: React.MouseEvent, ev: AppEvent, dateStr: string) {
    const isRecurring = ev.recurrence_type === "חוזר";
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      label: ev.name,
      dateStr,
      isRecurring,
      // Recurring → add to cancelled_dates; One-time → delete
      onDeleteSingle: async () => {
        try {
          if (isRecurring) {
            const cancelled = [...(ev.cancelled_dates ?? []), dateStr];
            await updateDocument("events", ev.id, { cancelled_dates: cancelled });
            showToast("המפגש בוטל", "success");
          } else {
            await deleteDocument("events", ev.id);
            showToast("האירוע נמחק", "success");
          }
        } catch { showToast("שגיאה במחיקה", "error"); }
      },
      onDeleteAll: async () => {
        try {
          await deleteDocument("events", ev.id);
          showToast("האירוע נמחק", "success");
        } catch { showToast("שגיאה במחיקה", "error"); }
      },
    });
  }

  return { openClassContextMenu, openTournamentContextMenu, openEventContextMenu };
}
