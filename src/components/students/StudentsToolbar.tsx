"use client";
// סרגל חיפוש, סינון ופעולות מעל טבלת השחקנים
import { Plus } from "lucide-react";
import Btn from "@/components/shared/Btn";
import CsvExportBtn from "@/components/shared/CsvExportBtn";
import CsvImportBtn from "@/components/shared/CsvImportBtn";
import CheckAvailabilityBtn from "@/components/shared/CheckAvailabilityBtn";
import SearchInput from "@/components/shared/SearchInput";
import { GRADE_LABELS } from "@/lib/config/constants";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { Class } from "@/types";

// עוטף לכל פילטר: תווית + שדה לצידו
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
  statusFilter: "הכל" | "פעיל" | "ליגה בלבד" | "לא פעיל";
  onFilterStatus: (v: "הכל" | "פעיל" | "ליגה בלבד" | "לא פעיל") => void;
  classFilter: string;
  onFilterClass: (id: string) => void;
  gradeFilter: string;
  onFilterGrade: (g: string) => void;
  minRating: string;
  onFilterMinRating: (r: string) => void;
  maxRating: string;
  onFilterMaxRating: (r: string) => void;
  minFideRating: string;
  onFilterMinFideRating: (r: string) => void;
  maxFideRating: string;
  onFilterMaxFideRating: (r: string) => void;
  classes: Class[];
  onAddStudent: () => void;
  onExport: () => void;
  onImport: () => void;
  onCheckAvailability: () => void;
}

export default function StudentsToolbar({
  search, onSearch, statusFilter, onFilterStatus,
  classFilter, onFilterClass, gradeFilter, onFilterGrade,
  minRating, onFilterMinRating, maxRating, onFilterMaxRating,
  minFideRating, onFilterMinFideRating, maxFideRating, onFilterMaxFideRating,
  classes, onAddStudent, onExport, onImport, onCheckAvailability,
}: Props) {
  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* שורה 1: חיפוש + כפתורי פעולה */}
      <div className="flex gap-2 items-center justify-between">
        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder="חיפוש לפי שם, ת״ז, טלפון…"
          className="min-w-45 flex-1 max-w-xs"
        />
        <div className="flex gap-2">
          <CheckAvailabilityBtn onClick={onCheckAvailability} />
          <CsvImportBtn onClick={onImport} />
          <CsvExportBtn onClick={onExport} />
          <Btn onClick={onAddStudent}><Plus size={15} />הוסף שחקן</Btn>
        </div>
      </div>

      {/* שורה 2: פילטרים עם תוויות */}
      <div className="flex gap-4 flex-wrap items-center">
        <FilterItem label="סטטוס:">
          <Select
            value={statusFilter}
            onValueChange={(v: string) => onFilterStatus(v as typeof statusFilter)}
          >
            <SelectTrigger className="text-sm h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="הכל">הכל</SelectItem>
              <SelectItem value="פעיל">פעיל</SelectItem>
              <SelectItem value="ליגה בלבד">ליגה בלבד</SelectItem>
              <SelectItem value="לא פעיל">לא פעיל</SelectItem>
            </SelectContent>
          </Select>
        </FilterItem>

        <FilterItem label="חוג:">
          <Select
            value={classFilter || "__all__"}
            onValueChange={(v: string) => onFilterClass(v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="text-sm h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">הכל</SelectItem>
              {classes.filter((c) => c.status === "פעיל").map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterItem>

        <FilterItem label="כיתה:">
          <Select
            value={gradeFilter || "__all__"}
            onValueChange={(v: string) => onFilterGrade(v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="text-sm h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">הכל</SelectItem>
              {GRADE_LABELS.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterItem>

        {/* דירוג ישראלי: מינ׳ — מקס׳ (ללא חצי ספינר) */}
        <FilterItem label="דירוג ישראלי:">
          <Input
            type="number"
            placeholder="מינ׳"
            value={minRating}
            onChange={(e) => onFilterMinRating(e.target.value)}
            className="w-24 h-8 text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-gray-400 text-xs">—</span>
          <Input
            type="number"
            placeholder="מקס׳"
            value={maxRating}
            onChange={(e) => onFilterMaxRating(e.target.value)}
            className="w-24 h-8 text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </FilterItem>

        {/* דירוג FIDE: מינ׳ — מקס׳ */}
        <FilterItem label="דירוג FIDE:">
          <Input
            type="number"
            placeholder="מינ׳"
            value={minFideRating}
            onChange={(e) => onFilterMinFideRating(e.target.value)}
            className="w-24 h-8 text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-gray-400 text-xs">—</span>
          <Input
            type="number"
            placeholder="מקס׳"
            value={maxFideRating}
            onChange={(e) => onFilterMaxFideRating(e.target.value)}
            className="w-24 h-8 text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </FilterItem>
      </div>
    </div>
  );
}
