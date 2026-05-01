"use client";
// סרגל חיפוש, סינון ופעולות מעל טבלת התלמידים
import { Search, Plus, Download, Upload } from "lucide-react";
import Btn from "@/components/shared/Btn";
import type { Class } from "@/lib/types";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  statusFilter: "הכל" | "פעיל" | "לא פעיל";
  onFilterStatus: (v: "הכל" | "פעיל" | "לא פעיל") => void;
  classFilter: string; // class id or ""
  onFilterClass: (id: string) => void;
  classes: Class[];
  onAddStudent: () => void;
  onExport: () => void;
  onImport: () => void;
  maxSearchLength: number;
}

export default function StudentsToolbar({
  search, onSearch, statusFilter, onFilterStatus,
  classFilter, onFilterClass, classes,
  onAddStudent, onExport, onImport, maxSearchLength,
}: Props) {
  const sel = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400";

  return (
    <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
      {/* Search + filters */}
      <div className="flex gap-2 flex-wrap flex-1">
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value.slice(0, maxSearchLength))}
            placeholder="חיפוש לפי שם, ת״ז, טלפון…"
            className="w-full border border-gray-200 rounded-lg pr-8 pl-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
          />
        </div>

        <select value={statusFilter} onChange={(e) => onFilterStatus(e.target.value as typeof statusFilter)} className={sel}>
          {(["הכל", "פעיל", "לא פעיל"] as const).map((s) => <option key={s}>{s}</option>)}
        </select>

        <select value={classFilter} onChange={(e) => onFilterClass(e.target.value)} className={sel}>
          <option value="">כל החוגים</option>
          {classes.filter((c) => c.status === "פעיל").map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Btn variant="secondary" onClick={onImport} className="text-xs px-3 py-2">
          <Upload size={13} />ייבוא
        </Btn>
        <Btn variant="secondary" onClick={onExport} className="text-xs px-3 py-2">
          <Download size={13} />ייצוא
        </Btn>
        <Btn onClick={onAddStudent}>
          <Plus size={15} />הוסף תלמיד
        </Btn>
      </div>
    </div>
  );
}
