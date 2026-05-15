"use client";
// סרגל חיפוש, סינון ופעולות מעל טבלת החדרים
import { Plus } from "lucide-react";
import SearchInput from "@/components/shared/SearchInput";
import Btn from "@/components/shared/Btn";
import CsvExportBtn from "@/components/shared/CsvExportBtn";
import CsvImportBtn from "@/components/shared/CsvImportBtn";
import CheckAvailabilityBtn from "@/components/shared/CheckAvailabilityBtn";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

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
  onCheckAvailability: () => void;
}

export default function RoomsToolbar({
  search, onSearch,
  minCapacity, onFilterMinCapacity,
  maxCapacity, onFilterMaxCapacity,
  featureFilter, onFilterFeature, allFeatures,
  onAdd, onImport, onExport, onCheckAvailability,
}: Props) {
  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* שורה 1: חיפוש + כפתורי פעולה */}
      <div className="flex gap-2 items-center justify-between">
        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder="חיפוש לפי שם או מספר…"
          className="min-w-45 flex-1 max-w-xs"
        />
        <div className="flex gap-2">
          <CheckAvailabilityBtn onClick={onCheckAvailability} />
          <CsvImportBtn onClick={onImport} />
          <CsvExportBtn onClick={onExport} />
          <Btn onClick={onAdd}><Plus size={15} />הוסף חדר</Btn>
        </div>
      </div>

      {/* שורה 2: פילטרים */}
      <div className="flex gap-4 flex-wrap items-center">
        {/* פילטר לפי תכונה */}
        <FilterItem label="תכונה:">
          <Select
            value={featureFilter || "__all__"}
            onValueChange={(v: string) => onFilterFeature(v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="text-sm h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">הכל</SelectItem>
              {allFeatures.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterItem>

        {/* פילטר לפי קיבולת — טווח מינ׳ עד מקס׳ */}
        <FilterItem label="קיבולת:">
          <Input
            type="number"
            placeholder="מינ׳"
            value={minCapacity}
            onChange={(e) => onFilterMinCapacity(e.target.value)}
            className="w-20 h-8 text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-gray-400 text-xs">—</span>
          <Input
            type="number"
            placeholder="מקס׳"
            value={maxCapacity}
            onChange={(e) => onFilterMaxCapacity(e.target.value)}
            className="w-20 h-8 text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </FilterItem>
      </div>
    </div>
  );
}
