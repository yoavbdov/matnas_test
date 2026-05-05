"use client";
// Mini month calendar — drag across dates to select a consecutive range
import { useState, useEffect, useMemo } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

// ב-RTL grid הפריט הראשון מוצג בימין — ראשון(א) ראשון, שבת(ש) אחרון → ראשון בימין, שבת בשמאל
const DAY_HEADERS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

interface Props {
  selectedDates: Set<string>;
  /** Called with sorted array of the newly selected consecutive dates */
  onSelectRange: (dateStrs: string[]) => void;
}

// Use local date parts — toISOString() returns UTC and shifts the date in UTC+2/3 (Israel)
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Returns every date string between two date strings (inclusive, sorted) */
function datesBetween(a: string, b: string): string[] {
  const [start, end] = [a, b].sort();
  const dates: string[] = [];
  const cursor = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (cursor <= last) {
    dates.push(toDateStr(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

/** Build a grid of week rows for a given year/month */
function buildWeeks(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const cursor = new Date(firstDay);
  cursor.setDate(1 - firstDay.getDay()); // rewind to Sunday
  const weeks: Date[][] = [];
  while (weeks.length < 6) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (weeks.length >= 4 && cursor.getMonth() !== month) break;
  }
  return weeks;
}

export default function MiniCalendar({ selectedDates, onSelectRange }: Props) {
  const today = new Date();
  const todayStr = toDateStr(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Drag state — null means not dragging
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const isDragging = dragStart !== null;

  // Dates highlighted during an active drag (preview)
  const dragPreview = useMemo<Set<string>>(() => {
    if (!dragStart || !dragEnd) return new Set();
    return new Set(datesBetween(dragStart, dragEnd));
  }, [dragStart, dragEnd]);

  // Finish drag on mouseup anywhere in the document
  useEffect(() => {
    const finish = () => {
      if (isDragging && dragStart && dragEnd) {
        onSelectRange(datesBetween(dragStart, dragEnd));
      }
      setDragStart(null);
      setDragEnd(null);
    };
    window.addEventListener("mouseup", finish);
    return () => window.removeEventListener("mouseup", finish);
  }, [isDragging, dragStart, dragEnd, onSelectRange]);

  const weeks = buildWeeks(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    "he-IL",
    {
      month: "long",
      year: "numeric",
    },
  );

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };

  return (
    // Prevent text selection while dragging
    <div
      className="bg-white rounded-xl border border-gray-200 p-3 w-56 flex-shrink-0 shadow-sm"
      style={{ userSelect: "none" }}
    >
      {/* Month navigation — right arrow = prev month, left arrow = next month (RTL) */}
      <div className="flex items-center justify-between mb-2">
        {/* חץ שמאל = חודש הבא */}
        <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100">
          <ChevronRight size={20} />
        </button>
        <span className="text-sm font-semibold text-gray-700">
          {monthLabel}
        </span>
        <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((h) => (
          <div
            key={h}
            className="text-center text-[10px] font-medium text-gray-400 py-0.5"
          >
            {h}
          </div>
        ))}
      </div>

      {/* Date grid */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((date) => {
            const str = toDateStr(date);
            // During drag show preview; otherwise show committed selection
            const isHighlighted = isDragging
              ? dragPreview.has(str)
              : selectedDates.has(str);
            const isToday = str === todayStr;
            const isCurrentMonth = date.getMonth() === viewMonth;

            return (
              <div
                key={str}
                className={`text-center text-xs py-1 rounded-full mx-0.5 cursor-pointer transition-colors
                  ${
                    isHighlighted
                      ? "bg-blue-600 text-white font-semibold"
                      : isToday
                        ? "border border-blue-500 text-blue-600 font-semibold"
                        : isCurrentMonth
                          ? "text-gray-700 hover:bg-gray-100"
                          : "text-gray-300 hover:bg-gray-50"
                  }`}
                onMouseDown={() => {
                  setDragStart(str);
                  setDragEnd(str);
                }}
                onMouseEnter={() => {
                  if (isDragging) setDragEnd(str);
                }}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
