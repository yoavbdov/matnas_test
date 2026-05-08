"use client";
import { useState, useMemo, useEffect } from "react";
import PageShell from "@/components/shared/PageShell";
import Table, { Column } from "@/components/shared/Table";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import RoomFormModal from "./RoomFormModal";
import ResourceFormModal from "./ResourceFormModal";
import AvailabilityCheckerModal from "./AvailabilityCheckerModal";
import RoomUploadPanel from "./RoomUploadPanel";
import RoomsToolbar from "./RoomsToolbar";
import ResourcesToolbar from "./ResourcesToolbar";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { addDocument, updateDocument, deleteDocument } from "@/firebase/firestore";
import type { Room, PhysicalEquipment } from "@/lib/types";

type ActiveTab = "rooms" | "equipment";

function emptyRoom(): Omit<Room, "id"> { return { name: "", capacity: 10, features: [] }; }
function emptyEquipment(): Omit<PhysicalEquipment, "id"> { return { name: "", quantity: 0 }; }

export default function RoomsPage() {
  const { rooms, physicalEquipment, classes, tournaments, settings } = useData();
  const { showToast } = useToast();

  const [tab, setTab] = useState<ActiveTab>("rooms");

  // If the URL contains #equipment (e.g. from the tournament form link), jump to that tab
  useEffect(() => {
    if (window.location.hash === "#equipment") setTab("equipment");
  }, []);

  // ── פילטרי חדרים ──
  const [roomSearch, setRoomSearch] = useState("");
  const [featureFilter, setFeatureFilter] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");

  // ── פילטרי ציוד ──
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("");

  // ── מצב מודאל חדר ──
  const [roomModal, setRoomModal] = useState<"add" | "edit" | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState<Omit<Room, "id">>(emptyRoom());
  const [roomDeleteTarget, setRoomDeleteTarget] = useState<Room | null>(null);

  // ── מצב מודאל ציוד ──
  const [equipmentModal, setEquipmentModal] = useState<"add" | "edit" | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<PhysicalEquipment | null>(null);
  const [equipmentForm, setEquipmentForm] = useState<Omit<PhysicalEquipment, "id">>(emptyEquipment());
  const [equipmentDeleteTarget, setEquipmentDeleteTarget] = useState<PhysicalEquipment | null>(null);

  const [saving, setSaving] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // ── ייצוא חדרים ──
  function exportRoomsCSV() {
    const headers = ["שם החדר", "קיבולת", "מספר חדר", "תכונות", "הערות"];
    const rows = filteredRooms.map((r) => [
      r.name, r.capacity, r.number ?? "",
      (r.features ?? []).join("|"), r.notes ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "חדרים.csv"; a.click();
  }

  // ── ערכים ייחודיים לדרופדאונים ──
  const allFeatures = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach((r) => (r.features ?? []).forEach((f) => set.add(f)));
    return Array.from(set).sort();
  }, [rooms]);

  // ── סינון חדרים ──
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

  // ── סינון ציוד ──
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

  // ── פעולות חדר ──
  function openAddRoom() { setRoomForm(emptyRoom()); setSelectedRoom(null); setRoomModal("add"); }
  function openEditRoom(r: Room) { setSelectedRoom(r); setRoomForm({ ...r, features: r.features ?? [] }); setRoomModal("edit"); }

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
    catch { showToast("שגיאה במחיקה", "error"); } finally { setRoomDeleteTarget(null); setRoomModal(null); }
  }

  // ── פעולות ציוד ──
  function openAddEquipment() { setEquipmentForm(emptyEquipment()); setSelectedEquipment(null); setEquipmentModal("add"); }
  function openEditEquipment(r: PhysicalEquipment) { setSelectedEquipment(r); setEquipmentForm({ ...r }); setEquipmentModal("edit"); }

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
    catch { showToast("שגיאה במחיקה", "error"); } finally { setEquipmentDeleteTarget(null); setEquipmentModal(null); }
  }

  // ── עמודות טבלאות (ללא עריכה/מחיקה — הכל בתוך המודאל) ──
  const roomColumns: Column<Room>[] = [
    { key: "name", label: "שם החדר" },
    { key: "number", label: "מספר", render: (r) => r.number || "—" },
    { key: "capacity", label: "קיבולת" },
    { key: "features", label: "תכונות", render: (r) => (r.features ?? []).join(", ") || "—" },
  ];

  const equipmentColumns: Column<PhysicalEquipment>[] = [
    { key: "name", label: "שם" },
    { key: "quantity", label: "כמות" },
    { key: "notes", label: "הערות", render: (r) => r.notes || "—" },
  ];

  return (
    <PageShell title="חדרים וציוד">
      {/* טאבים */}
      <div className="flex gap-6 border-b border-gray-200 mb-5">
        {(["rooms", "equipment"] as ActiveTab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); window.location.hash = t === "equipment" ? "equipment" : ""; }}
            className={`pb-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? "border-teal-500 text-teal-700" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t === "rooms" ? `חדרים (${rooms.length})` : `ציוד (${physicalEquipment.length})`}
          </button>
        ))}
      </div>

      {/* סרגל כלים לפי טאב */}
      {tab === "rooms" ? (
        <>
          <RoomsToolbar
            search={roomSearch} onSearch={setRoomSearch}
            minCapacity={minCapacity} onFilterMinCapacity={setMinCapacity}
            maxCapacity={maxCapacity} onFilterMaxCapacity={setMaxCapacity}
            featureFilter={featureFilter} onFilterFeature={setFeatureFilter}
            allFeatures={allFeatures}
            onAdd={openAddRoom}
            onImport={() => setImportOpen(true)}
            onExport={exportRoomsCSV}
            maxSearchLength={settings.MAX_SEARCH_LENGTH}
          />
          <p className="text-xs text-gray-400 mb-3">{filteredRooms.length} חדרים</p>
          <Table columns={roomColumns} rows={filteredRooms} onRowClick={openEditRoom} sortable />
        </>
      ) : (
        <>
          <ResourcesToolbar
            search={equipmentSearch} onSearch={setEquipmentSearch}
            minQuantity={minQuantity} onFilterMinQuantity={setMinQuantity}
            maxQuantity={maxQuantity} onFilterMaxQuantity={setMaxQuantity}
            onAdd={openAddEquipment}
            onCheckAvailability={() => setAvailabilityOpen(true)}
            maxSearchLength={settings.MAX_SEARCH_LENGTH}
          />
          <p className="text-xs text-gray-400 mb-3">{filteredEquipment.length} פריטי ציוד</p>
          <Table columns={equipmentColumns} rows={filteredEquipment} onRowClick={openEditEquipment} sortable />
        </>
      )}

      {/* מודאלים */}
      {roomModal && (
        <RoomFormModal
          mode={roomModal} form={roomForm} setForm={setRoomForm}
          saving={saving} onClose={() => setRoomModal(null)} onSave={handleSaveRoom}
          onDelete={roomModal === "edit" && selectedRoom ? () => setRoomDeleteTarget(selectedRoom) : undefined}
          settings={settings}
        />
      )}
      {roomDeleteTarget && (
        <ConfirmDialog
          message={`למחוק את החדר "${roomDeleteTarget.name}"?`}
          onConfirm={handleDeleteRoom}
          onCancel={() => setRoomDeleteTarget(null)}
        />
      )}

      {equipmentModal && (
        <ResourceFormModal
          mode={equipmentModal} form={equipmentForm} setForm={setEquipmentForm}
          saving={saving} onClose={() => setEquipmentModal(null)} onSave={handleSaveEquipment}
          onDelete={equipmentModal === "edit" && selectedEquipment ? () => setEquipmentDeleteTarget(selectedEquipment) : undefined}
          settings={settings}
        />
      )}
      {equipmentDeleteTarget && (
        <ConfirmDialog
          message={`למחוק את "${equipmentDeleteTarget.name}"?`}
          onConfirm={handleDeleteEquipment}
          onCancel={() => setEquipmentDeleteTarget(null)}
        />
      )}

      {availabilityOpen && (
        <AvailabilityCheckerModal physicalEquipment={physicalEquipment} classes={classes} tournaments={tournaments} onClose={() => setAvailabilityOpen(false)} />
      )}

      {importOpen && (
        <RoomUploadPanel onClose={() => setImportOpen(false)} />
      )}
    </PageShell>
  );
}
