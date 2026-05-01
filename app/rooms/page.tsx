"use client";
import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import Table, { Column } from "@/components/shared/Table";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Btn from "@/components/shared/Btn";
import RoomFormModal from "./RoomFormModal";
import ResourceFormModal from "./ResourceFormModal";
import AvailabilityCheckerModal from "./AvailabilityCheckerModal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { addDocument, updateDocument, deleteDocument } from "@/firebase/firestore";
import type { Room, Resource } from "@/lib/types";

type ActiveTab = "rooms" | "resources";

function emptyRoom(): Omit<Room, "id"> { return { name: "", capacity: 10, features: [] }; }
function emptyResource(): Omit<Resource, "id"> { return { name: "", type: "", quantity: 0 }; }

export default function RoomsPage() {
  const { rooms, resources, classes, settings } = useData();
  const { showToast } = useToast();

  const [tab, setTab] = useState<ActiveTab>("rooms");
  const [search, setSearch] = useState("");

  // Room state
  const [roomModal, setRoomModal] = useState<"add" | "edit" | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState<Omit<Room, "id">>(emptyRoom());
  const [roomDeleteTarget, setRoomDeleteTarget] = useState<Room | null>(null);

  // Resource state
  const [resourceModal, setResourceModal] = useState<"add" | "edit" | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resourceForm, setResourceForm] = useState<Omit<Resource, "id">>(emptyResource());
  const [resourceDeleteTarget, setResourceDeleteTarget] = useState<Resource | null>(null);

  const [saving, setSaving] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);

  // Filter by search
  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rooms.filter((r) => !q || r.name.toLowerCase().includes(q) || (r.number ?? "").includes(q));
  }, [rooms, search]);

  const filteredResources = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources.filter((r) => !q || r.name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q));
  }, [resources, search]);

  // ── Room handlers ──
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
    catch { showToast("שגיאה במחיקה", "error"); } finally { setRoomDeleteTarget(null); }
  }

  // ── Resource handlers ──
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
    catch { showToast("שגיאה במחיקה", "error"); } finally { setResourceDeleteTarget(null); }
  }

  const roomColumns: Column<Room>[] = [
    { key: "name", label: "שם החדר" },
    { key: "number", label: "מספר", render: (r) => r.number || "—" },
    { key: "capacity", label: "קיבולת" },
    { key: "features", label: "תכונות", render: (r) => (r.features ?? []).join(", ") || "—" },
    {
      key: "actions", label: "",
      render: (r) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Btn variant="ghost" className="text-xs px-2 py-1" onClick={() => openEditRoom(r)}>עריכה</Btn>
          <Btn variant="ghost" className="text-xs px-2 py-1 text-red-500 hover:bg-red-50" onClick={() => setRoomDeleteTarget(r)}>מחיקה</Btn>
        </div>
      ),
    },
  ];

  const resourceColumns: Column<Resource>[] = [
    { key: "name", label: "שם" },
    { key: "type", label: "סוג" },
    { key: "quantity", label: "כמות" },
    { key: "min_required", label: "מינימום", render: (r) => r.min_required !== undefined ? String(r.min_required) : "—" },
    { key: "notes", label: "הערות", render: (r) => r.notes || "—" },
    {
      key: "actions", label: "",
      render: (r) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Btn variant="ghost" className="text-xs px-2 py-1" onClick={() => openEditResource(r)}>עריכה</Btn>
          <Btn variant="ghost" className="text-xs px-2 py-1 text-red-500 hover:bg-red-50" onClick={() => setResourceDeleteTarget(r)}>מחיקה</Btn>
        </div>
      ),
    },
  ];

  return (
    <PageShell title="חדרים וציוד">
      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-5">
        {(["rooms", "resources"] as ActiveTab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch(""); }}
            className={`pb-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? "border-teal-500 text-teal-700" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t === "rooms" ? `חדרים (${rooms.length})` : `ציוד (${resources.length})`}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value.slice(0, settings.MAX_SEARCH_LENGTH))}
            placeholder={tab === "rooms" ? "חיפוש לפי שם או מספר…" : "חיפוש לפי שם או סוג…"}
            className="w-full border border-gray-200 rounded-lg pr-8 pl-3 py-2 text-sm focus:outline-none focus:border-teal-400"
          />
        </div>
        <div className="flex gap-2">
          {tab === "resources" && (
            <Btn variant="secondary" className="text-xs px-3 py-2" onClick={() => setAvailabilityOpen(true)}>
              בדוק זמינות
            </Btn>
          )}
          <Btn onClick={tab === "rooms" ? openAddRoom : openAddResource}>
            <Plus size={15} />{tab === "rooms" ? "הוסף חדר" : "הוסף ציוד"}
          </Btn>
        </div>
      </div>

      {/* Table */}
      {tab === "rooms" ? (
        <>
          <p className="text-xs text-gray-400 mb-3">{filteredRooms.length} חדרים</p>
          <Table columns={roomColumns} rows={filteredRooms} onRowClick={openEditRoom} sortable />
        </>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">{filteredResources.length} פריטי ציוד</p>
          <Table columns={resourceColumns} rows={filteredResources} onRowClick={openEditResource} sortable />
        </>
      )}

      {/* Modals */}
      {roomModal && (
        <RoomFormModal mode={roomModal} form={roomForm} setForm={setRoomForm} saving={saving} onClose={() => setRoomModal(null)} onSave={handleSaveRoom} settings={settings} />
      )}
      {roomDeleteTarget && (
        <ConfirmDialog message={`למחוק את החדר "${roomDeleteTarget.name}"?`} onConfirm={handleDeleteRoom} onCancel={() => setRoomDeleteTarget(null)} />
      )}

      {resourceModal && (
        <ResourceFormModal mode={resourceModal} form={resourceForm} setForm={setResourceForm} saving={saving} onClose={() => setResourceModal(null)} onSave={handleSaveResource} settings={settings} />
      )}
      {resourceDeleteTarget && (
        <ConfirmDialog message={`למחוק את "${resourceDeleteTarget.name}"?`} onConfirm={handleDeleteResource} onCancel={() => setResourceDeleteTarget(null)} />
      )}

      {availabilityOpen && (
        <AvailabilityCheckerModal resources={resources} classes={classes} onClose={() => setAvailabilityOpen(false)} />
      )}
    </PageShell>
  );
}
