"use client";
// סרגל חיפוש, סינון ופעולות מעל טבלת השחקנים
import { Plus } from "lucide-react";
import Btn from "@/components/shared/Btn";
import CsvExportBtn from "@/components/shared/CsvExportBtn";
import CsvImportBtn from "@/components/shared/CsvImportBtn";
import CheckAvailabilityBtn from "@/components/shared/CheckAvailabilityBtn";
import SearchInput from "@/components/shared/SearchInput";
import { GRADE_LABELS } from "@/lib/constants";
import type { Class } from "@/lib/types";

// סגנון קבוע ל-select
const sel = "border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-teal-400 bg-white";
// סגנון לאינפוט טקסט/מספר (ללא חצים)
const numInp = "w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-teal-400 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

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
          <select value={statusFilter} onChange={(e) => onFilterStatus(e.target.value as typeof statusFilter)} className={sel}>
            <option value="הכל">הכל</option>
            <option value="פעיל">פעיל</option>
            <option value="ליגה בלבד">ליגה בלבד</option>
            <option value="לא פעיל">לא פעיל</option>
          </select>
        </FilterItem>

        <FilterItem label="חוג:">
          <select value={classFilter} onChange={(e) => onFilterClass(e.target.value)} className={sel}>
            <option value="">הכל</option>
            {classes.filter((c) => c.status === "פעיל").map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </FilterItem>

        <FilterItem label="כיתה:">
          <select value={gradeFilter} onChange={(e) => onFilterGrade(e.target.value)} className={sel}>
            <option value="">הכל</option>
            {GRADE_LABELS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </FilterItem>

        {/* דירוג ישראלי: מינ׳ — מקס׳ (ללא חצי ספינר) */}
        <FilterItem label="דירוג ישראלי:">
          <input type="number" placeholder="מינ׳" value={minRating}
            onChange={(e) => onFilterMinRating(e.target.value)} className={numInp} />
          <span className="text-gray-400 text-xs">—</span>
          <input type="number" placeholder="מקס׳" value={maxRating}
            onChange={(e) => onFilterMaxRating(e.target.value)} className={numInp} />
        </FilterItem>

        {/* דירוג FIDE: מינ׳ — מקס׳ */}
        <FilterItem label="דירוג FIDE:">
          <input type="number" placeholder="מינ׳" value={minFideRating}
            onChange={(e) => onFilterMinFideRating(e.target.value)} className={numInp} />
          <span className="text-gray-400 text-xs">—</span>
          <input type="number" placeholder="מקס׳" value={maxFideRating}
            onChange={(e) => onFilterMaxFideRating(e.target.value)} className={numInp} />
        </FilterItem>
      </div>
    </div>
  );
}
