"use client";
// סרגל כלים מעל טבלת המדריכים
import { Plus, CalendarCheck } from "lucide-react";
import Btn from "@/components/shared/Btn";
import CsvExportBtn from "@/components/shared/CsvExportBtn";
import CsvImportBtn from "@/components/shared/CsvImportBtn";
import SearchInput from "@/components/shared/SearchInput";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  statusFilter: "הכל" | "פעיל" | "לא פעיל";
  onFilterStatus: (v: "הכל" | "פעיל" | "לא פעיל") => void;
  onAddTeacher: () => void;
  onCheckAvailability: () => void;
  onExport: () => void;
  onImport: () => void;
}

export default function TeachersToolbar({
  search, onSearch, statusFilter, onFilterStatus, onAddTeacher, onCheckAvailability, onExport, onImport,
}: Props) {
  const sel = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400";

  return (
    <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2 flex-1">
        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder="חיפוש לפי שם, אימייל, טלפון…"
        />
        <select value={statusFilter} onChange={(e) => onFilterStatus(e.target.value as typeof statusFilter)} className={sel}>
          {(["הכל", "פעיל", "לא פעיל"] as const).map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex gap-2">
        <CsvImportBtn onClick={onImport} />
        <CsvExportBtn onClick={onExport} />
        <Btn variant="secondary" onClick={onCheckAvailability}>
          <CalendarCheck size={15} />בדוק זמינות
        </Btn>
        <Btn onClick={onAddTeacher}>
          <Plus size={15} />הוסף מדריך
        </Btn>
      </div>
    </div>
  );
}
