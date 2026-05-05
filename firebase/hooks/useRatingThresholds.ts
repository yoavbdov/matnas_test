"use client";
import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export interface RatingBucketConfig {
  label: string;
  min: number | null; // null = no lower bound
  max: number | null; // null = no upper bound
}

// Default 4 buckets shown on first load (before admin customizes)
export const DEFAULT_BUCKETS: RatingBucketConfig[] = [
  { label: "מתחילים",    min: null, max: 799  },
  { label: "בינוניים",   min: 800,  max: 1199 },
  { label: "מתקדמים",    min: 1200, max: 1599 },
  { label: "אליטה",      min: 1600, max: null  },
];

export function useRatingThresholds() {
  const [buckets, setBuckets] = useState<RatingBucketConfig[]>(DEFAULT_BUCKETS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "settings", "ratingBuckets");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setBuckets(snap.data().buckets ?? DEFAULT_BUCKETS);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function saveBuckets(newBuckets: RatingBucketConfig[]) {
    const ref = doc(db, "settings", "ratingBuckets");
    await setDoc(ref, { buckets: newBuckets });
  }

  return { buckets, saveBuckets, loading };
}
