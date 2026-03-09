import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskList } from '../models/taskModels';

const tasksKey = (uid: string) => `tasks_${uid}`;
const listsKey = (uid: string) => `task_lists_${uid}`;

export async function getAllTasks(uid: string): Promise<Task[]> {
  const json = await AsyncStorage.getItem(tasksKey(uid));
  if (!json) return [];
  return JSON.parse(json) as Task[];
}

export async function getAllLists(uid: string): Promise<TaskList[]> {
  const json = await AsyncStorage.getItem(listsKey(uid));
  if (!json) return [];
  return JSON.parse(json) as TaskList[];
}

export async function saveAllTasks(uid: string, tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(tasksKey(uid), JSON.stringify(tasks));
}

export async function saveAllLists(uid: string, lists: TaskList[]): Promise<void> {
  await AsyncStorage.setItem(listsKey(uid), JSON.stringify(lists));
}

export async function addTask(uid: string, task: Task): Promise<void> {
  const tasks = await getAllTasks(uid);
  tasks.push(task);
  await saveAllTasks(uid, tasks);
}

export async function updateTask(uid: string, updated: Task): Promise<void> {
  const tasks = await getAllTasks(uid);
  const idx = tasks.findIndex((t) => t.id === updated.id);
  if (idx !== -1) {
    tasks[idx] = updated;
    await saveAllTasks(uid, tasks);
  }
}

export async function deleteTask(uid: string, id: string): Promise<void> {
  const tasks = await getAllTasks(uid);
  await saveAllTasks(uid, tasks.filter((t) => t.id !== id));
}

export async function addList(uid: string, list: TaskList): Promise<void> {
  const lists = await getAllLists(uid);
  lists.push(list);
  await saveAllLists(uid, lists);
}

export async function updateList(uid: string, updated: TaskList): Promise<void> {
  const lists = await getAllLists(uid);
  const idx = lists.findIndex((l) => l.id === updated.id);
  if (idx !== -1) {
    lists[idx] = updated;
    await saveAllLists(uid, lists);
  }
}

export async function deleteList(uid: string, id: string): Promise<void> {
  const lists = await getAllLists(uid);
  await saveAllLists(uid, lists.filter((l) => l.id !== id));
  const tasks = await getAllTasks(uid);
  await saveAllTasks(uid, tasks.filter((t) => t.listId !== id));
}
