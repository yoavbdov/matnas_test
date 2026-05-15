"use client";
// Schedule page — no useState here; all state lives in dedicated hooks.
import PageShell from "@/components/shared/PageShell";
import CalendarGrid from "@/components/schedule/CalendarGrid";
import MiniCalendar from "@/components/schedule/MiniCalendar";
import ScheduleFilterBar from "@/components/schedule/ScheduleFilterBar";
import ViewExistingClassDetailModal from "@/components/classes/ViewExistingClassDetailModal";
import ClassFormModal from "@/components/classes/ClassFormModal";
import TournamentDetailModal from "@/components/tournaments/TournamentDetailModal";
import TournamentFormModal from "@/components/tournaments/TournamentFormModal";
import EventDetailModal from "@/components/tournaments/events/EventDetailModal";
import EventFormModal from "@/components/tournaments/events/EventFormModal";
import ScheduleContextMenu from "@/components/schedule/ScheduleContextMenu";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { updateDocument, addDocument, deleteDocument } from "@/firebase/firestore";
import { toDateStr } from "@/components/schedule/schedulePageUtils";
import { useScheduleFilters } from "@/components/schedule/useScheduleFilters";
import { useScheduleCalendar } from "@/components/schedule/useScheduleCalendar";
import { useScheduleModals } from "@/components/schedule/useScheduleModals";
import { buildContextMenuHandlers } from "@/components/schedule/useScheduleContextMenus";

export default function SchedulePage() {
  const {
    classes, teachers, rooms, physicalEquipment, students, enrollments,
    settings, tournaments, events: allEvents,
  } = useData();
  const { showToast } = useToast();

  const todayStr = toDateStr(new Date());

  // ── Filter options + visibility sets (also owns activeFilter state) ──
  const filters = useScheduleFilters({ classes, tournaments, enrollments, rooms, students, teachers });

  // ── Calendar: selectedDates state + conflicts + day data ──
  const calendar = useScheduleCalendar({
    classes, tournaments, events: allEvents, enrollments, rooms, teachers,
    todayStr,
    visibleClassIds: filters.visibleClassIds,
    visibleTournamentIds: filters.visibleTournamentIds,
  });

  // ── All modal state ──
  const modals = useScheduleModals();

  // ── Right-click context menu handlers ──
  const { openClassContextMenu, openTournamentContextMenu, openEventContextMenu } =
    buildContextMenuHandlers(modals.setContextMenu, showToast);

  const totalEvents = calendar.days.reduce(
    (n, d) => n + d.events.length + (d.tournamentEvents?.length ?? 0) + (d.eventItems?.length ?? 0),
    0,
  );

  return (
    <PageShell title="לוח זמנים">

      <ScheduleFilterBar
        studentOptions={filters.studentOptions}
        teacherOptions={filters.teacherOptions}
        roomOptions={filters.roomOptions}
        classOptions={filters.classOptions}
        tournamentOptions={filters.tournamentOptions}
        activeFilter={filters.activeFilter}
        onFilterChange={filters.setActiveFilter}
      />

      <p className="text-xs text-gray-400 mb-3 text-right">
        {calendar.selectedDates.size === 1 ? "תאריך אחד נבחר" : `${calendar.selectedDates.size} ימים נבחרו`}
        {" • "}
        {totalEvents} מפגשים
      </p>

      <div className="flex gap-4 items-start" dir="rtl">

        <MiniCalendar selectedDates={calendar.selectedDates} onSelectRange={calendar.selectRange} />

        <div className="flex-1 min-w-0">
          <CalendarGrid
            days={calendar.days}
            onEventClick={modals.setDetailClass}
            onTournamentClick={(t, dateStr) => {
              modals.setDetailTournament(t);
              modals.setDetailOccurrenceDate(t.is_recurring ? dateStr : null);
            }}
            onEventItemClick={modals.setDetailEvent}
            onEventContextMenu={openClassContextMenu}
            onTournamentContextMenu={openTournamentContextMenu}
            onEventItemContextMenu={openEventContextMenu}
          />
        </div>

      </div>

      {/* Class detail modal */}
      {modals.detailClass && (
        <ViewExistingClassDetailModal
          classItem={modals.detailClass}
          teachers={teachers} rooms={rooms} physicalEquipment={physicalEquipment}
          students={students} enrollments={enrollments}
          allClasses={classes} allTournaments={tournaments}
          onClose={() => modals.setDetailClass(null)}
          onEdit={(c) => { modals.setEditTarget(c); modals.setDetailClass(null); }}
        />
      )}

      {/* Tournament detail modal */}
      {modals.detailTournament && (
        <TournamentDetailModal
          tournament={modals.detailTournament}
          allStudents={students} allTeachers={teachers}
          physicalEquipment={physicalEquipment} allClasses={classes} allTournaments={tournaments}
          occurrenceDate={modals.detailOccurrenceDate ?? undefined}
          onEdit={() => {
            modals.setEditTournament(modals.detailTournament);
            modals.setDetailTournament(null);
            modals.setDetailOccurrenceDate(null);
          }}
          onDelete={async () => {
            try {
              await deleteDocument("tournaments", modals.detailTournament!.id);
              showToast("התחרות נמחקה בהצלחה", "success");
            } catch { showToast("שגיאה במחיקה, נסה שוב", "error"); }
            modals.setDetailTournament(null);
            modals.setDetailOccurrenceDate(null);
          }}
          onClose={() => { modals.setDetailTournament(null); modals.setDetailOccurrenceDate(null); }}
        />
      )}

      {/* Tournament edit modal */}
      {modals.editTournament && (
        <TournamentFormModal
          mode="edit"
          tournament={modals.editTournament}
          allStudents={students} allClasses={classes} allTournaments={tournaments}
          allEvents={allEvents} allRooms={rooms} allTeachers={teachers}
          physicalEquipment={physicalEquipment}
          saving={modals.saving}
          onClose={() => modals.setEditTournament(null)}
          onSave={async (data) => {
            modals.setSaving(true);
            try {
              await updateDocument("tournaments", modals.editTournament!.id, data);
              showToast("התחרות עודכנה בהצלחה", "success");
              modals.setEditTournament(null);
            } catch { showToast("שגיאה בשמירה, נסה שוב", "error"); }
            finally { modals.setSaving(false); }
          }}
        />
      )}

      {/* Event detail modal */}
      {modals.detailEvent && !modals.editEvent && (
        <EventDetailModal
          event={modals.detailEvent}
          onEdit={() => { modals.setEditEvent(modals.detailEvent); modals.setDetailEvent(null); }}
          onDelete={async () => {
            try {
              await deleteDocument("events", modals.detailEvent!.id);
              showToast("האירוע נמחק", "success");
            } catch { showToast("שגיאה במחיקה, נסה שוב", "error"); }
            modals.setDetailEvent(null);
          }}
          onClose={() => modals.setDetailEvent(null)}
        />
      )}

      {/* Event edit modal */}
      {modals.editEvent && (
        <EventFormModal
          mode="edit"
          event={modals.editEvent}
          allClasses={classes} allTournaments={tournaments} allEvents={allEvents} rooms={rooms}
          saving={modals.savingEvent}
          onClose={() => modals.setEditEvent(null)}
          onSave={async (data) => {
            if (!data.name.trim()) { showToast("שם האירוע הוא שדה חובה", "error"); return; }
            modals.setSavingEvent(true);
            try {
              await updateDocument("events", modals.editEvent!.id, data);
              showToast("האירוע עודכן בהצלחה", "success");
              modals.setEditEvent(null);
            } catch { showToast("שגיאה בשמירה, נסה שוב", "error"); }
            finally { modals.setSavingEvent(false); }
          }}
        />
      )}

      {/* Right-click context menu */}
      {modals.contextMenu && (
        <ScheduleContextMenu target={modals.contextMenu} onClose={() => modals.setContextMenu(null)} />
      )}

      {/* Class edit modal — opened via the detail modal's "edit" button */}
      {modals.editTarget && (
        <ClassFormModal
          mode="edit"
          classItem={modals.editTarget}
          teachers={teachers} rooms={rooms} physicalEquipment={physicalEquipment}
          students={students} enrollments={enrollments}
          allClasses={classes} allTournaments={tournaments}
          settings={settings}
          saving={modals.saving}
          onClose={() => modals.setEditTarget(null)}
          onSave={async (form, enrollmentChanges) => {
            if (!form.name.trim()) { showToast("שם החוג הוא שדה חובה", "error"); return; }
            if (!form.teacher_id) { showToast("יש לבחור מדריך", "error"); return; }
            modals.setSaving(true);
            try {
              await updateDocument("classes", modals.editTarget!.id, form);
              const today = new Date().toISOString().slice(0, 10);
              await Promise.all(
                enrollmentChanges.toAdd.map((sid) =>
                  addDocument("enrollments", { student_id: sid, class_id: modals.editTarget!.id, enrolled_at: today, status: "פעיל" }),
                ),
              );
              await Promise.all(
                enrollmentChanges.toRemove.map((eid) => deleteDocument("enrollments", eid)),
              );
              showToast("החוג עודכן בהצלחה", "success");
              modals.setEditTarget(null);
            } catch { showToast("שגיאה בשמירה, נסה שוב", "error"); }
            finally { modals.setSaving(false); }
          }}
        />
      )}

    </PageShell>
  );
}
