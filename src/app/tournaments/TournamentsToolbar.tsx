// Search bar + status filter + CSV + "New Tournament" button for the tournaments page
import Btn from "@/components/shared/Btn";
import SearchInput from "@/components/shared/SearchInput";
import CsvExportBtn from "@/components/shared/CsvExportBtn";
import CsvImportBtn from "@/components/shared/CsvImportBtn";
import { Plus, CalendarCheck } from "lucide-react";
import type { Tournament } from "@/lib/types";

const STATUS_OPTIONS: Array<Tournament["status"] | "הכל"> = [
  "הכל", "מתוכנן", "פעיל", "הסתיים", "בוטל",
];

interface Props {
  search: string;
  onSearch: (v: string) => void;
  statusFilter: Tournament["status"] | "הכל";
  onStatusFilter: (v: Tournament["status"] | "הכל") => void;
  todayActive: boolean;
  onToggleToday: () => void;
  onAdd: () => void;
  onExport: () => void;
  onImport: () => void;
}

export default function TournamentsToolbar({ search, onSearch, statusFilter, onStatusFilter, todayActive, onToggleToday, onAdd, onExport, onImport }: Props) {
  return (
    <div className="flex items-center gap-3 mb-5 flex-wrap" dir="rtl">

      {/* Search */}
      <SearchInput
        value={search}
        onChange={onSearch}
        placeholder="חיפוש לפי שם תחרות..."
        className="w-56"
      />

      {/* Status filter */}
      <select
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        value={statusFilter}
        onChange={(e) => onStatusFilter(e.target.value as Tournament["status"] | "הכל")}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* כפתור "היום" — מסנן תחרויות שמתקיימות היום */}
      <button
        onClick={onToggleToday}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors cursor-pointer ${
          todayActive
            ? "bg-teal-500 text-white border-teal-500"
            : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
        }`}
        title="תחרויות שמתקיימות היום"
      >
        <CalendarCheck size={14} />
        היום
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* CSV buttons — ייבוא ימין, ייצוא שמאל */}
      <CsvImportBtn onClick={onImport} />
      <CsvExportBtn onClick={onExport} />

      {/* Add button */}
      <Btn onClick={onAdd}>
        <Plus size={16} />
        תחרות חדשה
      </Btn>
    </div>
  );
}
