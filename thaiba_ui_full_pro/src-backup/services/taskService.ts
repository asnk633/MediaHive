import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Firestore
} from "firebase/firestore";

import { db as defaultDb } from "../firebase/firebaseWrapper";
import { pushNotification } from "./notificationService";

export const tasksRefFor = (firestore: Firestore) => collection(firestore, "tasks");

export function listenTasks(callback: Function, firestore?: Firestore) {
  const ref = tasksRefFor(firestore || defaultDb);
  const q = query(ref, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(all);
  });
}

export async function createTask(data: any, firestore?: Firestore) {
  const db = firestore || defaultDb;
  data.createdAt = Date.now();
  data.updatedAt = Date.now();
  const res = await addDoc(tasksRefFor(db), data);

  // create notification (uses same firestore instance when supplied)
  await pushNotification({
    title: "New task created",
    body: data.title,
    type: "task",
    taskId: res.id,
    readBy: []
  }, db);

  return res;
}

export async function updateTask(id: string, data: any, firestore?: Firestore) {
  const db = firestore || defaultDb;
  data.updatedAt = Date.now();
  const ref = doc(db, "tasks", id);
  await updateDoc(ref, data);

  await pushNotification({
    title: "Task updated",
    body: data.title,
    type: "task-update",
    taskId: id,
    readBy: []
  }, db);
}

export async function deleteTask(id: string, firestore?: Firestore) {
  const db = firestore || defaultDb;
  const ref = doc(db, "tasks", id);
  await deleteDoc(ref);
}
