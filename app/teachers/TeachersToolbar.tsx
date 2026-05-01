"use client";
// סרגל כלים מעל טבלת המדריכים
import { Search, Plus, Download } from "lucide-react";
import Btn from "@/components/shared/Btn";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  statusFilter: "הכל" | "פעיל" | "לא פעיל";
  onFilterStatus: (v: "הכל" | "פעיל" | "לא פעיל") => void;
  onAddTeacher: () => void;
  onExport: () => void;
  maxSearchLength: number;
}

export default function TeachersToolbar({
  search, onSearch, statusFilter, onFilterStatus, onAddTeacher, onExport, maxSearchLength,
}: Props) {
  const sel = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400";

  return (
    <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2 flex-1">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value.slice(0, maxSearchLength))}
            placeholder="חיפוש לפי שם, אימייל, טלפון…"
            className="w-full border border-gray-200 rounded-lg pr-8 pl-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
          />
        </div>
        <select value={statusFilter} onChange={(e) => onFilterStatus(e.target.value as typeof statusFilter)} className={sel}>
          {(["הכל", "פעיל", "לא פעיל"] as const).map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex gap-2">
        <Btn variant="secondary" onClick={onExport} className="text-xs px-3 py-2">
          <Download size={13} />ייצוא
        </Btn>
        <Btn onClick={onAddTeacher}>
          <Plus size={15} />הוסף מדריך
        </Btn>
      </div>
    </div>
  );
}
