"use client";
// Main page for League Groups.
// Displays groups split into 3 columns: בוגרים (right) | נוער (center) | נשים (left).
// Each column shows a mini-table of groups for that category.

import { useState } from "react";
import { Plus } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import Btn from "@/components/shared/Btn";
import CsvExportBtn from "@/components/shared/CsvExportBtn";
import CsvImportBtn from "@/components/shared/CsvImportBtn";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import LeagueGroupFormModal from "@/components/league-groups/LeagueGroupFormModal";
import LeagueGroupDetailModal from "@/components/league-groups/LeagueGroupDetailModal";
import LeagueGroupImportPanel from "@/components/league-groups/LeagueGroupImportPanel";
import CategoryColumn from "@/components/league-groups/CategoryColumn";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { addDocument, updateDocument, deleteDocument, deleteWhere } from "@/firebase/firestore";
import { exportLeagueGroupsCsv } from "@/components/league-groups/exportLeagueGroupsCsv";
import type { LeagueGroup, LeagueCategory } from "@/types";

// Default empty form for a new group (no category pre-selected)
function emptyForm(): Omit<LeagueGroup, "id"> {
  return { name: "", status: "פעיל", category: "בוגרים", leagueType: "ג" };
}

export default function LeagueGroupsPage() {
  const { leagueGroups, leagueGroupMembers, students, settings } = useData();
  const { showToast } = useToast();

  // Which modal is open
  const [formModal, setFormModal] = useState<"add" | "edit" | null>(null);
  const [detailGroup, setDetailGroup] = useState<LeagueGroup | null>(null);
  // Group pending deletion confirmation
  const [deleteTarget, setDeleteTarget] = useState<LeagueGroup | null>(null);

  // Form state for add / edit
  const [form, setForm] = useState<Omit<LeagueGroup, "id">>(emptyForm());
  const [editTarget, setEditTarget] = useState<LeagueGroup | null>(null);
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);

  function openAdd() {
    setForm(emptyForm());
    setEditTarget(null);
    setFormModal("add");
  }

  function openEdit(group: LeagueGroup) {
    setEditTarget(group);
    setForm({ ...group });
    setFormModal("edit");
    setDetailGroup(null);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      showToast("שם הקבוצה הוא שדה חובה", "error");
      return;
    }
    setSaving(true);
    try {
      if (formModal === "add") {
        await addDocument("leagueGroups", {
          ...form,
          created_at: new Date().toISOString().slice(0, 10),
        });
        showToast("הקבוצה נוצרה בהצלחה", "success");
      } else if (editTarget) {
        await updateDocument("leagueGroups", editTarget.id, form);
        showToast("הקבוצה עודכנה בהצלחה", "success");
      }
      setFormModal(null);
    } catch {
      showToast("שגיאה בשמירה, נסה שוב", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      // Delete all members of this group first, then the group itself
      await deleteWhere("leagueGroupMembers", "group_id", deleteTarget.id);
      await deleteDocument("leagueGroups", deleteTarget.id);
      showToast("הקבוצה נמחקה", "success");
      setDeleteTarget(null);
      setDetailGroup(null);
    } catch {
      showToast("שגיאה במחיקה, נסה שוב", "error");
    } finally {
      setSaving(false);
    }
  }

  // Split groups by category for the 3 columns
  function groupsFor(cat: LeagueCategory) {
    return leagueGroups.filter((g) => g.category === cat);
  }

  return (
    <PageShell title="קבוצות ליגה">
      {/* Toolbar */}
      <div className="flex justify-center items-center gap-2 mb-6">
        <CsvImportBtn onClick={() => setShowImport(true)} />
        <CsvExportBtn onClick={() => exportLeagueGroupsCsv(leagueGroups)} />
        <Btn onClick={openAdd}>
          <Plus size={15} />
          קבוצה חדשה
        </Btn>
      </div>

      {/* 3-column layout: בוגרים | נוער | נשים — divided by vertical lines */}
      <div className="grid grid-cols-[1fr_1px_1fr_1px_1fr] gap-0">
        {/* Right column — בוגרים */}
        <div className="px-4">
          <CategoryColumn
            title="בוגרים"
            groups={groupsFor("בוגרים")}
            members={leagueGroupMembers}
            onRowClick={setDetailGroup}
          />
        </div>

        {/* Divider */}
        <div className="bg-gray-600 rounded-full" />

        {/* Center column — נוער */}
        <div className="px-4">
          <CategoryColumn
            title="נוער"
            groups={groupsFor("נוער")}
            members={leagueGroupMembers}
            onRowClick={setDetailGroup}
          />
        </div>

        {/* Divider */}
        <div className="bg-gray-600 rounded-full" />

        {/* Left column — נשים */}
        <div className="px-4">
          <CategoryColumn
            title="נשים"
            groups={groupsFor("נשים")}
            members={leagueGroupMembers}
            onRowClick={setDetailGroup}
          />
        </div>
      </div>

      {/* Add / Edit form modal */}
      {formModal && (
        <LeagueGroupFormModal
          mode={formModal}
          form={form}
          setForm={setForm}
          saving={saving}
          onClose={() => setFormModal(null)}
          onSave={handleSave}
          settings={settings}
        />
      )}

      {/* Detail + members modal */}
      {detailGroup && (
        <LeagueGroupDetailModal
          group={detailGroup}
          members={leagueGroupMembers}
          students={students}
          onClose={() => setDetailGroup(null)}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          settings={settings}
        />
      )}

      {/* Import modal */}
      {showImport && (
        <LeagueGroupImportPanel onClose={() => setShowImport(false)} />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          message={`האם למחוק את הקבוצה "${deleteTarget.name}"? כל השחקנים יוסרו ממנה.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </PageShell>
  );
}
