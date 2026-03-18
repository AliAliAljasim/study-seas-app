import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Show notifications when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type NotifMap = Record<string, string[]>; // entityId -> scheduled notif IDs

const notifDoc = (uid: string) => doc(db, 'users', uid, 'data', 'notifMap');

async function getNotifMap(uid: string): Promise<NotifMap> {
  const snap = await getDoc(notifDoc(uid));
  return snap.exists() ? (snap.data().map ?? {}) : {};
}

async function saveNotifMap(uid: string, map: NotifMap): Promise<void> {
  await setDoc(notifDoc(uid), { map }, { merge: true });
}

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelNotifications(uid: string, entityId: string): Promise<void> {
  const map = await getNotifMap(uid);
  const ids = map[entityId] ?? [];
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
  delete map[entityId];
  await saveNotifMap(uid, map);
}

/** Schedule a "due tomorrow" (8 pm) and "due today" (8 am) notification for a task. */
export async function scheduleTaskNotifications(
  uid: string,
  taskId: string,
  title: string,
  dueDate: string,
): Promise<void> {
  await cancelNotifications(uid, taskId);
  const now = Date.now();
  const ids: string[] = [];

  // Evening before
  const eve = new Date(dueDate + 'T20:00:00');
  if (eve.getTime() > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: '📋 Due Tomorrow', body: title, data: { taskId } },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: eve },
    });
    ids.push(id);
  }

  // Morning of
  const morn = new Date(dueDate + 'T08:00:00');
  if (morn.getTime() > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: '⏰ Due Today', body: title, data: { taskId } },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: morn },
    });
    ids.push(id);
  }

  if (ids.length > 0) {
    const map = await getNotifMap(uid);
    map[taskId] = ids;
    await saveNotifMap(uid, map);
  }
}

/** Schedule a 30-min-before notification for a calendar event (or 8 am if no time). */
export async function scheduleEventNotification(
  uid: string,
  eventId: string,
  title: string,
  date: string,
  startTime?: string,
): Promise<void> {
  await cancelNotifications(uid, eventId);

  let trigger: Date;
  let body: string;
  if (startTime) {
    trigger = new Date(`${date}T${startTime}:00`);
    trigger.setMinutes(trigger.getMinutes() - 30);
    body = `Starting in 30 minutes at ${startTime}`;
  } else {
    trigger = new Date(date + 'T08:00:00');
    body = 'Today';
  }

  if (trigger.getTime() <= Date.now()) return;

  const id = await Notifications.scheduleNotificationAsync({
    content: { title: '📅 ' + title, body, data: { eventId } },
    trigger: { type: SchedulableTriggerInputTypes.DATE, date: trigger },
  });

  const map = await getNotifMap(uid);
  map[eventId] = [id];
  await saveNotifMap(uid, map);
}
