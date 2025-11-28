import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Firestore
} from "firebase/firestore";
import { db as defaultDb } from "@/firebase/auth";

export const notifRefFor = (firestore: Firestore) => collection(firestore, "notifications");

export function listenNotifications(callback: Function, firestore?: Firestore) {
  const ref = notifRefFor(firestore || defaultDb);
  const q = query(ref, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(all);
  });
}

export async function pushNotification(data: any, firestore?: Firestore) {
  const ref = notifRefFor(firestore || defaultDb);
  data.createdAt = Date.now();
  data.readBy = data.readBy || [];
  return await addDoc(ref, data);
}

export async function deleteNotification(id: string, firestore?: Firestore) {
  const db = firestore || defaultDb;
  const ref = doc(db, "notifications", id);
  await deleteDoc(ref);
}
