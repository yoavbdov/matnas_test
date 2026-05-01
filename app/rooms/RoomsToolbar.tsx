"use client";
// סרגל חיפוש, סינון ופעולות מעל טבלת החדרים
import { Search, Plus, Download, Upload } from "lucide-react";
import Btn from "@/components/shared/Btn";

const sel = "border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-teal-400 bg-white";
const numInp =
  "w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-teal-400 " +
  "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

// עוטף תווית + שדה לצד שמאל
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
  minCapacity: string;
  onFilterMinCapacity: (v: string) => void;
  maxCapacity: string;
  onFilterMaxCapacity: (v: string) => void;
  featureFilter: string;
  onFilterFeature: (v: string) => void;
  allFeatures: string[]; // כל התכונות הקיימות לדרופדאון
  onAdd: () => void;
  onImport: () => void;
  onExport: () => void;
  maxSearchLength: number;
}

export default function RoomsToolbar({
  search, onSearch,
  minCapacity, onFilterMinCapacity,
  maxCapacity, onFilterMaxCapacity,
  featureFilter, onFilterFeature, allFeatures,
  onAdd, onImport, onExport,
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
            placeholder="חיפוש לפי שם או מספר…"
            className="w-full border border-gray-200 rounded-lg pr-8 pl-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
          />
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={onImport} className="text-xs px-3 py-2">
            <Upload size={13} />העלאת מידע דרך CSV
          </Btn>
          <Btn variant="secondary" onClick={onExport} className="text-xs px-3 py-2">
            <Download size={13} />ייצוא מידע לCSV
          </Btn>
          <Btn onClick={onAdd}><Plus size={15} />הוסף חדר</Btn>
        </div>
      </div>

      {/* שורה 2: פילטרים */}
      <div className="flex gap-4 flex-wrap items-center">
        {/* פילטר לפי תכונה */}
        <FilterItem label="תכונה:">
          <select value={featureFilter} onChange={(e) => onFilterFeature(e.target.value)} className={sel}>
            <option value="">הכל</option>
            {allFeatures.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </FilterItem>

        {/* פילטר לפי קיבולת — טווח מינ׳ עד מקס׳ */}
        <FilterItem label="קיבולת:">
          <input type="number" placeholder="מינ׳" value={minCapacity}
            onChange={(e) => onFilterMinCapacity(e.target.value)} className={numInp} />
          <span className="text-gray-400 text-xs">—</span>
          <input type="number" placeholder="מקס׳" value={maxCapacity}
            onChange={(e) => onFilterMaxCapacity(e.target.value)} className={numInp} />
        </FilterItem>
      </div>
    </div>
  );
}
