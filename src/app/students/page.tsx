"use client";
// Students page — page.tsx is intentionally lean:
// all state lives in useStudentFilter and useStudentSave.
import { useSearchParams } from "next/navigation";
import PageShell from "@/components/shared/PageShell";
import StudentsToolbar from "@/components/students/StudentsToolbar";
import StudentsTable from "@/components/students/StudentsTable";
import StudentFormModal from "@/components/students/StudentFormModal";
import StudentDetailModal from "@/components/students/StudentDetailModal";
import CSVUploadPanel from "@/components/students/CSVUploadPanel";
import StudentAvailabilityModal from "@/components/students/StudentAvailabilityModal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { computeStudentStatus } from "@/lib/studentHelpers";
import { exportStudentsCsv } from "@/components/students/studentsUtils";
import { useStudentFilter } from "@/components/students/useStudentFilter";
import { useStudentSave } from "@/components/students/useStudentSave";

export default function StudentsPage() {
  const {
    students, classes, enrollments, tournaments,
    leagueGroups, leagueGroupMembers, settings,
  } = useData();
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  // All filter + sort state lives here
  const filter = useStudentFilter(
    {
      search: searchParams.get("search"),
      status: searchParams.get("status"),
      classFilter: searchParams.get("class"),
      minRating: searchParams.get("minRating"),
      maxRating: searchParams.get("maxRating"),
    },
    { students, enrollments, tournaments, leagueGroupMembers, leagueGroups, settings },
  );

  // All modal + form + save state lives here
  const save = useStudentSave({ showToast });

  return (
    <PageShell title="שחקנים">
      <StudentsToolbar
        search={filter.search} onSearch={filter.setSearch}
        statusFilter={filter.statusFilter} onFilterStatus={filter.setStatusFilter}
        classFilter={filter.classFilter} onFilterClass={filter.setClassFilter}
        gradeFilter={filter.gradeFilter} onFilterGrade={filter.setGradeFilter}
        minRating={filter.minRating} onFilterMinRating={filter.setMinRating}
        maxRating={filter.maxRating} onFilterMaxRating={filter.setMaxRating}
        minFideRating={filter.minFideRating} onFilterMinFideRating={filter.setMinFideRating}
        maxFideRating={filter.maxFideRating} onFilterMaxFideRating={filter.setMaxFideRating}
        classes={classes}
        onAddStudent={save.openAdd}
        onExport={() => exportStudentsCsv(filter.displayedStudents, enrollments, tournaments, leagueGroupMembers)}
        onImport={() => save.setImportOpen(true)}
        onCheckAvailability={() => save.setAvailabilityOpen(true)}
      />

      <p className="text-xs text-gray-400 mb-3">{filter.displayedStudents.length} שחקנים</p>

      <StudentsTable
        students={filter.displayedStudents}
        enrollments={enrollments}
        tournaments={tournaments}
        leagueGroups={leagueGroups}
        leagueGroupMembers={leagueGroupMembers}
        onRowClick={save.setDetailStudent}
        settings={settings}
        sortCol={filter.sortCol}
        sortDir={filter.sortDir}
        onSort={filter.handleSort}
      />

      {save.formModal && (
        <StudentFormModal
          mode={save.formModal} form={save.form} setForm={save.setForm}
          saving={save.saving} onClose={() => save.setFormModal(null)} onSave={save.handleSave}
          settings={settings}
        />
      )}

      {save.detailStudent && (
        <StudentDetailModal
          student={save.detailStudent}
          classes={classes}
          enrollments={enrollments}
          tournaments={tournaments}
          leagueGroups={leagueGroups}
          leagueGroupMembers={leagueGroupMembers}
          computedStatus={computeStudentStatus(save.detailStudent.id, enrollments, tournaments, leagueGroupMembers)}
          onClose={() => save.setDetailStudent(null)}
          onEdit={save.openEdit}
          settings={settings}
        />
      )}

      {save.importOpen && (
        <CSVUploadPanel onClose={() => save.setImportOpen(false)} settings={settings} />
      )}

      {save.availabilityOpen && (
        <StudentAvailabilityModal
          students={students}
          enrollments={enrollments}
          classes={classes}
          tournaments={tournaments}
          onClose={() => save.setAvailabilityOpen(false)}
        />
      )}
    </PageShell>
  );
}
