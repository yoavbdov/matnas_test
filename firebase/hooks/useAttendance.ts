"use client";
/*
  useAttendance — real-time listener for all attendance sessions of a specific class.
  Returns sorted list (newest first) so history is easy to display.
*/
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import type { Attendance } from "@/lib/types";

export function useAttendance(classId: string) {
  const [data, setData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;

    const q = query(
      collection(db, "attendance"),
      where("class_id", "==", classId)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Attendance[];
      // Sort newest session first
      docs.sort((a, b) => b.date.localeCompare(a.date));
      setData(docs);
      setLoading(false);
    });

    return unsubscribe;
  }, [classId]);

  return { data, loading };
}
