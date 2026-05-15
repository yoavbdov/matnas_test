// Hook: owns all filter + sort state for the Students page
// Also syncs active filters to the URL so the browser back button works

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { computeStudentStatus } from "@/lib/helpers/studentHelpers";
import { effectiveGrade, parseStatusParam } from "./studentsUtils";
import type { Student, Enrollment, Tournament, LeagueGroupMember, LeagueGroup } from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/config/config";
import type { SortCol, SortDir } from "./StudentsTable";

// URL param values that pre-fill the filters on mount (e.g. ?status=active&minRating=1200)
interface InitialFilters {
  search?: string | null;
  status?: string | null;
  classFilter?: string | null;
  minRating?: string | null;
  maxRating?: string | null;
}

interface Data {
  students: Student[];
  enrollments: Enrollment[];
  tournaments: Tournament[];
  leagueGroupMembers: LeagueGroupMember[];
  leagueGroups: LeagueGroup[];
  settings: typeof DEFAULT_SETTINGS;
}

export function useStudentFilter(initial: InitialFilters, data: Data) {
  const router = useRouter();

  // ── Filter state ──
  const [search, setSearch] = useState(initial.search ?? "");
  const [statusFilter, setStatusFilter] = useState<"הכל" | "פעיל" | "ליגה בלבד" | "לא פעיל">(
    parseStatusParam(initial.status ?? null),
  );
  const [classFilter, setClassFilter] = useState(initial.classFilter ?? "");
  const [gradeFilter, setGradeFilter] = useState("");
  const [minRating, setMinRating] = useState(initial.minRating ?? "");
  const [maxRating, setMaxRating] = useState(initial.maxRating ?? "");
  const [minFideRating, setMinFideRating] = useState("");
  const [maxFideRating, setMaxFideRating] = useState("");

  // ── Sort state ──
  const [sortCol, setSortCol] = useState<SortCol>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Keep the URL in sync whenever key filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter === "פעיל") params.set("status", "active");
    else if (statusFilter === "לא פעיל") params.set("status", "inactive");
    if (search) params.set("search", search);
    if (classFilter) params.set("class", classFilter);
    const qs = params.toString();
    router.replace(qs ? `/students?${qs}` : "/students", { scroll: false });
  }, [statusFilter, search, classFilter, router]);

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  }

  // ── Filter + sort computation ──
  const displayedStudents = useMemo(() => {
    const {
      students, enrollments, tournaments, leagueGroupMembers, leagueGroups, settings,
    } = data;

    const q = search.trim().toLowerCase();
    const minR = minRating ? Number(minRating) : null;
    const maxR = maxRating ? Number(maxRating) : null;
    const minFide = minFideRating ? Number(minFideRating) : null;
    const maxFide = maxFideRating ? Number(maxFideRating) : null;

    // --- Filter ---
    const filtered = students.filter((s) => {
      // Status is computed dynamically — never read from the stored field
      const computedStatus = computeStudentStatus(s.id, enrollments, tournaments, leagueGroupMembers);
      if (statusFilter !== "הכל" && computedStatus !== statusFilter) return false;

      if (classFilter) {
        const enrolled = enrollments.some(
          (e) => e.student_id === s.id && e.class_id === classFilter && e.status === "פעיל",
        );
        if (!enrolled) return false;
      }

      if (gradeFilter) {
        const grade = effectiveGrade(s, settings.GRADE_FIRST_AGE ?? 6, settings.GRADE_ADULT_AGE ?? 18);
        if (grade !== gradeFilter) return false;
      }

      if (minR !== null && (s.israeli_rating ?? 0) < minR) return false;
      if (maxR !== null && (s.israeli_rating ?? 0) > maxR) return false;
      if (minFide !== null && (s.fide_rating ?? 0) < minFide) return false;
      if (maxFide !== null && (s.fide_rating ?? 0) > maxFide) return false;

      if (q) {
        const nameMatch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(q);
        const idMatch = (s.israeli_id ?? "").includes(q);
        const phoneMatch = (s.phone ?? "").includes(q);
        if (!nameMatch && !idMatch && !phoneMatch) return false;
      }
      return true;
    });

    // --- Sort ---
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case "name":
          cmp = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, "he");
          break;
        case "age":
          // Sort by DOB descending = youngest first when asc
          cmp = (b.dob ?? "").localeCompare(a.dob ?? "");
          break;
        case "grade": {
          const ga = effectiveGrade(a, settings.GRADE_FIRST_AGE ?? 6, settings.GRADE_ADULT_AGE ?? 18);
          const gb = effectiveGrade(b, settings.GRADE_FIRST_AGE ?? 6, settings.GRADE_ADULT_AGE ?? 18);
          cmp = ga.localeCompare(gb, "he");
          break;
        }
        case "rating":
          cmp = (a.israeli_rating ?? 0) - (b.israeli_rating ?? 0);
          break;
        case "tournaments": {
          const ta = tournaments.filter((t) => t.participant_ids.includes(a.id)).length;
          const tb = tournaments.filter((t) => t.participant_ids.includes(b.id)).length;
          cmp = ta - tb;
          break;
        }
        case "league": {
          const getName = (s: Student) => {
            const mem = leagueGroupMembers.find((m) => m.student_id === s.id);
            if (!mem) return null;
            return leagueGroups.find((g) => g.id === mem.group_id)?.name ?? null;
          };
          const ga = getName(a);
          const gb = getName(b);
          // Students with no group always sink to the bottom regardless of direction
          if (ga === null && gb === null) cmp = 0;
          else if (ga === null) return 1;
          else if (gb === null) return -1;
          else cmp = ga.localeCompare(gb, "he");
          break;
        }
        case "phone":
          cmp = (a.phone || "").localeCompare(b.phone || "");
          break;
        case "classes": {
          const ca = enrollments.filter((e) => e.student_id === a.id && e.status === "פעיל").length;
          const cb = enrollments.filter((e) => e.student_id === b.id && e.status === "פעיל").length;
          cmp = ca - cb;
          break;
        }
        case "status": {
          const sa = computeStudentStatus(a.id, enrollments, tournaments, leagueGroupMembers);
          const sb = computeStudentStatus(b.id, enrollments, tournaments, leagueGroupMembers);
          cmp = sa.localeCompare(sb, "he");
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [
    data.students, data.enrollments, data.tournaments,
    data.leagueGroupMembers, data.leagueGroups, data.settings,
    search, statusFilter, classFilter, gradeFilter,
    minRating, maxRating, minFideRating, maxFideRating,
    sortCol, sortDir,
  ]);

  return {
    // Filter state + setters
    search, setSearch,
    statusFilter, setStatusFilter,
    classFilter, setClassFilter,
    gradeFilter, setGradeFilter,
    minRating, setMinRating,
    maxRating, setMaxRating,
    minFideRating, setMinFideRating,
    maxFideRating, setMaxFideRating,
    // Sort state + handler
    sortCol, sortDir, handleSort,
    // Computed result
    displayedStudents,
  };
}
