"use client";
// סרגל חיפוש, סינון ופעולות מעל טבלת הציוד
import { Search, Plus } from "lucide-react";
import Btn from "@/components/shared/Btn";

const numInp =
  "w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-teal-400 " +
  "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

function FilterItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{label}</span>
      {children}
    </div>
  );
}

interface Props {
  search: string;
  onSearch: (v: string) => void;
  minQuantity: string;
  onFilterMinQuantity: (v: string) => void;
  maxQuantity: string;
  onFilterMaxQuantity: (v: string) => void;
  onAdd: () => void;
  onCheckAvailability: () => void;
  maxSearchLength: number;
}

export default function ResourcesToolbar({
  search, onSearch,
  minQuantity, onFilterMinQuantity,
  maxQuantity, onFilterMaxQuantity,
  onAdd, onCheckAvailability,
  maxSearchLength,
}: Props) {
  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* שורה 1: חיפוש + כפתורי פעולה */}
      <div className="flex gap-2 items-center justify-between">
        <div className="relative min-w-45 flex-1 max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value.slice(0, maxSearchLength))}
            placeholder="חיפוש לפי שם…"
            className="w-full border border-gray-200 rounded-lg pr-8 pl-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
          />
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" className="text-xs px-3 py-2" onClick={onCheckAvailability}>
            בדוק זמינות
          </Btn>
          <Btn onClick={onAdd}><Plus size={15} />הוסף ציוד</Btn>
        </div>
      </div>

      {/* שורה 2: פילטר כמות */}
      <div className="flex gap-4 flex-wrap items-center">
        <FilterItem label="כמות:">
          <input type="number" placeholder="מינ׳" value={minQuantity}
            onChange={(e) => onFilterMinQuantity(e.target.value)} className={numInp} />
          <span className="text-gray-400 text-xs">—</span>
          <input type="number" placeholder="מקס׳" value={maxQuantity}
            onChange={(e) => onFilterMaxQuantity(e.target.value)} className={numInp} />
        </FilterItem>
      </div>
    </div>
  );
}
