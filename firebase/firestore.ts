import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";

// Firebase rejects `undefined` values — strip them before writing
function stripUndefined<T extends object>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function addDocument<T extends object>(
  collectionName: string,
  data: T
): Promise<string> {
  const ref = await addDoc(collection(db, collectionName), stripUndefined(data));
  return ref.id;
}

export async function updateDocument<T extends object>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  await updateDoc(doc(db, collectionName, id), stripUndefined(data) as object);
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

export async function deleteWhere(
  collectionName: string,
  field: string,
  value: string
): Promise<void> {
  const q = query(collection(db, collectionName), where(field, "==", value));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
