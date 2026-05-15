"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export function useCollection<T extends { id: string }>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        const docs = snap.docs.map((doc: QueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [collectionName]);

  return { data, loading, error };
}
