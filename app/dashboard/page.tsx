"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users, BookOpen, Clock, TrendingUp } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import StatCard from "@/components/shared/StatCard";
import TodaySessionsTable from "@/components/dashboard/TodaySessionsTable";
import EnrollmentStatusList from "@/components/dashboard/EnrollmentStatusList";
import { useData } from "@/context/DataContext";
import { slotOccursOnDate } from "@/lib/scheduleHelpers";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const router = useRouter();
  const { students, classes, enrollments, loading, error } = useData();

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

  const newThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    return students.filter((s) => (s.created_at ?? "") >= monthStart).length;
  }, [students]);

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
      {/* space-y-8 spaces out the three dashboard sections vertically */}
      <div className="space-y-8">
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Users}
            value={activeStudents.length}
            label="תלמידים פעילים"
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
          />
          <StatCard
            icon={TrendingUp}
            value={enrollments.filter((e) => e.status === "פעיל").length}
            label="רישומים פעילים"
            color="teal"
          />
        </section>

        <TodaySessionsTable />
        <EnrollmentStatusList />
      </div>
    </PageShell>
  );
}
