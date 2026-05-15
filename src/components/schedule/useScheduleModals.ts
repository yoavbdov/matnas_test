// Hook: owns all modal + edit state for the Schedule page
// Keeps page.tsx free of useState calls

import { useState } from "react";
import type { Class, Tournament, Event } from "@/types";
import type { ContextMenuTarget } from "./ScheduleContextMenu";

export function useScheduleModals() {
  // Class modals
  const [detailClass, setDetailClass] = useState<Class | null>(null);
  const [editTarget, setEditTarget] = useState<Class | null>(null);
  const [saving, setSaving] = useState(false);

  // Tournament modals
  const [detailTournament, setDetailTournament] = useState<Tournament | null>(null);
  // For recurring tournaments: the specific calendar date the user clicked
  const [detailOccurrenceDate, setDetailOccurrenceDate] = useState<string | null>(null);
  const [editTournament, setEditTournament] = useState<Tournament | null>(null);

  // Event modals
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);

  // Right-click context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuTarget | null>(null);

  return {
    // Class
    detailClass, setDetailClass,
    editTarget, setEditTarget,
    saving, setSaving,
    // Tournament
    detailTournament, setDetailTournament,
    detailOccurrenceDate, setDetailOccurrenceDate,
    editTournament, setEditTournament,
    // Event
    detailEvent, setDetailEvent,
    editEvent, setEditEvent,
    savingEvent, setSavingEvent,
    // Context menu
    contextMenu, setContextMenu,
  };
}
