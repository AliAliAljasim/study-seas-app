import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebase';

export type EventCategory = 'study' | 'exam' | 'assignment' | 'personal' | 'reminder';

export interface CalEvent {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  category: EventCategory;
  description?: string;
  /** Set when the event was auto-synced from a task's due date. */
  taskId?: string;
}

function eventsCol(uid: string) {
  return collection(db, 'users', uid, 'events');
}
function eventDoc(uid: string, id: string) {
  return doc(db, 'users', uid, 'events', id);
}
function currentUid(): string {
  return auth.currentUser?.uid ?? 'guest';
}

export async function getEvents(): Promise<CalEvent[]> {
  const snap = await getDocs(eventsCol(currentUid()));
  return snap.docs.map((d) => d.data() as CalEvent);
}

export function subscribeToEvents(cb: (events: CalEvent[]) => void): () => void {
  return onSnapshot(eventsCol(currentUid()), (snap) => cb(snap.docs.map((d) => d.data() as CalEvent)));
}

export async function saveEvents(events: CalEvent[]): Promise<void> {
  // Firestore doesn't support overwriting a whole collection, so callers
  // that used to call saveEvents() after filtering should instead call
  // upsertEvent / deleteEvent directly. This helper is kept for compatibility
  // and simply upserts every event in the list.
  const uid = currentUid();
  for (const ev of events) {
    await setDoc(eventDoc(uid, ev.id), ev);
  }
}

export async function upsertEvent(event: CalEvent): Promise<void> {
  await setDoc(eventDoc(currentUid(), event.id), event);
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(eventDoc(currentUid(), id));
}

/** Create or update the calendar event that mirrors a task's due date. */
export async function upsertTaskEvent(taskId: string, title: string, dueDate: string): Promise<void> {
  const id = `task_${taskId}`;
  const event: CalEvent = { id, title, date: dueDate, category: 'assignment', taskId };
  await setDoc(eventDoc(currentUid(), id), event);
}

/** Remove the calendar event that mirrors a task (if it exists). */
export async function removeTaskEvent(taskId: string): Promise<void> {
  await deleteDoc(eventDoc(currentUid(), `task_${taskId}`));
}
