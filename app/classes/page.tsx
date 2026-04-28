"use client";
import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import Table, { Column } from "@/components/shared/Table";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Badge from "@/components/shared/Badge";
import Btn from "@/components/shared/Btn";
import ClassFormModal from "@/components/classes/ClassFormModal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { addDocument, updateDocument, deleteDocument, deleteWhere } from "@/firebase/firestore";
import { CLASS_COLORS } from "@/lib/constants";
import type { Class } from "@/lib/types";

type StatusFilter = "הכל" | "פעיל" | "לא פעיל";

function emptyForm(): Omit<Class, "id"> {
  return { name: "", teacher_id: "", capacity: 10, status: "פעיל", color: CLASS_COLORS[0], slots: [], resource_ids: [] };
}

export default function ClassesPage() {
  const { classes, teachers, rooms, enrollments, settings } = useData();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("הכל");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Class | null>(null);
  const [form, setForm] = useState<Omit<Class, "id">>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Class | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classes.filter((c) => {
      if (statusFilter !== "הכל" && c.status !== statusFilter) return false;
      if (!q) return true;
      const t = teachers.find((t) => t.id === c.teacher_id);
      return c.name.toLowerCase().includes(q) || (t ? `${t.first_name} ${t.last_name}`.toLowerCase().includes(q) : false);
    });
  }, [classes, search, statusFilter, teachers]);

  function openAdd() { setForm(emptyForm()); setSelected(null); setModal("add"); }
  function openEdit(c: Class) { setSelected(c); setForm({ ...c, slots: c.slots ? [...c.slots] : [] }); setModal("edit"); }

  async function handleSave() {
    if (!form.name.trim()) { showToast("שם החוג הוא שדה חובה", "error"); return; }
    if (!form.teacher_id) { showToast("יש לבחור מדריך", "error"); return; }
    setSaving(true);
    try {
      if (modal === "add") {
        await addDocument("classes", form);
        showToast("החוג נוסף בהצלחה", "success");
      } else if (selected) {
        await updateDocument("classes", selected.id, form);
        showToast("החוג עודכן בהצלחה", "success");
      }
      setModal(null);
    } catch { showToast("שגיאה בשמירה, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDocument("classes", deleteTarget.id);
      await deleteWhere("enrollments", "class_id", deleteTarget.id);
      showToast("החוג נמחק", "success");
    } catch { showToast("שגיאה במחיקה", "error"); }
    finally { setDeleteTarget(null); }
  }

  const columns: Column<Class>[] = [
    { key: "color", label: "", render: (r) => <span className="inline-block w-3 h-3 rounded-full" style={{ background: r.color ?? "#ccc" }} /> },
    { key: "name", label: "שם החוג" },
    { key: "teacher_id", label: "מדריך", render: (r) => { const t = teachers.find((t) => t.id === r.teacher_id); return t ? `${t.first_name} ${t.last_name}` : "—"; } },
    { key: "slots", label: "ימים", render: (r) => (r.slots ?? []).map((s) => s.day).join(", ") || "—" },
    {
      key: "enrollment", label: "רישומים",
      render: (r) => {
        const enrolled = enrollments.filter((e) => e.class_id === r.id && e.status === "פעיל").length;
        const ratio = r.capacity > 0 ? enrolled / r.capacity : 0;
        const color = ratio >= 1 ? "text-red-600" : ratio >= 0.8 ? "text-orange-500" : "text-gray-700";
        return <span className={color}>{enrolled} / {r.capacity}</span>;
      },
    },
    { key: "status", label: "סטטוס", render: (r) => <Badge label={r.status} color={r.status === "פעיל" ? "green" : "gray"} /> },
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
    <PageShell title="חוגים">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value.slice(0, settings.MAX_SEARCH_LENGTH))} placeholder="חיפוש לפי שם חוג או מדריך…" className="w-full border border-gray-200 rounded-lg pr-8 pl-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            {(["הכל", "פעיל", "לא פעיל"] as StatusFilter[]).map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <Btn onClick={openAdd}><Plus size={15} />הוסף חוג</Btn>
      </div>

      <p className="text-xs text-gray-400 mb-3">{filtered.length} חוגים</p>
      <Table columns={columns} rows={filtered} onRowClick={openEdit} sortable />

      {modal && (
        <ClassFormModal
          mode={modal}
          form={form}
          setForm={setForm}
          saving={saving}
          onClose={() => setModal(null)}
          onSave={handleSave}
          teachers={teachers}
          rooms={rooms}
          settings={settings}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`למחוק את החוג "${deleteTarget.name}"? כל הרישומים לחוג זה יימחקו גם כן.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </PageShell>
  );
}
