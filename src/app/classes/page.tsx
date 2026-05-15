"use client";
// Classes page — all state lives in useClassFilter and useClassSave.
import PageShell from "@/components/shared/PageShell";
import ClassesToolbar from "./ClassesToolbar";
import ClassesTable from "./ClassesTable";
import ClassFormModal from "./ClassFormModal";
import ViewExistingClassDetailModal from "./ViewExistingClassDetailModal";
import ClassUploadPanel from "./ClassUploadPanel";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { exportClassesCsv } from "./exportClassesCsv";
import { useClassFilter } from "./useClassFilter";
import { useClassSave } from "./useClassSave";

export default function ClassesPage() {
  const { classes, teachers, rooms, physicalEquipment, students, enrollments, settings, tournaments } = useData();
  const { showToast } = useToast();

  // All filter + sort state lives here
  const filter = useClassFilter({ classes, enrollments, teachers });

  // All modal + form + save state lives here
  const save = useClassSave({ showToast });

  return (
    <PageShell title="חוגים">
      <ClassesToolbar
        search={filter.search} onSearch={filter.setSearch}
        statusFilter={filter.statusFilter} onFilterStatus={filter.setStatusFilter}
        teacherFilter={filter.teacherFilter} onFilterTeacher={filter.setTeacherFilter}
        ageMin={filter.ageMin} onFilterAgeMin={filter.setAgeMin}
        ageMax={filter.ageMax} onFilterAgeMax={filter.setAgeMax}
        ratingMin={filter.ratingMin} onFilterRatingMin={filter.setRatingMin}
        ratingMax={filter.ratingMax} onFilterRatingMax={filter.setRatingMax}
        participantsMin={filter.participantsMin} onFilterParticipantsMin={filter.setParticipantsMin}
        participantsMax={filter.participantsMax} onFilterParticipantsMax={filter.setParticipantsMax}
        dayFilter={filter.dayFilter} onToggleDay={filter.handleToggleDay}
        todayActive={filter.todayActive} onToggleToday={filter.handleToggleToday}
        teachers={teachers}
        onAddClass={save.openAdd}
        onExport={() => exportClassesCsv(filter.filteredClasses, teachers, enrollments, physicalEquipment)}
        onImport={() => save.setImportOpen(true)}
      />

      <p className="text-xs text-gray-400 mb-3">{filter.filteredClasses.length} חוגים</p>

      <ClassesTable
        classes={filter.filteredClasses}
        teachers={teachers}
        enrollments={enrollments}
        onRowClick={save.setDetailClass}
        sortCol={filter.sortCol}
        sortDir={filter.sortDir}
        onSort={filter.handleSort}
      />

      {save.importOpen && (
        <ClassUploadPanel teachers={teachers} onClose={() => save.setImportOpen(false)} />
      )}

      {save.formModal && (
        <ClassFormModal
          mode={save.formModal}
          classItem={save.editTarget}
          teachers={teachers}
          rooms={rooms}
          physicalEquipment={physicalEquipment}
          students={students}
          enrollments={enrollments}
          allClasses={classes}
          allTournaments={tournaments}
          settings={settings}
          saving={save.saving}
          onClose={() => save.setFormModal(null)}
          onSave={save.handleSave}
        />
      )}

      {save.detailClass && (
        <ViewExistingClassDetailModal
          classItem={save.detailClass}
          teachers={teachers}
          rooms={rooms}
          physicalEquipment={physicalEquipment}
          students={students}
          enrollments={enrollments}
          allClasses={classes}
          allTournaments={tournaments}
          onClose={() => save.setDetailClass(null)}
          onEdit={save.openEdit}
        />
      )}
    </PageShell>
  );
}
