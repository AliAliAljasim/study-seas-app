import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskList } from '../models/taskModels';

const TASKS_KEY = 'tasks';
const LISTS_KEY = 'task_lists';

export async function getAllTasks(): Promise<Task[]> {
  const json = await AsyncStorage.getItem(TASKS_KEY);
  if (!json) return [];
  return JSON.parse(json) as Task[];
}

export async function getAllLists(): Promise<TaskList[]> {
  const json = await AsyncStorage.getItem(LISTS_KEY);
  if (!json) return [];
  return JSON.parse(json) as TaskList[];
}

export async function saveAllTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export async function saveAllLists(lists: TaskList[]): Promise<void> {
  await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(lists));
}

export async function addTask(task: Task): Promise<void> {
  const tasks = await getAllTasks();
  tasks.push(task);
  await saveAllTasks(tasks);
}

export async function updateTask(updated: Task): Promise<void> {
  const tasks = await getAllTasks();
  const idx = tasks.findIndex((t) => t.id === updated.id);
  if (idx !== -1) {
    tasks[idx] = updated;
    await saveAllTasks(tasks);
  }
}

export async function deleteTask(id: string): Promise<void> {
  const tasks = await getAllTasks();
  await saveAllTasks(tasks.filter((t) => t.id !== id));
}

export async function addList(list: TaskList): Promise<void> {
  const lists = await getAllLists();
  lists.push(list);
  await saveAllLists(lists);
}

export async function updateList(updated: TaskList): Promise<void> {
  const lists = await getAllLists();
  const idx = lists.findIndex((l) => l.id === updated.id);
  if (idx !== -1) {
    lists[idx] = updated;
    await saveAllLists(lists);
  }
}

export async function deleteList(id: string): Promise<void> {
  const lists = await getAllLists();
  await saveAllLists(lists.filter((l) => l.id !== id));
  // Also delete tasks in that list
  const tasks = await getAllTasks();
  await saveAllTasks(tasks.filter((t) => t.listId !== id));
}
