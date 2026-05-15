"use client";
import { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { slotOccursOnDate } from "@/lib/scheduleHelpers";
import { eventOccursOnDate } from "@/lib/eventHelpers";
import ViewExistingClassDetailModal from "@/components/classes/ViewExistingClassDetailModal";
import TournamentDetailModal from "@/components/tournaments/TournamentDetailModal";
import EventDetailModal from "@/components/tournaments/events/EventDetailModal";
import type { Class, Tournament, Event } from "@/lib/types";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Color for class enrollment ratio
function enrollmentColor(ratio: number) {
  if (ratio >= 1) return "text-red-600 font-semibold";
  if (ratio >= 0.8) return "text-orange-500 font-medium";
  return "text-teal-600";
}

// Badge for session type
function TypeBadge({ type }: { type: "חוג" | "תחרות" | "אירוע" }) {
  const colors: Record<string, string> = {
    חוג: "bg-indigo-100 text-indigo-700",
    תחרות: "bg-amber-100 text-amber-700",
    אירוע: "bg-teal-100 text-teal-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[type]}`}>
      {type}
    </span>
  );
}

export default function TodaySessionsTable() {
  const { classes, teachers, rooms, enrollments, tournaments, events, physicalEquipment, students } = useData();
  const todayStr = today();

  // Which modal is open
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const activeClasses = useMemo(() => classes.filter((c) => c.status === "פעיל"), [classes]);

  // Build the unified list of today's sessions (classes + tournaments + events)
  const sessions = useMemo(() => {
    type Session =
      | { kind: "class"; id: string; name: string; startTime: string; endTime: string; extra: string; enrolled: string; classRef: Class }
      | { kind: "tournament"; id: string; name: string; startTime: string; endTime: string; extra: string; enrolled: string; tournamentRef: Tournament }
      | { kind: "event"; id: string; name: string; startTime: string; endTime: string; extra: string; enrolled: string; eventRef: Event };

    const results: Session[] = [];

    // --- חוגים ---
    for (const cls of activeClasses) {
      for (const slot of cls.slots ?? []) {
        if (slotOccursOnDate(slot, todayStr)) {
          const room = rooms.find((r) => r.id === slot.room_id);
          const teacher = teachers.find((t) => t.id === cls.teacher_id);
          const enrolled = enrollments.filter(
            (e) => e.class_id === cls.id && e.status === "פעיל"
          ).length;
          results.push({
            kind: "class",
            id: `cls-${cls.id}-${slot.start_time}`,
            name: cls.name,
            startTime: slot.start_time,
            endTime: slot.end_time,
            extra: [room?.name, teacher ? `${teacher.first_name} ${teacher.last_name}` : ""].filter(Boolean).join(" | "),
            enrolled: `${enrolled} / ${cls.capacity}`,
            classRef: cls,
          });
        }
      }
    }

    // --- תחרויות ---
    for (const t of tournaments) {
      if (t.status === "בוטל") continue;

      if (t.is_recurring) {
        // תחרות חוזרת — בדוק אם תאריך_חזרה == היום
        if (t.recurring_date === todayStr) {
          results.push({
            kind: "tournament",
            id: `t-${t.id}`,
            name: t.name,
            startTime: t.recurring_start_time ?? "",
            endTime: t.recurring_end_time ?? "",
            extra: t.room ?? "—",
            enrolled: `${t.participant_ids.length + t.manual_participants.length} משתתפים`,
            tournamentRef: t,
          });
        }
      } else {
        // תחרות רגילה — בדוק אם יש סיבוב היום
        for (const round of t.rounds) {
          if (round.date === todayStr) {
            results.push({
              kind: "tournament",
              id: `t-${t.id}-r${round.id}`,
              name: `${t.name} — סיבוב ${round.round_number}`,
              startTime: round.start_time,
              endTime: round.end_time,
              extra: round.location ?? t.room ?? "—",
              enrolled: `${t.participant_ids.length + t.manual_participants.length} משתתפים`,
              tournamentRef: t,
            });
          }
        }
      }
    }

    // --- אירועים ---
    for (const ev of events) {
      if (eventOccursOnDate(ev, todayStr)) {
        results.push({
          kind: "event",
          id: `ev-${ev.id}`,
          name: ev.name,
          startTime: ev.start_time,
          endTime: ev.end_time,
          extra: ev.room ?? "—",
          enrolled: "—",
          eventRef: ev,
        });
      }
    }

    return results.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [activeClasses, rooms, teachers, enrollments, tournaments, events, todayStr]);

  const dateLabel = new Date().toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        מפגשים היום — {dateLabel}
      </h2>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
          אין מפגשים מתוכננים להיום
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs">
                <th className="text-right px-4 py-3 font-medium">שעה</th>
                <th className="text-right px-4 py-3 font-medium">סוג</th>
                <th className="text-right px-4 py-3 font-medium">שם</th>
                <th className="text-right px-4 py-3 font-medium">מיקום / מדריך</th>
                <th className="text-right px-4 py-3 font-medium">משתתפים</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                // For class rows: show enrollment color based on ratio
                const enrolledColor =
                  s.kind === "class"
                    ? (() => {
                        const [enrolled, capacity] = s.enrolled.split(" / ").map(Number);
                        return enrollmentColor(capacity > 0 ? enrolled / capacity : 0);
                      })()
                    : "text-gray-500";

                return (
                  <tr
                    key={s.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      if (s.kind === "class") setSelectedClass(s.classRef);
                      else if (s.kind === "tournament") setSelectedTournament(s.tournamentRef);
                      else setSelectedEvent(s.eventRef);
                    }}
                  >
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs whitespace-nowrap">
                      {s.startTime}–{s.endTime}
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={s.kind === "class" ? "חוג" : s.kind === "tournament" ? "תחרות" : "אירוע"} />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500">{s.extra}</td>
                    <td className={`px-4 py-3 ${enrolledColor}`}>{s.enrolled}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* מודל פרטי חוג */}
      {selectedClass && (
        <ViewExistingClassDetailModal
          classItem={selectedClass}
          teachers={teachers}
          rooms={rooms}
          physicalEquipment={physicalEquipment}
          students={students}
          enrollments={enrollments}
          allClasses={classes}
          allTournaments={tournaments}
          onClose={() => setSelectedClass(null)}
          onEdit={() => setSelectedClass(null)}
        />
      )}

      {/* מודל פרטי תחרות */}
      {selectedTournament && (
        <TournamentDetailModal
          tournament={selectedTournament}
          allStudents={students}
          allTeachers={teachers}
          physicalEquipment={physicalEquipment}
          allClasses={classes}
          allTournaments={tournaments}
          onClose={() => setSelectedTournament(null)}
          onEdit={() => setSelectedTournament(null)}
          onDelete={async () => setSelectedTournament(null)}
        />
      )}

      {/* מודל פרטי אירוע */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => setSelectedEvent(null)}
          onDelete={() => setSelectedEvent(null)}
        />
      )}
    </section>
  );
}
