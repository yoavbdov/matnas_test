"use client";
import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import Table, { Column } from "@/components/shared/Table";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Badge from "@/components/shared/Badge";
import Btn from "@/components/shared/Btn";
import StudentFormModal from "@/components/students/StudentFormModal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { addDocument, updateDocument, deleteDocument, deleteWhere } from "@/firebase/firestore";
import type { Child } from "@/lib/types";

type StatusFilter = "הכל" | "פעיל" | "לא פעיל";

function emptyForm(): Omit<Child, "id"> {
  return { first_name: "", last_name: "", dob: "", status: "פעיל" };
}

export default function StudentsPage() {
  const { students, settings } = useData();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("הכל");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Child | null>(null);
  const [form, setForm] = useState<Omit<Child, "id">>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Child | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (statusFilter !== "הכל" && s.status !== statusFilter) return false;
      if (!q) return true;
      return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        (s.israeli_id ?? "").includes(q) || (s.phone ?? "").includes(q);
    });
  }, [students, search, statusFilter]);

  function openAdd() { setForm(emptyForm()); setSelected(null); setModal("add"); }
  function openEdit(s: Child) { setSelected(s); setForm({ ...s }); setModal("edit"); }

  async function handleSave() {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.dob) {
      showToast("שם ותאריך לידה הם שדות חובה", "error"); return;
    }
    setSaving(true);
    try {
      if (modal === "add") {
        await addDocument("students", { ...form, created_at: new Date().toISOString().slice(0, 10) });
        showToast("התלמיד נוסף בהצלחה", "success");
      } else if (selected) {
        await updateDocument("students", selected.id, form);
        showToast("הפרטים עודכנו בהצלחה", "success");
      }
      setModal(null);
    } catch { showToast("שגיאה בשמירה, נסה שוב", "error"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDocument("students", deleteTarget.id);
      await deleteWhere("enrollments", "child_id", deleteTarget.id);
      showToast("התלמיד נמחק", "success");
    } catch { showToast("שגיאה במחיקה", "error"); }
    finally { setDeleteTarget(null); }
  }

  const columns: Column<Child>[] = [
    { key: "first_name", label: "שם פרטי" },
    { key: "last_name", label: "שם משפחה" },
    { key: "dob", label: "ת. לידה" },
    { key: "phone", label: "טלפון", render: (r) => r.phone || "—" },
    { key: "parent_name", label: "הורה", render: (r) => r.parent_name || "—" },
    { key: "israeli_rating", label: "דירוג", render: (r) => r.israeli_rating ? String(r.israeli_rating) : "—" },
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
    <PageShell title="תלמידים">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value.slice(0, settings.MAX_SEARCH_LENGTH))} placeholder="חיפוש לפי שם, ת״ז, טלפון…" className="w-full border border-gray-200 rounded-lg pr-8 pl-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            {(["הכל", "פעיל", "לא פעיל"] as StatusFilter[]).map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <Btn onClick={openAdd}><Plus size={15} />הוסף תלמיד</Btn>
      </div>

      <p className="text-xs text-gray-400 mb-3">{filtered.length} תלמידים</p>
      <Table columns={columns} rows={filtered} onRowClick={openEdit} sortable />

      {modal && (
        <StudentFormModal
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
          message={`למחוק את ${deleteTarget.first_name} ${deleteTarget.last_name}? כל הרישומים שלו/ה יימחקו גם כן.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </PageShell>
  );
}
