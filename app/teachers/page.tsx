"use client";
import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import Table, { Column } from "@/components/shared/Table";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Badge from "@/components/shared/Badge";
import Btn from "@/components/shared/Btn";
import TeacherFormModal from "@/components/teachers/TeacherFormModal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { addDocument, updateDocument, deleteDocument } from "@/firebase/firestore";
import type { Teacher } from "@/lib/types";

type StatusFilter = "הכל" | "פעיל" | "לא פעיל";

function emptyForm(): Omit<Teacher, "id"> {
  return { first_name: "", last_name: "", status: "פעיל", certifications: [] };
}

export default function TeachersPage() {
  const { teachers, classes, settings } = useData();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("הכל");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Teacher | null>(null);
  const [form, setForm] = useState<Omit<Teacher, "id">>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers.filter((t) => {
      if (statusFilter !== "הכל" && t.status !== statusFilter) return false;
      if (!q) return true;
      return `${t.first_name} ${t.last_name}`.toLowerCase().includes(q) ||
        (t.email ?? "").toLowerCase().includes(q) || (t.phone ?? "").includes(q);
    });
  }, [teachers, search, statusFilter]);

  function openAdd() { setForm(emptyForm()); setSelected(null); setModal("add"); }
  function openEdit(t: Teacher) { setSelected(t); setForm({ ...t, certifications: t.certifications ?? [] }); setModal("edit"); }

  async function handleSave() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      showToast("שם פרטי ושם משפחה הם שדות חובה", "error"); return;
    }
    setSaving(true);
    try {
      if (modal === "add") {
        await addDocument("teachers", form);
        showToast("המדריך נוסף בהצלחה", "success");
      } else if (selected) {
        await updateDocument("teachers", selected.id, form);
        showToast("הפרטים עודכנו בהצלחה", "success");
      }
      setModal(null);
    } catch { showToast("שגיאה בשמירה, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDocument("teachers", deleteTarget.id);
      showToast("המדריך נמחק", "success");
    } catch { showToast("שגיאה במחיקה", "error"); }
    finally { setDeleteTarget(null); }
  }

  const columns: Column<Teacher>[] = [
    { key: "first_name", label: "שם פרטי" },
    { key: "last_name", label: "שם משפחה" },
    { key: "phone", label: "טלפון", render: (r) => r.phone || "—" },
    { key: "email", label: "אימייל", render: (r) => r.email || "—" },
    { key: "subject", label: "תחום", render: (r) => r.subject || "—" },
    { key: "classes_count", label: "חוגים פעילים", render: (r) => String(classes.filter((c) => c.teacher_id === r.id && c.status === "פעיל").length) },
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
    <PageShell title="מדריכים">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value.slice(0, settings.MAX_SEARCH_LENGTH))} placeholder="חיפוש לפי שם, אימייל…" className="w-full border border-gray-200 rounded-lg pr-8 pl-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            {(["הכל", "פעיל", "לא פעיל"] as StatusFilter[]).map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <Btn onClick={openAdd}><Plus size={15} />הוסף מדריך</Btn>
      </div>

      <p className="text-xs text-gray-400 mb-3">{filtered.length} מדריכים</p>
      <Table columns={columns} rows={filtered} onRowClick={openEdit} sortable />

      {modal && (
        <TeacherFormModal
          mode={modal}
          form={form}
          setForm={setForm}
          saving={saving}
          onClose={() => setModal(null)}
          onSave={handleSave}
          settings={settings}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`למחוק את ${deleteTarget.first_name} ${deleteTarget.last_name}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </PageShell>
  );
}
