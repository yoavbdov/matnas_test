"use client";
import { useMemo } from "react";
import PageShell from "@/components/shared/PageShell";
import EnrollmentByClass from "@/components/reports/EnrollmentByClass";
import TeachersLoad from "@/components/reports/TeachersLoad";
import RatingDistribution from "@/components/reports/RatingDistribution";
import UnenrolledStudents from "@/components/reports/UnenrolledStudents";
import { useData } from "@/context/DataContext";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h2>
      {children}
    </section>
  );
}

export default function ReportsPage() {
  const { students, classes, teachers, enrollments } = useData();

  const activeStudents = useMemo(() => students.filter((s) => s.status === "פעיל"), [students]);
  const activeClasses = useMemo(() => classes.filter((c) => c.status === "פעיל"), [classes]);
  const activeTeachers = useMemo(() => teachers.filter((t) => t.status === "פעיל"), [teachers]);
  const activeEnrollments = useMemo(() => enrollments.filter((e) => e.status === "פעיל"), [enrollments]);

  const enrolledIds = useMemo(() => new Set(activeEnrollments.map((e) => e.child_id)), [activeEnrollments]);

  const classReport = useMemo(() =>
    activeClasses.map((cls) => {
      const enrolled = activeEnrollments.filter((e) => e.class_id === cls.id).length;
      const teacher = teachers.find((t) => t.id === cls.teacher_id);
      return { cls, enrolled, ratio: cls.capacity > 0 ? enrolled / cls.capacity : 0, teacherName: teacher ? `${teacher.first_name} ${teacher.last_name}` : "—" };
    }).sort((a, b) => b.ratio - a.ratio),
    [activeClasses, activeEnrollments, teachers]
  );

  const teacherReport = useMemo(() =>
    activeTeachers.map((t) => {
      const teacherClasses = activeClasses.filter((c) => c.teacher_id === t.id);
      const totalEnrolled = teacherClasses.reduce((sum, c) => sum + activeEnrollments.filter((e) => e.class_id === c.id).length, 0);
      return { teacher: t, classCount: teacherClasses.length, totalEnrolled };
    }).sort((a, b) => b.totalEnrolled - a.totalEnrolled),
    [activeTeachers, activeClasses, activeEnrollments]
  );

  const ratingData = useMemo(() => {
    const withRating = activeStudents.filter((s) => s.israeli_rating);
    return {
      withRating: withRating.length,
      withoutRating: activeStudents.length - withRating.length,
      buckets: [
        { label: "מתחת ל-800", count: withRating.filter((s) => (s.israeli_rating ?? 0) < 800).length },
        { label: "800–1200", count: withRating.filter((s) => { const r = s.israeli_rating ?? 0; return r >= 800 && r < 1200; }).length },
        { label: "1200–1600", count: withRating.filter((s) => { const r = s.israeli_rating ?? 0; return r >= 1200 && r < 1600; }).length },
        { label: "1600+", count: withRating.filter((s) => (s.israeli_rating ?? 0) >= 1600).length },
      ],
    };
  }, [activeStudents]);

  const summary = [
    { label: "תלמידים פעילים", value: activeStudents.length },
    { label: "חוגים פעילים", value: activeClasses.length },
    { label: "מדריכים פעילים", value: activeTeachers.length },
    { label: "רישומים פעילים", value: activeEnrollments.length },
  ];

  return (
    <PageShell title="דוחות">
      <div className="space-y-8">
        <Section title="סיכום כללי">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {summary.map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                <p className="text-2xl font-bold text-gray-800">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="רישומים לפי חוג">
          <EnrollmentByClass items={classReport} />
        </Section>

        <Section title="עומס מדריכים">
          <TeachersLoad items={teacherReport} />
        </Section>

        <Section title="התפלגות דירוגים">
          <RatingDistribution buckets={ratingData.buckets} withRating={ratingData.withRating} withoutRating={ratingData.withoutRating} />
        </Section>

        <Section title={`תלמידים ללא חוג (${activeStudents.filter((s) => !enrolledIds.has(s.id)).length})`}>
          <UnenrolledStudents students={activeStudents.filter((s) => !enrolledIds.has(s.id))} />
        </Section>
      </div>
    </PageShell>
  );
}
