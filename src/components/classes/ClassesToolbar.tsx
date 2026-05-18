"use client";
// סרגל חיפוש, סינון ופעולות מעל טבלת החוגים — עיצוב זהה ל-StudentsToolbar
import { Plus, CalendarCheck } from "lucide-react";
import SearchInput from "@/components/shared/SearchInput";
import Btn from "@/components/shared/Btn";
import CsvExportBtn from "@/components/shared/CsvExportBtn";
import CsvImportBtn from "@/components/shared/CsvImportBtn";
import type { Teacher } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

// sentinel for "all teachers" in teacher filter
const SENTINEL_ALL = "בחר";

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
          <Select
            value={statusFilter}
            onValueChange={(v: string) =>
              onFilterStatus(v as typeof statusFilter)
            }
          >
            <SelectTrigger className="w-28 text-sm h-8 px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="הכל">הכל</SelectItem>
              <SelectItem value="מתוכנן">מתוכנן</SelectItem>
              <SelectItem value="פעיל">פעיל</SelectItem>
              <SelectItem value="הסתיים">הסתיים</SelectItem>
              <SelectItem value="בוטל">בוטל</SelectItem>
            </SelectContent>
          </Select>
        </FilterItem>

        <FilterItem label="מדריך:">
          <Select
            value={teacherFilter || SENTINEL_ALL}
            onValueChange={(v: string) =>
              onFilterTeacher(v === SENTINEL_ALL ? "" : v)
            }
          >
            <SelectTrigger className="w-32 text-sm h-8 px-2">
              {/* render label explicitly — avoids showing Firestore doc ID when async data loads */}
              <SelectValue>
                {teacherFilter
                  ? (() => {
                      const t = teachers.find((t) => t.id === teacherFilter);
                      return t ? `${t.first_name} ${t.last_name}` : "הכל";
                    })()
                  : "הכל"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SENTINEL_ALL}>הכל</SelectItem>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.first_name} {t.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterItem>

        <FilterItem label="משתתפים:">
          <Input
            type="number"
            placeholder="מינ׳"
            value={participantsMin}
            onChange={(e) => onFilterParticipantsMin(e.target.value)}
            className="w-20 h-8 text-sm px-2 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-gray-400 text-xs">—</span>
          <Input
            type="number"
            placeholder="מקס׳"
            value={participantsMax}
            onChange={(e) => onFilterParticipantsMax(e.target.value)}
            className="w-20 h-8 text-sm px-2 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </FilterItem>

        {/* ימי שבוע — כפתורי pill */}
        <FilterItem label="ימים:">
          <div className="flex gap-1">
            {DAYS.map((day) => (
              <Button
                key={day}
                variant="outline"
                size="sm"
                onClick={() => onToggleDay(day)}
                className={`px-2 py-1 h-auto text-xs transition-colors cursor-pointer ${
                  dayFilter.includes(day)
                    ? "bg-teal-500 text-white border-teal-500 hover:bg-teal-600 hover:text-white"
                    : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
                }`}
              >
                {day}
              </Button>
            ))}
          </div>
        </FilterItem>

        {/* כפתור חוגים היום — toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleToday}
          title="חוגים פעילים שמתקיימים היום"
          className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
            todayActive
              ? "bg-teal-500 text-white border-teal-500 hover:bg-teal-600 hover:text-white"
              : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
          }`}
        >
          <CalendarCheck size={14} />
          היום
        </Button>
      </div>
    </div>
  );
}
