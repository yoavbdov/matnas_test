"use client";
// Rooms & Equipment page — all state lives in useRoomState.
import PageShell from "@/components/shared/PageShell";
import Table, { Column } from "@/components/shared/Table";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import RoomFormModal from "@/components/rooms/RoomFormModal";
import ResourceFormModal from "@/components/rooms/ResourceFormModal";
import AvailabilityCheckerModal from "@/components/rooms/AvailabilityCheckerModal";
import RoomUploadPanel from "@/components/rooms/RoomUploadPanel";
import EquipmentImportPanel from "@/components/rooms/EquipmentImportPanel";
import RoomAvailabilityModal from "@/components/rooms/RoomAvailabilityModal";
import RoomsToolbar from "@/components/rooms/RoomsToolbar";
import ResourcesToolbar from "@/components/rooms/ResourcesToolbar";
import { exportRoomsCsv } from "@/components/rooms/exportRoomsCsv";
import { exportEquipmentCsv } from "@/components/rooms/exportEquipmentCsv";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import type { Room, PhysicalEquipment, Event } from "@/types";
import { useCollection } from "@/firebase/hooks/useCollection";
import { useRoomState } from "@/components/rooms/useRoomState";

type ActiveTab = "rooms" | "equipment";

// Table column definitions — defined outside the component (no need to re-create on every render)
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

export default function RoomsPage() {
  const { rooms, physicalEquipment, classes, tournaments, settings } = useData();
  const { data: events } = useCollection<Event>("events");
  const { showToast } = useToast();

  // All state (filters + modals + CRUD) lives here
  const s = useRoomState({ rooms, physicalEquipment }, { showToast });

  return (
    <PageShell title="חדרים וציוד">
      {/* Tab bar */}
      <div className="flex gap-6 border-b border-gray-200 mb-5">
        {(["rooms", "equipment"] as ActiveTab[]).map((t) => (
          <Button
            key={t}
            variant="ghost"
            onClick={() => { s.setTab(t); window.location.hash = t === "equipment" ? "equipment" : ""; }}
            className={`pb-2.5 h-auto rounded-none text-sm font-medium border-b-2 border-x-0 border-t-0 transition-colors px-0 ${
              s.tab === t ? "border-teal-500 text-teal-700" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t === "rooms" ? `חדרים (${rooms.length})` : `ציוד (${physicalEquipment.length})`}
          </Button>
        ))}
      </div>

      {/* Rooms tab */}
      {s.tab === "rooms" ? (
        <>
          <RoomsToolbar
            search={s.roomSearch} onSearch={s.setRoomSearch}
            minCapacity={s.minCapacity} onFilterMinCapacity={s.setMinCapacity}
            maxCapacity={s.maxCapacity} onFilterMaxCapacity={s.setMaxCapacity}
            featureFilter={s.featureFilter} onFilterFeature={s.setFeatureFilter}
            allFeatures={s.allFeatures}
            onAdd={s.openAddRoom}
            onImport={() => s.setImportOpen(true)}
            onExport={() => exportRoomsCsv(s.filteredRooms)}
            onCheckAvailability={() => s.setRoomAvailabilityOpen(true)}
          />
          <p className="text-xs text-gray-400 mb-3">{s.filteredRooms.length} חדרים</p>
          <Table columns={roomColumns} rows={s.filteredRooms} onRowClick={s.openEditRoom} sortable />
        </>
      ) : (
        <>
          <ResourcesToolbar
            search={s.equipmentSearch} onSearch={s.setEquipmentSearch}
            minQuantity={s.minQuantity} onFilterMinQuantity={s.setMinQuantity}
            maxQuantity={s.maxQuantity} onFilterMaxQuantity={s.setMaxQuantity}
            onAdd={s.openAddEquipment}
            onCheckAvailability={() => s.setAvailabilityOpen(true)}
            onExport={() => exportEquipmentCsv(s.filteredEquipment)}
            onImport={() => s.setEquipmentImportOpen(true)}
          />
          <p className="text-xs text-gray-400 mb-3">{s.filteredEquipment.length} פריטי ציוד</p>
          <Table columns={equipmentColumns} rows={s.filteredEquipment} onRowClick={s.openEditEquipment} sortable />
        </>
      )}

      {/* Modals */}
      {s.roomModal && (
        <RoomFormModal
          mode={s.roomModal} form={s.roomForm} setForm={s.setRoomForm}
          saving={s.saving} onClose={() => s.setRoomModal(null)} onSave={s.handleSaveRoom}
          onDelete={s.roomModal === "edit" && s.selectedRoom ? () => s.setRoomDeleteTarget(s.selectedRoom) : undefined}
          settings={settings}
        />
      )}
      {s.roomDeleteTarget && (
        <ConfirmDialog
          message={`למחוק את החדר "${s.roomDeleteTarget.name}"?`}
          onConfirm={s.handleDeleteRoom}
          onCancel={() => s.setRoomDeleteTarget(null)}
        />
      )}

      {s.equipmentModal && (
        <ResourceFormModal
          mode={s.equipmentModal} form={s.equipmentForm} setForm={s.setEquipmentForm}
          saving={s.saving} onClose={() => s.setEquipmentModal(null)} onSave={s.handleSaveEquipment}
          onDelete={s.equipmentModal === "edit" && s.selectedEquipment ? () => s.setEquipmentDeleteTarget(s.selectedEquipment) : undefined}
          settings={settings}
        />
      )}
      {s.equipmentDeleteTarget && (
        <ConfirmDialog
          message={`למחוק את "${s.equipmentDeleteTarget.name}"?`}
          onConfirm={s.handleDeleteEquipment}
          onCancel={() => s.setEquipmentDeleteTarget(null)}
        />
      )}

      {s.availabilityOpen && (
        <AvailabilityCheckerModal physicalEquipment={physicalEquipment} classes={classes} tournaments={tournaments} onClose={() => s.setAvailabilityOpen(false)} />
      )}
      {s.roomAvailabilityOpen && (
        <RoomAvailabilityModal rooms={rooms} classes={classes} tournaments={tournaments} events={events} onClose={() => s.setRoomAvailabilityOpen(false)} />
      )}
      {s.importOpen && <RoomUploadPanel onClose={() => s.setImportOpen(false)} />}
      {s.equipmentImportOpen && <EquipmentImportPanel onClose={() => s.setEquipmentImportOpen(false)} />}
    </PageShell>
  );
}
