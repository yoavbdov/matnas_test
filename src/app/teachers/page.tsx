"use client";
// Teachers page — all state lives in useTeacherState.
import PageShell from "@/components/shared/PageShell";
import TeachersToolbar from "@/components/teachers/TeachersToolbar";
import TeachersTable from "@/components/teachers/TeachersTable";
import TeacherFormModal from "@/components/teachers/TeacherFormModal";
import TeacherDetailModal from "@/components/teachers/TeacherDetailModal";
import TeacherUploadPanel from "@/components/teachers/TeacherUploadPanel";
import TeacherAvailabilityModal from "@/components/teachers/TeacherAvailabilityModal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { exportTeachersCsv } from "@/components/teachers/exportTeachersCsv";
import { useTeacherState } from "@/components/teachers/useTeacherState";

export default function TeachersPage() {
  const { teachers, classes, enrollments, tournaments, settings } = useData();
  const { showToast } = useToast();

  // All state (filter + modal + form + save) lives here
  const s = useTeacherState({ teachers, classes, tournaments, settings }, { showToast });

  return (
    <PageShell title="מדריכים">
      <TeachersToolbar
        search={s.search} onSearch={s.setSearch}
        statusFilter={s.statusFilter} onFilterStatus={s.setStatusFilter}
        onAddTeacher={s.openAdd}
        onCheckAvailability={() => s.setAvailabilityOpen(true)}
        onExport={() => exportTeachersCsv(s.filteredTeachers, classes, tournaments)}
        onImport={() => s.setImportOpen(true)}
      />

      <p className="text-xs text-gray-400 mb-3">{s.filteredTeachers.length} מדריכים</p>

      <TeachersTable
        teachers={s.filteredTeachers}
        classes={classes}
        tournaments={tournaments}
        onRowClick={s.setDetailTeacher}
      />

      {s.formModal && (
        <TeacherFormModal
          mode={s.formModal} form={s.form} setForm={s.setForm}
          saving={s.saving} onClose={() => s.setFormModal(null)} onSave={s.handleSave}
          settings={settings}
        />
      )}

      {s.importOpen && <TeacherUploadPanel onClose={() => s.setImportOpen(false)} />}

      {s.availabilityOpen && (
        <TeacherAvailabilityModal
          teachers={teachers} classes={classes}
          onClose={() => s.setAvailabilityOpen(false)}
        />
      )}

      {s.detailTeacher && (
        <TeacherDetailModal
          teacher={s.detailTeacher}
          classes={classes}
          enrollments={enrollments}
          tournaments={tournaments}
          onClose={() => s.setDetailTeacher(null)}
          onEdit={s.openEdit}
        />
      )}
    </PageShell>
  );
}
