// Hook: owns all filter + modal + CRUD state for the Rooms & Equipment page

import { useState, useMemo, useEffect } from "react";
import { addDocument, updateDocument, deleteDocument } from "@/firebase/firestore";
import type { Room, PhysicalEquipment } from "@/lib/types";

type ActiveTab = "rooms" | "equipment";

function emptyRoom(): Omit<Room, "id"> { return { name: "", capacity: 10, features: [] }; }
function emptyEquipment(): Omit<PhysicalEquipment, "id"> { return { name: "", quantity: 0 }; }

interface Data {
  rooms: Room[];
  physicalEquipment: PhysicalEquipment[];
}

interface Deps {
  showToast: (msg: string, type: "success" | "error") => void;
}

export function useRoomState(data: Data, { showToast }: Deps) {
  const { rooms, physicalEquipment } = data;

  // ── Tab state ──
  const [tab, setTab] = useState<ActiveTab>("rooms");

  // Jump to equipment tab if URL contains #equipment
  useEffect(() => {
    if (window.location.hash === "#equipment") setTab("equipment");
  }, []);

  // ── Room filter state ──
  const [roomSearch, setRoomSearch] = useState("");
  const [featureFilter, setFeatureFilter] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");

  // ── Equipment filter state ──
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("");

  // ── Room modal state ──
  const [roomModal, setRoomModal] = useState<"add" | "edit" | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState<Omit<Room, "id">>(emptyRoom());
  const [roomDeleteTarget, setRoomDeleteTarget] = useState<Room | null>(null);

  // ── Equipment modal state ──
  const [equipmentModal, setEquipmentModal] = useState<"add" | "edit" | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<PhysicalEquipment | null>(null);
  const [equipmentForm, setEquipmentForm] = useState<Omit<PhysicalEquipment, "id">>(emptyEquipment());
  const [equipmentDeleteTarget, setEquipmentDeleteTarget] = useState<PhysicalEquipment | null>(null);

  const [saving, setSaving] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [roomAvailabilityOpen, setRoomAvailabilityOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [equipmentImportOpen, setEquipmentImportOpen] = useState(false);

  // ── Unique feature values for the dropdown ──
  const allFeatures = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach((r) => (r.features ?? []).forEach((f) => set.add(f)));
    return Array.from(set).sort();
  }, [rooms]);

  // ── Filtered rooms ──
  const filteredRooms = useMemo(() => {
    const q = roomSearch.trim().toLowerCase();
    const minC = minCapacity ? Number(minCapacity) : null;
    const maxC = maxCapacity ? Number(maxCapacity) : null;
    return rooms.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !(r.number ?? "").includes(q)) return false;
      if (featureFilter && !(r.features ?? []).includes(featureFilter)) return false;
      if (minC !== null && r.capacity < minC) return false;
      if (maxC !== null && r.capacity > maxC) return false;
      return true;
    });
  }, [rooms, roomSearch, featureFilter, minCapacity, maxCapacity]);

  // ── Filtered equipment ──
  const filteredEquipment = useMemo(() => {
    const q = equipmentSearch.trim().toLowerCase();
    const minQ = minQuantity ? Number(minQuantity) : null;
    const maxQ = maxQuantity ? Number(maxQuantity) : null;
    return physicalEquipment.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (minQ !== null && r.quantity < minQ) return false;
      if (maxQ !== null && r.quantity > maxQ) return false;
      return true;
    });
  }, [physicalEquipment, equipmentSearch, minQuantity, maxQuantity]);

  // ── Room CRUD ──
  function openAddRoom() { setRoomForm(emptyRoom()); setSelectedRoom(null); setRoomModal("add"); }
  function openEditRoom(r: Room) {
    setSelectedRoom(r);
    setRoomForm({ ...r, features: r.features ?? [] });
    setRoomModal("edit");
  }

  async function handleSaveRoom() {
    if (!roomForm.name.trim()) { showToast("שם החדר הוא שדה חובה", "error"); return; }
    setSaving(true);
    try {
      if (roomModal === "add") { await addDocument("rooms", roomForm); showToast("החדר נוסף", "success"); }
      else if (selectedRoom) { await updateDocument("rooms", selectedRoom.id, roomForm); showToast("החדר עודכן", "success"); }
      setRoomModal(null);
    } catch { showToast("שגיאה בשמירה", "error"); } finally { setSaving(false); }
  }

  async function handleDeleteRoom() {
    if (!roomDeleteTarget) return;
    try { await deleteDocument("rooms", roomDeleteTarget.id); showToast("החדר נמחק", "success"); }
    catch { showToast("שגיאה במחיקה", "error"); }
    finally { setRoomDeleteTarget(null); setRoomModal(null); }
  }

  // ── Equipment CRUD ──
  function openAddEquipment() { setEquipmentForm(emptyEquipment()); setSelectedEquipment(null); setEquipmentModal("add"); }
  function openEditEquipment(r: PhysicalEquipment) {
    setSelectedEquipment(r);
    setEquipmentForm({ ...r });
    setEquipmentModal("edit");
  }

  async function handleSaveEquipment() {
    if (!equipmentForm.name.trim()) { showToast("שם הציוד הוא שדה חובה", "error"); return; }
    setSaving(true);
    try {
      if (equipmentModal === "add") { await addDocument("physicalEquipment", equipmentForm); showToast("הציוד נוסף", "success"); }
      else if (selectedEquipment) { await updateDocument("physicalEquipment", selectedEquipment.id, equipmentForm); showToast("הציוד עודכן", "success"); }
      setEquipmentModal(null);
    } catch { showToast("שגיאה בשמירה", "error"); } finally { setSaving(false); }
  }

  async function handleDeleteEquipment() {
    if (!equipmentDeleteTarget) return;
    try { await deleteDocument("physicalEquipment", equipmentDeleteTarget.id); showToast("הציוד נמחק", "success"); }
    catch { showToast("שגיאה במחיקה", "error"); }
    finally { setEquipmentDeleteTarget(null); setEquipmentModal(null); }
  }

  return {
    // Tab
    tab, setTab,
    // Room filters
    roomSearch, setRoomSearch,
    featureFilter, setFeatureFilter,
    minCapacity, setMinCapacity,
    maxCapacity, setMaxCapacity,
    allFeatures, filteredRooms,
    // Equipment filters
    equipmentSearch, setEquipmentSearch,
    minQuantity, setMinQuantity,
    maxQuantity, setMaxQuantity,
    filteredEquipment,
    // Room modal
    roomModal, setRoomModal,
    selectedRoom,
    roomForm, setRoomForm,
    roomDeleteTarget, setRoomDeleteTarget,
    // Equipment modal
    equipmentModal, setEquipmentModal,
    selectedEquipment,
    equipmentForm, setEquipmentForm,
    equipmentDeleteTarget, setEquipmentDeleteTarget,
    // Shared
    saving,
    availabilityOpen, setAvailabilityOpen,
    roomAvailabilityOpen, setRoomAvailabilityOpen,
    importOpen, setImportOpen,
    equipmentImportOpen, setEquipmentImportOpen,
    // Actions
    openAddRoom, openEditRoom, handleSaveRoom, handleDeleteRoom,
    openAddEquipment, openEditEquipment, handleSaveEquipment, handleDeleteEquipment,
  };
}
