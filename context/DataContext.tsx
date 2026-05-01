/*This file creates a centralized data layer using React Context. Instead of passing props through multiple component levels (“prop drilling”), 
it provides global access to shared data so any component inside the provider can consume it directly via useContext.
the useData() hook actually gives the real-time values of the firebase database!
The fetching from firebase is done by useCollection. */

"use client";
import { createContext, useContext } from "react";
import { useCollection } from "@/firebase/hooks/useCollection";
import { useDocument } from "@/firebase/hooks/useDocument";
import type {
  Student,
  Teacher,
  Room,
  Resource,
  Class,
  Enrollment,
  CustomEventType,
  AppSettings,
} from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/config";

interface DataContextProps {
  students: Student[];
  classes: Class[];
  teachers: Teacher[];
  rooms: Room[];
  resources: Resource[];
  enrollments: Enrollment[];
  customEventTypes: CustomEventType[];
  settings: Required<AppSettings>;
  loading: boolean;
  error: string | null; // surfaces first Firestore error (e.g. permission denied)
}

const DataContext = createContext<DataContextProps>({
  students: [],
  classes: [],
  teachers: [],
  rooms: [],
  resources: [],
  enrollments: [],
  customEventTypes: [],
  settings: DEFAULT_SETTINGS,
  loading: true,
  error: null,
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { data: students, loading: l1, error: e1 } = useCollection<Student>("students");
  const { data: classes, loading: l2, error: e2 } = useCollection<Class>("classes");
  const { data: teachers, loading: l3 } = useCollection<Teacher>("teachers");
  const { data: rooms, loading: l4 } = useCollection<Room>("rooms");
  const { data: resources, loading: l5 } =
    useCollection<Resource>("physicalEquipment");
  const { data: enrollments, loading: l6 } =
    useCollection<Enrollment>("enrollments");
  const { data: customEventTypes, loading: l7 } =
    useCollection<CustomEventType>("customEventTypes");
  const { data: settingsDoc, loading: l8 } = useDocument<
    AppSettings & { id: string }
  >("settings", "main");

  // this is an array of boolians, checking whether any values is still loading from firebase or everything was loaded already.
  const loading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8;
  // surface the first error (e.g. "Missing or insufficient permissions")
  const error = e1 ?? e2 ?? null;
  const settings: Required<AppSettings> = {
    ...DEFAULT_SETTINGS,
    ...(settingsDoc ?? {}),
  };

  return (
    <DataContext.Provider
      value={{
        students,
        classes,
        teachers,
        rooms,
        resources,
        enrollments,
        customEventTypes,
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
