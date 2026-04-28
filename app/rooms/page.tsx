"use client";
import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import Table, { Column } from "@/components/shared/Table";
import Modal from "@/components/shared/Modal";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Field from "@/components/shared/Field";
import TagInput from "@/components/shared/TagInput";
import Btn from "@/components/shared/Btn";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { addDocument, updateDocument, deleteDocument } from "@/firebase/firestore";
import type { Room } from "@/lib/types";

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

function emptyForm(): Omit<Room, "id"> {
  return { name: "", capacity: 10, features: [] };
}

export default function RoomsPage() {
  const { rooms, settings } = useData();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Room | null>(null);
  const [form, setForm] = useState<Omit<Room, "id">>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rooms.filter((r) => !q || r.name.toLowerCase().includes(q) || (r.number ?? "").includes(q));
  }, [rooms, search]);

  function openAdd() { setForm(emptyForm()); setSelected(null); setModal("add"); }
  function openEdit(r: Room) { setSelected(r); setForm({ ...r, features: r.features ?? [] }); setModal("edit"); }
  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.name.trim()) { showToast("שם החדר הוא שדה חובה", "error"); return; }
    if (form.capacity < 1) { showToast("קיבולת חייבת להיות לפחות 1", "error"); return; }
    setSaving(true);
    try {
      if (modal === "add") {
        await addDocument("rooms", form);
        showToast("החדר נוסף בהצלחה", "success");
      } else if (selected) {
        await updateDocument("rooms", selected.id, form);
        showToast("הפרטים עודכנו בהצלחה", "success");
      }
      setModal(null);
    } catch { showToast("שגיאה בשמירה, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDocument("rooms", deleteTarget.id);
      showToast("החדר נמחק", "success");
    } catch { showToast("שגיאה במחיקה", "error"); }
    finally { setDeleteTarget(null); }
  }

  const columns: Column<Room>[] = [
    { key: "name", label: "שם החדר" },
    { key: "number", label: "מספר", render: (r) => r.number || "—" },
    { key: "capacity", label: "קיבולת" },
    { key: "features", label: "תכונות", render: (r) => (r.features ?? []).join(", ") || "—" },
    { key: "notes", label: "הערות", render: (r) => r.notes || "—" },
    {
      key: "actions", label: "",
      render: (r) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Btn variant="ghost" className="text-xs px-2 py-1" onClick={() => openEdit(r)}>עריכה</Btn>
          <Btn variant="ghost" className="text-xs px-2 py-1 text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(r)}>מחיקה</Btn>
        </div>
      ),
    },
  ];

  return (
    <PageShell title="חדרים">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value.slice(0, settings.MAX_SEARCH_LENGTH))} placeholder="חיפוש לפי שם או מספר…" className="w-full border border-gray-200 rounded-lg pr-8 pl-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400" />
        </div>
        <Btn onClick={openAdd}><Plus size={15} />הוסף חדר</Btn>
      </div>

      <p className="text-xs text-gray-400 mb-3">{filtered.length} חדרים</p>
      <Table columns={columns} rows={filtered} onRowClick={openEdit} sortable />

      {modal && (
        <Modal
          title={modal === "add" ? "הוספת חדר" : "עריכת חדר"}
          onClose={() => setModal(null)}
          size="md"
          footer={<><Btn variant="secondary" onClick={() => setModal(null)}>ביטול</Btn><Btn onClick={handleSave} loading={saving}>שמור</Btn></>}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="שם החדר" required>
              <input className={inp} value={form.name} maxLength={settings.MAX_STRING_LENGTH} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="מספר חדר">
              <input className={inp} value={form.number ?? ""} maxLength={10} onChange={(e) => set("number", e.target.value)} />
            </Field>
            <Field label="קיבולת" required hint={`עד ${settings.MAX_ROOM_CAPACITY}`}>
              <input type="number" className={inp} value={form.capacity} min={1} max={settings.MAX_ROOM_CAPACITY} onChange={(e) => set("capacity", Math.max(1, Number(e.target.value)))} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="תכונות" hint="לדוגמה: מקרן, לוח, מזגן">
              <TagInput value={form.features ?? []} onChange={(v) => set("features", v)} maxTags={settings.MAX_TAGS_PER_FIELD} maxTagLength={settings.MAX_TAG_LENGTH} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="הערות">
              <textarea className={inp} rows={3} value={form.notes ?? ""} maxLength={settings.MAX_NOTE_LENGTH} onChange={(e) => set("notes", e.target.value)} />
            </Field>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`למחוק את החדר "${deleteTarget.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </PageShell>
  );
}
