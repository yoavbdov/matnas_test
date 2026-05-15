// Hook: owns all filter + sort + "today" state for the Classes page

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Class, Enrollment, Teacher } from "@/types";
import type { SortCol, SortDir } from "./ClassesTable";

// Hebrew day names — index matches getDay() (0=Sunday)
const DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
export const TODAY_DAY = DAY_NAMES[new Date().getDay()];

interface Data {
  classes: Class[];
  enrollments: Enrollment[];
  teachers: Teacher[];
}

export function useClassFilter(data: Data) {
  const searchParams = useSearchParams();

  // ── Filter state ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"הכל" | "מתוכנן" | "פעיל" | "הסתיים" | "בוטל">("הכל");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [ratingMin, setRatingMin] = useState("");
  const [ratingMax, setRatingMax] = useState("");
  const [participantsMin, setParticipantsMin] = useState("");
  const [participantsMax, setParticipantsMax] = useState("");
  const [dayFilter, setDayFilter] = useState<string[]>([]);
  const [todayActive, setTodayActive] = useState(false);

  // ── Sort state ──
  const [sortCol, setSortCol] = useState<SortCol>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // If navigated from dashboard with ?today=true — auto-activate the today filter
  useEffect(() => {
    if (searchParams.get("today") === "true") {
      setTodayActive(true);
      setStatusFilter("פעיל");
      setDayFilter([TODAY_DAY]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // "Today" toggle: activates status=פעיל + today's weekday; deactivating resets both
  function handleToggleToday() {
    setTodayActive((prev) => {
      if (!prev) {
        setStatusFilter("פעיל");
        setDayFilter([TODAY_DAY]);
      } else {
        setStatusFilter("הכל");
        setDayFilter([]);
      }
      return !prev;
    });
  }

  // Manual day toggle turns off the "today" quick-filter
  function handleToggleDay(day: string) {
    setTodayActive(false);
    setDayFilter((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  // Manual status change also turns off the "today" quick-filter
  function handleFilterStatus(v: "הכל" | "מתוכנן" | "פעיל" | "הסתיים" | "בוטל") {
    setStatusFilter(v);
    setTodayActive(false);
  }

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  }

  // ── Filter + sort computation ──
  const filteredClasses = useMemo(() => {
    const { classes, enrollments, teachers } = data;
    const q = search.trim().toLowerCase();

    // Count active enrollments for a class
    function enrolledCount(classId: string) {
      return enrollments.filter((e) => e.class_id === classId && e.status === "פעיל").length;
    }

    let result = classes.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (statusFilter !== "הכל" && c.status !== statusFilter) return false;
      if (teacherFilter && c.teacher_id !== teacherFilter) return false;
      if (ageMin !== "" && c.age_max !== undefined && c.age_max < Number(ageMin)) return false;
      if (ageMax !== "" && c.age_min !== undefined && c.age_min > Number(ageMax)) return false;
      if (ratingMin !== "" && c.rating_max !== undefined && c.rating_max < Number(ratingMin)) return false;
      if (ratingMax !== "" && c.rating_min !== undefined && c.rating_min > Number(ratingMax)) return false;
      const enrolled = enrolledCount(c.id);
      if (participantsMin !== "" && enrolled < Number(participantsMin)) return false;
      if (participantsMax !== "" && enrolled > Number(participantsMax)) return false;
      if (dayFilter.length > 0) {
        const classDays = (c.slots ?? []).map((s) => s.day);
        if (!dayFilter.some((d) => classDays.includes(d))) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortCol === "name") {
        cmp = a.name.localeCompare(b.name, "he");
      } else if (sortCol === "teacher") {
        const ta = teachers.find((t) => t.id === a.teacher_id);
        const tb = teachers.find((t) => t.id === b.teacher_id);
        cmp = `${ta?.first_name ?? ""} ${ta?.last_name ?? ""}`.localeCompare(
          `${tb?.first_name ?? ""} ${tb?.last_name ?? ""}`, "he",
        );
      } else if (sortCol === "enrolled") {
        cmp = enrolledCount(a.id) - enrolledCount(b.id);
      } else if (sortCol === "capacity") {
        cmp = a.capacity - b.capacity;
      } else if (sortCol === "days") {
        const da = [...new Set((a.slots ?? []).map((s) => s.day))].join(", ");
        const db = [...new Set((b.slots ?? []).map((s) => s.day))].join(", ");
        cmp = da.localeCompare(db, "he");
      } else if (sortCol === "status") {
        cmp = a.status.localeCompare(b.status, "he");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [
    data.classes, data.enrollments, data.teachers,
    search, statusFilter, teacherFilter,
    ageMin, ageMax, ratingMin, ratingMax,
    participantsMin, participantsMax, dayFilter,
    sortCol, sortDir,
  ]);

  return {
    // Filter state + setters
    search, setSearch,
    statusFilter, setStatusFilter: handleFilterStatus,
    teacherFilter, setTeacherFilter,
    ageMin, setAgeMin,
    ageMax, setAgeMax,
    ratingMin, setRatingMin,
    ratingMax, setRatingMax,
    participantsMin, setParticipantsMin,
    participantsMax, setParticipantsMax,
    dayFilter,
    todayActive,
    handleToggleDay,
    handleToggleToday,
    // Sort state + handler
    sortCol, sortDir, handleSort,
    // Computed result
    filteredClasses,
  };
}
