"use client";
// סרגל חיפוש, סינון ופעולות מעל טבלת הציוד
import { Plus } from "lucide-react";
import SearchInput from "@/components/shared/SearchInput";
import Btn from "@/components/shared/Btn";
import CsvExportBtn from "@/components/shared/CsvExportBtn";
import CsvImportBtn from "@/components/shared/CsvImportBtn";
import CheckAvailabilityBtn from "@/components/shared/CheckAvailabilityBtn";
import { Input } from "@/components/ui/input";

// Class for number inputs — hides spin buttons
const numInp =
  "w-20 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

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
  onExport: () => void;
  onImport: () => void;
}

export default function ResourcesToolbar({
  search, onSearch,
  minQuantity, onFilterMinQuantity,
  maxQuantity, onFilterMaxQuantity,
  onAdd, onCheckAvailability, onExport, onImport,
}: Props) {
  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* שורה 1: חיפוש + כפתורי פעולה */}
      <div className="flex gap-2 items-center justify-between">
        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder="חיפוש לפי שם…"
          className="min-w-45 flex-1 max-w-xs"
        />
        <div className="flex gap-2">
          <CheckAvailabilityBtn onClick={onCheckAvailability} />
          <CsvImportBtn onClick={onImport} />
          <CsvExportBtn onClick={onExport} />
          <Btn onClick={onAdd}><Plus size={15} />הוסף ציוד</Btn>
        </div>
      </div>

      {/* שורה 2: פילטר כמות */}
      <div className="flex gap-4 flex-wrap items-center">
        <FilterItem label="כמות:">
          <Input type="number" placeholder="מינ׳" value={minQuantity}
            onChange={(e) => onFilterMinQuantity(e.target.value)} className={numInp} />
          <span className="text-gray-400 text-xs">—</span>
          <Input type="number" placeholder="מקס׳" value={maxQuantity}
            onChange={(e) => onFilterMaxQuantity(e.target.value)} className={numInp} />
        </FilterItem>
      </div>
    </div>
  );
}
