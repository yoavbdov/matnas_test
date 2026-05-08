// Search bar + status filter + "New Tournament" button for the tournaments page
import Btn from "@/components/shared/Btn";
import { Plus } from "lucide-react";
import type { Tournament } from "@/lib/types";

const STATUS_OPTIONS: Array<Tournament["status"] | "הכל"> = [
  "הכל", "מתוכנן", "פעיל", "הסתיים", "בוטל",
];

interface Props {
  search: string;
  onSearch: (v: string) => void;
  statusFilter: Tournament["status"] | "הכל";
  onStatusFilter: (v: Tournament["status"] | "הכל") => void;
  onAdd: () => void;
}

export default function TournamentsToolbar({ search, onSearch, statusFilter, onStatusFilter, onAdd }: Props) {
  return (
    <div className="flex items-center gap-3 mb-5 flex-wrap" dir="rtl">

      {/* Search */}
      <input
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56"
        placeholder="חיפוש לפי שם תחרות..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Add button */}
      <Btn onClick={onAdd}>
        <Plus size={16} />
        תחרות חדשה
      </Btn>
    </div>
  );
}
