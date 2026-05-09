"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users, BookOpen, Clock, Trophy } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import StatCard from "@/components/shared/StatCard";
import TodaySessionsTable from "@/components/dashboard/TodaySessionsTable";
import EnrollmentStatusList from "@/components/dashboard/EnrollmentStatusList";
import RatingDistribution from "@/components/dashboard/RatingDistribution";
import { useData } from "@/context/DataContext";
import { slotOccursOnDate } from "@/lib/scheduleHelpers";
import { useRatingThresholds } from "@/firebase/hooks/useRatingThresholds";
import type { RatingBucketConfig } from "@/firebase/hooks/useRatingThresholds";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const router = useRouter();
  const { students, classes, enrollments, tournaments, loading, error } = useData();
  const { buckets: bucketConfigs, saveBuckets } = useRatingThresholds();

  const todayStr = today();

  const activeStudents = useMemo(
    () => students.filter((s) => s.status === "פעיל"),
    [students],
  );
  const activeClasses = useMemo(
    () => classes.filter((c) => c.status === "פעיל"),
    [classes],
  );

  const todaySessionCount = useMemo(() => {
    let count = 0;
    for (const cls of activeClasses) {
      for (const slot of cls.slots ?? []) {
        if (slotOccursOnDate(slot, todayStr)) count++;
      }
    }
    return count;
  }, [activeClasses, todayStr]);

  // Count tournaments with at least one round today, or recurring tournaments scheduled today
  const todayTournamentCount = useMemo(() => {
    return tournaments.filter((t) => {
      if (t.status === "בוטל") return false;
      if (t.is_recurring) {
        // Recurring tournaments: check if recurring_date matches today
        return t.recurring_date === todayStr;
      }
      // Regular tournaments: check if any round is today
      return t.rounds.some((r) => r.date === todayStr);
    }).length;
  }, [tournaments, todayStr]);

  const newThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    return students.filter((s) => (s.created_at ?? "") >= monthStart).length;
  }, [students]);

  // Build display buckets from the saved bucket configs (each has label, min, max).
  // min=null means no lower bound; max=null means no upper bound.
  const ratingData = useMemo(() => {
    const studentsWithRating = activeStudents.filter((s) => s.israeli_rating);

    const buckets = bucketConfigs.map((cfg: RatingBucketConfig) => {
      const count = studentsWithRating.filter((s) => {
        const r = s.israeli_rating ?? 0;
        const aboveMin = cfg.min === null || r >= cfg.min;
        const belowMax = cfg.max === null || r <= cfg.max;
        return aboveMin && belowMax;
      }).length;

      // Build URL params for click-through to students page
      const params = new URLSearchParams({ status: "active" });
      if (cfg.min !== null) params.set("minRating", String(cfg.min));
      if (cfg.max !== null) params.set("maxRating", String(cfg.max));

      return {
        label: cfg.label,
        count,
        onClick: () => router.push(`/students?${params.toString()}`),
      };
    });

    return {
      buckets,
      withRating: studentsWithRating.length,
      withoutRating: activeStudents.length - studentsWithRating.length,
    };
  }, [activeStudents, router, bucketConfigs]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        <div className="text-center">
          <p className="font-semibold mb-1">שגיאה בטעינת נתונים מ-Firebase</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-sm">מושך מידע, כמה רגעים...</span>
        </div>
      </div>
    );
  }

  return (
    <PageShell title="לוח בקרה">
      {/* space-y-8 spaces out the dashboard sections vertically */}
      <div className="space-y-8">
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Users}
            value={activeStudents.length}
            label="שחקנים פעילים"
            sub={newThisMonth > 0 ? `${newThisMonth} חדשים החודש` : undefined}
            color="teal"
            onClick={() => router.push("/students?status=active")}
          />
          <StatCard
            icon={BookOpen}
            value={activeClasses.length}
            label="חוגים פעילים"
            color="indigo"
            onClick={() => router.push("/classes?status=active")}
          />
          <StatCard
            icon={Clock}
            value={todaySessionCount}
            label="חוגים היום"
            color="orange"
            onClick={() => router.push("/classes?today=true")}
          />
          <StatCard
            icon={Trophy}
            value={todayTournamentCount}
            label="תחרויות היום"
            color="teal"
            onClick={() => router.push("/tournaments?today=true")}
          />
        </section>

        {/* Rating distribution — click a bucket to navigate to students filtered by that range */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            התפלגות דירוגים
          </h2>
          <RatingDistribution
            buckets={ratingData.buckets}
            withRating={ratingData.withRating}
            withoutRating={ratingData.withoutRating}
            bucketConfigs={bucketConfigs}
            onSaveBuckets={saveBuckets}
          />
        </section>

        <TodaySessionsTable />
        <EnrollmentStatusList />
      </div>
    </PageShell>
  );
}
