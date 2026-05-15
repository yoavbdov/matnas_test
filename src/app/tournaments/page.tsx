"use client";
// Tournaments & Events page — all state lives in useTournamentState.
import PageShell from "@/components/shared/PageShell";
import TournamentsToolbar from "@/components/tournaments/TournamentsToolbar";
import TournamentsTable from "@/components/tournaments/TournamentsTable";
import TournamentFormModal from "@/components/tournaments/TournamentFormModal";
import TournamentDetailModal from "@/components/tournaments/TournamentDetailModal";
import TournamentImportPanel from "@/components/tournaments/TournamentImportPanel";
import EventsTable from "@/components/tournaments/events/EventsTable";
import EventFormModal from "@/components/tournaments/events/EventFormModal";
import EventDetailModal from "@/components/tournaments/events/EventDetailModal";
import EventImportPanel from "@/components/tournaments/events/EventImportPanel";
import TabBtn from "@/components/tournaments/TabBtn";
import CsvExportBtn from "@/components/shared/CsvExportBtn";
import CsvImportBtn from "@/components/shared/CsvImportBtn";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { exportTournamentsCsv } from "@/components/tournaments/exportTournamentsCsv";
import { exportEventsCsv } from "@/components/tournaments/events/exportEventsCsv";
import { useTournamentState } from "@/components/tournaments/useTournamentState";

export default function TournamentsPage() {
  const { tournaments, students, classes, rooms, teachers, physicalEquipment, events } = useData();
  const { showToast } = useToast();

  // All state (tab + filter + modals + CRUD) lives here
  const s = useTournamentState({ tournaments, events }, { showToast });

  return (
    <PageShell title="תחרויות ואירועים">

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-5" dir="rtl">
        <TabBtn label="🏆 תחרויות" active={s.activeTab === "tournaments"} onClick={() => s.setActiveTab("tournaments")} />
        <TabBtn label="📅 אירועים" active={s.activeTab === "events"} onClick={() => s.setActiveTab("events")} />
      </div>

      {/* Tournaments tab */}
      {s.activeTab === "tournaments" && (
        <>
          <TournamentsToolbar
            search={s.search} onSearch={s.setSearch}
            statusFilter={s.statusFilter} onStatusFilter={s.setStatusFilter}
            todayActive={s.todayActive} onToggleToday={() => s.setTodayActive((p) => !p)}
            onAdd={() => s.setShowAddTournament(true)}
            onExport={() => exportTournamentsCsv(s.filteredTournaments)}
            onImport={() => s.setShowTournamentImport(true)}
          />
          <TournamentsTable tournaments={s.filteredTournaments} onRowClick={s.setDetailTournament} />
        </>
      )}

      {/* Events tab */}
      {s.activeTab === "events" && (
        <>
          <div className="flex items-center gap-2 mb-4" dir="rtl">
            <Button
              type="button"
              onClick={() => s.setShowAddEvent(true)}
              className="bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
            >
              + אירוע חדש
            </Button>
            <div className="flex-1" />
            <CsvImportBtn onClick={() => s.setShowEventImport(true)} />
            <CsvExportBtn onClick={() => exportEventsCsv(events)} />
          </div>
          <EventsTable events={events} onRowClick={s.setDetailEvent} />
        </>
      )}

      {/* CSV import panels */}
      {s.showTournamentImport && <TournamentImportPanel onClose={() => s.setShowTournamentImport(false)} />}
      {s.showEventImport && <EventImportPanel onClose={() => s.setShowEventImport(false)} />}

      {/* Tournament modals */}
      {s.showAddTournament && (
        <TournamentFormModal
          mode="add"
          allStudents={students} allClasses={classes} allTournaments={tournaments}
          allEvents={events} allRooms={rooms} allTeachers={teachers}
          physicalEquipment={physicalEquipment}
          saving={s.savingTournament}
          onClose={() => s.setShowAddTournament(false)}
          onSave={s.handleAddTournament}
        />
      )}
      {s.editTournament && (
        <TournamentFormModal
          mode="edit"
          tournament={s.editTournament}
          allStudents={students} allClasses={classes} allTournaments={tournaments}
          allEvents={events} allRooms={rooms} allTeachers={teachers}
          physicalEquipment={physicalEquipment}
          saving={s.savingTournament}
          onClose={() => s.setEditTournament(null)}
          onSave={s.handleEditTournament}
          onDelete={async () => { await s.handleDeleteTournament(s.editTournament!); s.setEditTournament(null); }}
        />
      )}
      {s.detailTournament && (
        <TournamentDetailModal
          tournament={s.detailTournament}
          allStudents={students} allTeachers={teachers}
          physicalEquipment={physicalEquipment} allClasses={classes} allTournaments={tournaments}
          onEdit={() => { s.setEditTournament(s.detailTournament); s.setDetailTournament(null); }}
          onDelete={() => s.handleDeleteTournament(s.detailTournament!)}
          onClose={() => s.setDetailTournament(null)}
        />
      )}

      {/* Event modals */}
      {s.detailEvent && !s.editEvent && !s.showAddEvent && (
        <EventDetailModal
          event={s.detailEvent}
          onEdit={() => { s.setEditEvent(s.detailEvent); s.setDetailEvent(null); }}
          onDelete={() => s.handleDeleteEvent(s.detailEvent!)}
          onClose={() => s.setDetailEvent(null)}
        />
      )}
      {s.showAddEvent && (
        <EventFormModal
          mode="add"
          allClasses={classes} allTournaments={tournaments} allEvents={events} rooms={rooms}
          saving={s.savingEvent}
          onClose={() => s.setShowAddEvent(false)}
          onSave={s.handleAddEvent}
        />
      )}
      {s.editEvent && (
        <EventFormModal
          mode="edit"
          event={s.editEvent}
          allClasses={classes} allTournaments={tournaments} allEvents={events} rooms={rooms}
          saving={s.savingEvent}
          onClose={() => s.setEditEvent(null)}
          onSave={s.handleEditEvent}
        />
      )}

    </PageShell>
  );
}
