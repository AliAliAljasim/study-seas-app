export type TaskPriority = 'none' | 'low' | 'medium' | 'high';
export type RepeatInterval = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type TaskProgressState = 'notStarted' | 'inProgress' | 'done';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  order: number;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  lastModified?: string;
  isPinned: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: TaskPriority;
  completed: boolean;
  progressState: TaskProgressState;
  createdAt: string;
  dueDate?: string;
  estimatedHours: number;
  estimatedMinutes: number;
  repeatInterval: RepeatInterval;
  repeatDays?: number;
  lastCompleted?: string;
  listId?: string;
  subtasks: Subtask[];
  notes: Note[];
}

export interface TaskList {
  id: string;
  title: string;
  description?: string;
  category: string;
  createdAt: string;
  tasks: Task[];
  color: string;
  icon: string;
}

export interface GradeEntry {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  isGPA: boolean;
}

export interface CourseGrade {
  id: string;
  courseName: string;
  grade: number;
  credits: number;
  isGPA: boolean;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function priorityColor(priority: TaskPriority): string {
  switch (priority) {
    case 'high': return '#F44336';
    case 'medium': return '#FF9800';
    case 'low': return '#2196F3';
    default: return '#9E9E9E';
  }
}

export function progressColor(state: TaskProgressState): string {
  switch (state) {
    case 'done': return '#4CAF50';
    case 'inProgress': return '#FF9800';
    default: return '#9E9E9E';
  }
}
