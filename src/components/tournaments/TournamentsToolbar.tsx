// Search bar + status filter + CSV + "New Tournament" button for the tournaments page
import Btn from "@/components/shared/Btn";
import SearchInput from "@/components/shared/SearchInput";
import CsvExportBtn from "@/components/shared/CsvExportBtn";
import CsvImportBtn from "@/components/shared/CsvImportBtn";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, CalendarCheck } from "lucide-react";
import type { Tournament } from "@/types";

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
      <Select
        value={statusFilter}
        onValueChange={(v: string) => onStatusFilter(v as Tournament["status"] | "הכל")}
      >
        <SelectTrigger className="w-36 h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* כפתור "היום" — מסנן תחרויות שמתקיימות היום */}
      <Button
        variant="outline"
        onClick={onToggleToday}
        title="תחרויות שמתקיימות היום"
        className={`flex items-center gap-1.5 px-3 py-1.5 h-9 rounded-lg border text-sm transition-colors cursor-pointer ${
          todayActive
            ? "bg-teal-500 text-white border-teal-500 hover:bg-teal-600"
            : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
        }`}
      >
        <CalendarCheck size={14} />
        היום
      </Button>

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
