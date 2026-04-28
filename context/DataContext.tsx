"use client";
import { createContext, useContext } from "react";
import { useCollection } from "@/firebase/hooks/useCollection";
import { useDocument } from "@/firebase/hooks/useDocument";
import type { Child, Teacher, Room, Resource, Class, Enrollment, CustomEventType, AppSettings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/config";

interface DataContextValue {
  students: Child[];
  classes: Class[];
  teachers: Teacher[];
  rooms: Room[];
  resources: Resource[];
  enrollments: Enrollment[];
  customEventTypes: CustomEventType[];
  settings: Required<AppSettings>;
  loading: boolean;
}

const DataContext = createContext<DataContextValue>({
  students: [],
  classes: [],
  teachers: [],
  rooms: [],
  resources: [],
  enrollments: [],
  customEventTypes: [],
  settings: DEFAULT_SETTINGS,
  loading: true,
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { data: students, loading: l1 } = useCollection<Child>("students");
  const { data: classes, loading: l2 } = useCollection<Class>("classes");
  const { data: teachers, loading: l3 } = useCollection<Teacher>("teachers");
  const { data: rooms, loading: l4 } = useCollection<Room>("rooms");
  const { data: resources, loading: l5 } = useCollection<Resource>("physicalEquipment");
  const { data: enrollments, loading: l6 } = useCollection<Enrollment>("enrollments");
  const { data: customEventTypes, loading: l7 } = useCollection<CustomEventType>("customEventTypes");
  const { data: settingsDoc, loading: l8 } = useDocument<AppSettings & { id: string }>("settings", "main");

  const loading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8;
  const settings: Required<AppSettings> = { ...DEFAULT_SETTINGS, ...(settingsDoc ?? {}) };

  return (
    <DataContext.Provider
      value={{ students, classes, teachers, rooms, resources, enrollments, customEventTypes, settings, loading }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
