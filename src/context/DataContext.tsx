/*This file creates a centralized data layer using React Context. Instead of passing props through multiple component levels (“prop drilling”), 
it provides global access to shared data so any component inside the provider can consume it directly via useContext.
the useData() hook actually gives the real-time values of the firebase database!
The fetching from firebase is done by useCollection. */

"use client";
import { createContext, useContext } from "react";
import { useCollection } from "@/firebase/hooks/useCollection";
import type {
  Student,
  Teacher,
  Room,
  PhysicalEquipment,
  Class,
  Enrollment,
  Tournament,
  Event,
  LeagueGroup,
  LeagueGroupMember,
} from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/config/config";

interface DataContextProps {
  students: Student[];
  classes: Class[];
  teachers: Teacher[];
  rooms: Room[];
  physicalEquipment: PhysicalEquipment[];
  enrollments: Enrollment[];
  tournaments: Tournament[];
  events: Event[];
  leagueGroups: LeagueGroup[];
  leagueGroupMembers: LeagueGroupMember[];
  settings: typeof DEFAULT_SETTINGS;
  loading: boolean;
  error: string | null; // surfaces first Firestore error (e.g. permission denied)
}

const DataContext = createContext<DataContextProps>({
  students: [],
  classes: [],
  teachers: [],
  rooms: [],
  physicalEquipment: [],
  enrollments: [],
  tournaments: [],
  events: [],
  leagueGroups: [],
  leagueGroupMembers: [],
  settings: DEFAULT_SETTINGS,
  loading: true,
  error: null,
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { data: students, loading: l1, error: e1 } = useCollection<Student>("students");
  const { data: classes, loading: l2, error: e2 } = useCollection<Class>("classes");
  const { data: teachers, loading: l3 } = useCollection<Teacher>("teachers");
  const { data: rooms, loading: l4 } = useCollection<Room>("rooms");
  const { data: physicalEquipment, loading: l5 } =
    useCollection<PhysicalEquipment>("physicalEquipment");
  const { data: enrollments, loading: l6 } =
    useCollection<Enrollment>("enrollments");
  const { data: tournaments, loading: l9 } =
    useCollection<Tournament>("tournaments");
  const { data: events, loading: l12 } =
    useCollection<Event>("events");
  const { data: leagueGroups, loading: l10 } =
    useCollection<LeagueGroup>("leagueGroups");
  const { data: leagueGroupMembers, loading: l11 } =
    useCollection<LeagueGroupMember>("leagueGroupMembers");

  // this is an array of boolians, checking whether any values is still loading from firebase or everything was loaded already.
  const loading = l1 || l2 || l3 || l4 || l5 || l6 || l9 || l10 || l11 || l12;
  // surface the first error (e.g. "Missing or insufficient permissions")
  const error = e1 ?? e2 ?? null;
  // settings are fixed at compile time — no Firestore sync needed
  const settings = DEFAULT_SETTINGS;

  return (
    <DataContext.Provider
      value={{
        students,
        classes,
        teachers,
        rooms,
        physicalEquipment,
        enrollments,
        tournaments,
        events,
        leagueGroups,
        leagueGroupMembers,
        settings,
        loading,
        error,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
