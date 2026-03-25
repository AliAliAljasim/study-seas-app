import {
  collection, doc, getDocs, setDoc, deleteDoc, writeBatch, query, where, onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, TaskList } from '../models/taskModels';

const tasksCol  = (uid: string) => collection(db, 'users', uid, 'tasks');
const listsCol  = (uid: string) => collection(db, 'users', uid, 'lists');
const taskDoc   = (uid: string, id: string) => doc(db, 'users', uid, 'tasks', id);
const listDoc   = (uid: string, id: string) => doc(db, 'users', uid, 'lists', id);

// Firestore rejects undefined values — strip them before writing
function strip<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

export async function getAllTasks(uid: string): Promise<Task[]> {
  const snap = await getDocs(tasksCol(uid));
  return snap.docs.map((d) => d.data() as Task);
}

export async function getAllLists(uid: string): Promise<TaskList[]> {
  const snap = await getDocs(listsCol(uid));
  return snap.docs.map((d) => d.data() as TaskList);
}

export function subscribeToAllTasks(uid: string, cb: (tasks: Task[]) => void): () => void {
  return onSnapshot(tasksCol(uid), (snap) => cb(snap.docs.map((d) => d.data() as Task)));
}

export function subscribeToLists(uid: string, cb: (lists: TaskList[]) => void): () => void {
  return onSnapshot(listsCol(uid), (snap) => cb(snap.docs.map((d) => d.data() as TaskList)));
}

export async function addTask(uid: string, task: Task): Promise<void> {
  await setDoc(taskDoc(uid, task.id), strip(task));
}

export async function updateTask(uid: string, task: Task): Promise<void> {
  await setDoc(taskDoc(uid, task.id), strip(task));
}

export async function deleteTask(uid: string, id: string): Promise<void> {
  await deleteDoc(taskDoc(uid, id));
}

export async function addList(uid: string, list: TaskList): Promise<void> {
  await setDoc(listDoc(uid, list.id), strip(list));
}

export async function updateList(uid: string, list: TaskList): Promise<void> {
  await setDoc(listDoc(uid, list.id), strip(list));
}

export async function deleteList(uid: string, id: string): Promise<void> {
  await deleteDoc(listDoc(uid, id));
  // Delete all tasks belonging to this list
  const q = query(tasksCol(uid), where('listId', '==', id));
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

// Kept for internal use where a full overwrite is needed
export async function saveAllTasks(uid: string, tasks: Task[]): Promise<void> {
  const batch = writeBatch(db);
  tasks.forEach((t) => batch.set(taskDoc(uid, t.id), t));
  await batch.commit();
}

export async function saveAllLists(uid: string, lists: TaskList[]): Promise<void> {
  const batch = writeBatch(db);
  lists.forEach((l) => batch.set(listDoc(uid, l.id), l));
  await batch.commit();
}
