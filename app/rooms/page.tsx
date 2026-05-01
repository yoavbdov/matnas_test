"use client";
import { useState, useMemo } from "react";
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
import type { Room, Resource } from "@/lib/types";

type ActiveTab = "rooms" | "resources";

function emptyRoom(): Omit<Room, "id"> { return { name: "", capacity: 10, features: [] }; }
function emptyResource(): Omit<Resource, "id"> { return { name: "", quantity: 0 }; }

export default function RoomsPage() {
  const { rooms, resources, classes, settings } = useData();
  const { showToast } = useToast();

  const [tab, setTab] = useState<ActiveTab>("rooms");

  // ── פילטרי חדרים ──
  const [roomSearch, setRoomSearch] = useState("");
  const [featureFilter, setFeatureFilter] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");

  // ── פילטרי ציוד ──
  const [resourceSearch, setResourceSearch] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("");

  // ── מצב מודאל חדר ──
  const [roomModal, setRoomModal] = useState<"add" | "edit" | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState<Omit<Room, "id">>(emptyRoom());
  const [roomDeleteTarget, setRoomDeleteTarget] = useState<Room | null>(null);

  // ── מצב מודאל ציוד ──
  const [resourceModal, setResourceModal] = useState<"add" | "edit" | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resourceForm, setResourceForm] = useState<Omit<Resource, "id">>(emptyResource());
  const [resourceDeleteTarget, setResourceDeleteTarget] = useState<Resource | null>(null);

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
  const filteredResources = useMemo(() => {
    const q = resourceSearch.trim().toLowerCase();
    const minQ = minQuantity ? Number(minQuantity) : null;
    const maxQ = maxQuantity ? Number(maxQuantity) : null;
    return resources.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (minQ !== null && r.quantity < minQ) return false;
      if (maxQ !== null && r.quantity > maxQ) return false;
      return true;
    });
  }, [resources, resourceSearch, minQuantity, maxQuantity]);

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
  function openAddResource() { setResourceForm(emptyResource()); setSelectedResource(null); setResourceModal("add"); }
  function openEditResource(r: Resource) { setSelectedResource(r); setResourceForm({ ...r }); setResourceModal("edit"); }

  async function handleSaveResource() {
    if (!resourceForm.name.trim()) { showToast("שם הציוד הוא שדה חובה", "error"); return; }
    setSaving(true);
    try {
      if (resourceModal === "add") { await addDocument("physicalEquipment", resourceForm); showToast("הציוד נוסף", "success"); }
      else if (selectedResource) { await updateDocument("physicalEquipment", selectedResource.id, resourceForm); showToast("הציוד עודכן", "success"); }
      setResourceModal(null);
    } catch { showToast("שגיאה בשמירה", "error"); } finally { setSaving(false); }
  }

  async function handleDeleteResource() {
    if (!resourceDeleteTarget) return;
    try { await deleteDocument("physicalEquipment", resourceDeleteTarget.id); showToast("הציוד נמחק", "success"); }
    catch { showToast("שגיאה במחיקה", "error"); } finally { setResourceDeleteTarget(null); setResourceModal(null); }
  }

  // ── עמודות טבלאות (ללא עריכה/מחיקה — הכל בתוך המודאל) ──
  const roomColumns: Column<Room>[] = [
    { key: "name", label: "שם החדר" },
    { key: "number", label: "מספר", render: (r) => r.number || "—" },
    { key: "capacity", label: "קיבולת" },
    { key: "features", label: "תכונות", render: (r) => (r.features ?? []).join(", ") || "—" },
  ];

  const resourceColumns: Column<Resource>[] = [
    { key: "name", label: "שם" },
    { key: "quantity", label: "כמות" },
    { key: "notes", label: "הערות", render: (r) => r.notes || "—" },
  ];

  return (
    <PageShell title="חדרים וציוד">
      {/* טאבים */}
      <div className="flex gap-6 border-b border-gray-200 mb-5">
        {(["rooms", "resources"] as ActiveTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? "border-teal-500 text-teal-700" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t === "rooms" ? `חדרים (${rooms.length})` : `ציוד (${resources.length})`}
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
            search={resourceSearch} onSearch={setResourceSearch}
            minQuantity={minQuantity} onFilterMinQuantity={setMinQuantity}
            maxQuantity={maxQuantity} onFilterMaxQuantity={setMaxQuantity}
            onAdd={openAddResource}
            onCheckAvailability={() => setAvailabilityOpen(true)}
            maxSearchLength={settings.MAX_SEARCH_LENGTH}
          />
          <p className="text-xs text-gray-400 mb-3">{filteredResources.length} פריטי ציוד</p>
          <Table columns={resourceColumns} rows={filteredResources} onRowClick={openEditResource} sortable />
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

      {resourceModal && (
        <ResourceFormModal
          mode={resourceModal} form={resourceForm} setForm={setResourceForm}
          saving={saving} onClose={() => setResourceModal(null)} onSave={handleSaveResource}
          onDelete={resourceModal === "edit" && selectedResource ? () => setResourceDeleteTarget(selectedResource) : undefined}
          settings={settings}
        />
      )}
      {resourceDeleteTarget && (
        <ConfirmDialog
          message={`למחוק את "${resourceDeleteTarget.name}"?`}
          onConfirm={handleDeleteResource}
          onCancel={() => setResourceDeleteTarget(null)}
        />
      )}

      {availabilityOpen && (
        <AvailabilityCheckerModal resources={resources} classes={classes} onClose={() => setAvailabilityOpen(false)} />
      )}

      {importOpen && (
        <RoomUploadPanel onClose={() => setImportOpen(false)} />
      )}
    </PageShell>
  );
}
