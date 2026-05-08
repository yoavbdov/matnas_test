"use client";
import { useState, useRef, useEffect } from "react";

// ---- Types ----

export type FilterCategory = "student" | "teacher" | "room" | "class" | "tournament";

export interface FilterOption {
  id: string;
  label: string; // display name shown in dropdown
}

export interface ActiveFilter {
  category: FilterCategory;
  option: FilterOption;
}

interface Props {
  studentOptions: FilterOption[];
  teacherOptions: FilterOption[];
  roomOptions: FilterOption[];
  classOptions: FilterOption[];
  tournamentOptions: FilterOption[];
  activeFilter: ActiveFilter | null;
  onFilterChange: (filter: ActiveFilter | null) => void;
}

// ---- Category config ----

const CATEGORIES: { key: FilterCategory; label: string }[] = [
  { key: "student",    label: "שחקנים" },
  { key: "class",      label: "חוגים" },
  { key: "teacher",    label: "מדריכים" },
  { key: "room",       label: "חדרים" },
  { key: "tournament", label: "תחרויות" },
];

// ---- Dropdown component ----

function FilterDropdown({
  options,
  onSelect,
  onClose,
}: {
  options: FilterOption[];
  onSelect: (o: FilterOption) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus search input on open
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      ref={containerRef}
      className="absolute top-full mt-1 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-56"
    >
      {/* Search input */}
      <div className="p-2 border-b border-gray-100">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש..."
          className="w-full text-sm px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-right"
          dir="rtl"
        />
      </div>

      {/* Options list */}
      <ul className="max-h-48 overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-xs text-gray-400 text-right">לא נמצאו תוצאות</li>
        ) : (
          filtered.map((o) => (
            <li
              key={o.id}
              className="px-3 py-2 text-sm text-right cursor-pointer hover:bg-blue-50"
              onClick={() => { onSelect(o); onClose(); }}
            >
              {o.label}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

// ---- Main filter bar ----

export default function ScheduleFilterBar({
  studentOptions,
  teacherOptions,
  roomOptions,
  classOptions,
  tournamentOptions,
  activeFilter,
  onFilterChange,
}: Props) {
  // Which category dropdown is currently open
  const [openCategory, setOpenCategory] = useState<FilterCategory | null>(null);

  function getOptions(cat: FilterCategory): FilterOption[] {
    if (cat === "student")    return studentOptions;
    if (cat === "teacher")    return teacherOptions;
    if (cat === "room")       return roomOptions;
    if (cat === "tournament") return tournamentOptions;
    return classOptions;
  }

  function handleCategoryClick(cat: FilterCategory) {
    // If this category is the active filter, clear it
    if (activeFilter?.category === cat) {
      onFilterChange(null);
      setOpenCategory(null);
      return;
    }
    // Toggle dropdown
    setOpenCategory((prev) => (prev === cat ? null : cat));
  }

  function handleSelect(cat: FilterCategory, option: FilterOption) {
    onFilterChange({ category: cat, option });
    setOpenCategory(null);
  }

  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap" dir="rtl">
      {/* "ללא פילטר" clear button */}
      <button
        onClick={() => { onFilterChange(null); setOpenCategory(null); }}
        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
          activeFilter === null
            ? "bg-gray-700 text-white border-gray-700"
            : "bg-white text-gray-500 border-gray-300 hover:border-gray-500"
        }`}
      >
        ללא פילטר
      </button>

      {/* Category filter buttons */}
      {CATEGORIES.map(({ key, label }) => {
        const isActive = activeFilter?.category === key;
        const isOpen = openCategory === key;

        return (
          <div key={key} className="relative">
            <button
              onClick={() => handleCategoryClick(key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1 ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
              }`}
            >
              {/* Show selected name when active, otherwise show category label */}
              {isActive ? activeFilter!.option.label : label}
              {/* Arrow indicator */}
              <span className={`text-[10px] transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
            </button>

            {/* Clear X when a filter is active for this category */}
            {isActive && (
              <button
                onClick={(e) => { e.stopPropagation(); onFilterChange(null); }}
                className="absolute -top-1.5 -left-1.5 bg-gray-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-500"
                title="נקה פילטר"
              >
                ✕
              </button>
            )}

            {/* Dropdown */}
            {isOpen && (
              <FilterDropdown
                options={getOptions(key)}
                onSelect={(o) => handleSelect(key, o)}
                onClose={() => setOpenCategory(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
