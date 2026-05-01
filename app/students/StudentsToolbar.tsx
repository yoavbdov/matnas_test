"use client";
// סרגל חיפוש, סינון ופעולות מעל טבלת התלמידים
import { Search, Plus, Download, Upload } from "lucide-react";
import Btn from "@/components/shared/Btn";
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
  statusFilter: "הכל" | "פעיל" | "לא פעיל";
  onFilterStatus: (v: "הכל" | "פעיל" | "לא פעיל") => void;
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
  maxSearchLength: number;
}

export default function StudentsToolbar({
  search, onSearch, statusFilter, onFilterStatus,
  classFilter, onFilterClass, gradeFilter, onFilterGrade,
  minRating, onFilterMinRating, maxRating, onFilterMaxRating,
  minFideRating, onFilterMinFideRating, maxFideRating, onFilterMaxFideRating,
  classes, onAddStudent, onExport, onImport, maxSearchLength,
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
            placeholder="חיפוש לפי שם, ת״ז, טלפון…"
            className="w-full border border-gray-200 rounded-lg pr-8 pl-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
          />
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={onImport} className="text-xs px-3 py-2"><Upload size={13} />ייבוא</Btn>
          <Btn variant="secondary" onClick={onExport} className="text-xs px-3 py-2"><Download size={13} />ייצוא</Btn>
          <Btn onClick={onAddStudent}><Plus size={15} />הוסף תלמיד</Btn>
        </div>
      </div>

      {/* שורה 2: פילטרים עם תוויות */}
      <div className="flex gap-4 flex-wrap items-center">
        <FilterItem label="סטטוס:">
          <select value={statusFilter} onChange={(e) => onFilterStatus(e.target.value as typeof statusFilter)} className={sel}>
            <option value="הכל">הכל</option>
            <option value="פעיל">פעיל</option>
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
