"use client";
// סרגל חיפוש, סינון ופעולות מעל טבלת החוגים — עיצוב זהה ל-StudentsToolbar
import { Plus, CalendarCheck } from "lucide-react";
import SearchInput from "@/components/shared/SearchInput";
import Btn from "@/components/shared/Btn";
import CsvExportBtn from "@/components/shared/CsvExportBtn";
import CsvImportBtn from "@/components/shared/CsvImportBtn";
import type { Teacher } from "@/lib/types";

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

// סגנון קבוע ל-select
const sel =
  "border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-teal-400 bg-white";
// סגנון לאינפוט מספר
const numInp =
  "w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-teal-400 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

// עוטף לכל פילטר: תווית + שדה לצידו
function FilterItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
        {label}
      </span>
      {children}
    </div>
  );
}

interface Props {
  search: string;
  onSearch: (v: string) => void;
  statusFilter: "הכל" | "מתוכנן" | "פעיל" | "הסתיים" | "בוטל";
  onFilterStatus: (v: "הכל" | "מתוכנן" | "פעיל" | "הסתיים" | "בוטל") => void;
  teacherFilter: string;
  onFilterTeacher: (id: string) => void;
  ageMin: string;
  onFilterAgeMin: (v: string) => void;
  ageMax: string;
  onFilterAgeMax: (v: string) => void;
  ratingMin: string;
  onFilterRatingMin: (v: string) => void;
  ratingMax: string;
  onFilterRatingMax: (v: string) => void;
  participantsMin: string;
  onFilterParticipantsMin: (v: string) => void;
  participantsMax: string;
  onFilterParticipantsMax: (v: string) => void;
  dayFilter: string[];
  onToggleDay: (day: string) => void;
  todayActive: boolean;
  onToggleToday: () => void;
  teachers: Teacher[];
  onAddClass: () => void;
  onExport: () => void;
  onImport: () => void;
}

export default function ClassesToolbar({
  search,
  onSearch,
  statusFilter,
  onFilterStatus,
  teacherFilter,
  onFilterTeacher,
  ageMin,
  onFilterAgeMin,
  ageMax,
  onFilterAgeMax,
  ratingMin,
  onFilterRatingMin,
  ratingMax,
  onFilterRatingMax,
  participantsMin,
  onFilterParticipantsMin,
  participantsMax,
  onFilterParticipantsMax,
  dayFilter,
  onToggleDay,
  todayActive,
  onToggleToday,
  teachers,
  onAddClass,
  onExport,
  onImport,
}: Props) {
  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* שורה 1: חיפוש + כפתורי פעולה */}
      <div className="flex gap-2 items-center justify-between">
        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder="חיפוש לפי שם חוג…"
          className="min-w-45 flex-1 max-w-xs"
        />
        <div className="flex gap-2">
          <CsvImportBtn onClick={onImport} />
          <CsvExportBtn onClick={onExport} />
          <Btn onClick={onAddClass}>
            <Plus size={15} />
            הוסף חוג
          </Btn>
        </div>
      </div>

      {/* שורה 2: פילטרים עם תוויות */}
      <div className="flex gap-4 flex-wrap items-center">
        <FilterItem label="סטטוס:">
          <select
            value={statusFilter}
            onChange={(e) =>
              onFilterStatus(e.target.value as typeof statusFilter)
            }
            className={sel}
          >
            <option value="הכל">הכל</option>
            <option value="מתוכנן">מתוכנן</option>
            <option value="פעיל">פעיל</option>
            <option value="הסתיים">הסתיים</option>
            <option value="בוטל">בוטל</option>
          </select>
        </FilterItem>

        <FilterItem label="מדריך:">
          <select
            value={teacherFilter}
            onChange={(e) => onFilterTeacher(e.target.value)}
            className={sel}
          >
            <option value="">הכל</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.first_name} {t.last_name}
              </option>
            ))}
          </select>
        </FilterItem>

        <FilterItem label="משתתפים:">
          <input
            type="number"
            placeholder="מינ׳"
            value={participantsMin}
            onChange={(e) => onFilterParticipantsMin(e.target.value)}
            className={numInp}
          />
          <span className="text-gray-400 text-xs">—</span>
          <input
            type="number"
            placeholder="מקס׳"
            value={participantsMax}
            onChange={(e) => onFilterParticipantsMax(e.target.value)}
            className={numInp}
          />
        </FilterItem>

        {/* ימי שבוע — כפתורי pill */}
        <FilterItem label="ימים:">
          <div className="flex gap-1">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => onToggleDay(day)}
                className={`px-2 py-1 rounded-md text-xs border transition-colors cursor-pointer ${
                  dayFilter.includes(day)
                    ? "bg-teal-500 text-white border-teal-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </FilterItem>

        {/* כפתור חוגים היום — toggle */}
        <button
          onClick={onToggleToday}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors cursor-pointer ${
            todayActive
              ? "bg-teal-500 text-white border-teal-500"
              : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
          }`}
          title="חוגים פעילים שמתקיימים היום"
        >
          <CalendarCheck size={14} />
          היום
        </button>
      </div>
    </div>
  );
}
