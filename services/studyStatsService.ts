import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../models/taskModels';

// ── Storage keys ─────────────────────────────────────────
const sessionsKey  = (uid: string) => `study_sessions_${uid}`;
const streakKey    = (uid: string) => `study_streak_${uid}`;
const completedKey = (uid: string) => `completed_log_${uid}`;

interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  durationSeconds: number;
  taskId?: string;
}
interface StreakData { lastDate: string; count: number; }

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}
function nDaysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

// ── Session logging ───────────────────────────────────────

export async function logSession(uid: string, durationSeconds: number, taskId?: string): Promise<void> {
  const today = todayStr();

  // Persist session (keep 30 days)
  const json = await AsyncStorage.getItem(sessionsKey(uid));
  const sessions: StudySession[] = json ? JSON.parse(json) : [];
  const cutoff = nDaysAgoStr(30);
  const kept = sessions.filter((s) => s.date >= cutoff);
  kept.push({ id: generateId(), date: today, durationSeconds, taskId });
  await AsyncStorage.setItem(sessionsKey(uid), JSON.stringify(kept));

  // Update study streak
  const sJson = await AsyncStorage.getItem(streakKey(uid));
  const streak: StreakData = sJson ? JSON.parse(sJson) : { lastDate: '', count: 0 };
  if (streak.lastDate === today) return; // already logged today
  const yesterday = nDaysAgoStr(1);
  const count = streak.lastDate === yesterday ? streak.count + 1 : 1;
  await AsyncStorage.setItem(streakKey(uid), JSON.stringify({ lastDate: today, count }));
}

// ── Task completion logging ───────────────────────────────

export async function logTaskCompletion(uid: string, taskId: string): Promise<void> {
  const json = await AsyncStorage.getItem(completedKey(uid));
  const log: { date: string; taskId: string }[] = json ? JSON.parse(json) : [];
  const kept = log.filter((l) => l.date >= nDaysAgoStr(30));
  kept.push({ date: todayStr(), taskId });
  await AsyncStorage.setItem(completedKey(uid), JSON.stringify(kept));
}

// ── CGPA computation (mirrors grades.tsx logic) ───────────

interface _Assignment { score: number; maxScore: number; weight: number; }
interface _Course     { credits: number; assignments: _Assignment[]; }
interface _PastSem    { gpa: number; credits: number; }

function _courseGrade(c: _Course): number | null {
  if (!c.assignments.length) return null;
  const tw = c.assignments.reduce((s, a) => s + a.weight, 0);
  if (!tw) return null;
  return c.assignments.reduce((s, a) => s + (a.score / a.maxScore) * 100 * a.weight, 0) / tw;
}
function _pctToGPA(pct: number): number {
  if (pct >= 93) return 4.0; if (pct >= 90) return 3.7; if (pct >= 87) return 3.3;
  if (pct >= 83) return 3.0; if (pct >= 80) return 2.7; if (pct >= 77) return 2.3;
  if (pct >= 73) return 2.0; if (pct >= 70) return 1.7; if (pct >= 67) return 1.3;
  if (pct >= 60) return 1.0; return 0.0;
}

async function computeCGPA(): Promise<number | null> {
  const [cJson, pJson] = await Promise.all([
    AsyncStorage.getItem('grades_courses'),
    AsyncStorage.getItem('grades_past_semesters'),
  ]);
  const courses: _Course[]  = cJson ? JSON.parse(cJson) : [];
  const past:   _PastSem[] = pJson ? JSON.parse(pJson) : [];

  const graded = courses.filter((c) => _courseGrade(c) !== null);
  const all: _PastSem[] = [...past];
  if (graded.length) {
    const tc = graded.reduce((s, c) => s + c.credits, 0);
    const tp = graded.reduce((s, c) => s + _pctToGPA(_courseGrade(c)!) * c.credits, 0);
    if (tc > 0) all.push({ gpa: tp / tc, credits: tc });
  }
  if (!all.length) return null;
  const tc = all.reduce((s, x) => s + x.credits, 0);
  const tp = all.reduce((s, x) => s + x.gpa * x.credits, 0);
  return tc > 0 ? tp / tc : null;
}

// ── Weekly stats ──────────────────────────────────────────

export interface WeeklyStats {
  hours: number;
  streak: number;
  tasksCompleted: number;
  cgpa: number | null;
}

export async function getWeeklyStats(uid: string): Promise<WeeklyStats> {
  const cutoff = nDaysAgoStr(7);
  const [sessJson, streakJson, compJson, cgpa] = await Promise.all([
    AsyncStorage.getItem(sessionsKey(uid)),
    AsyncStorage.getItem(streakKey(uid)),
    AsyncStorage.getItem(completedKey(uid)),
    computeCGPA(),
  ]);

  const sessions: StudySession[]            = sessJson   ? JSON.parse(sessJson)   : [];
  const streak:   StreakData                = streakJson ? JSON.parse(streakJson) : { lastDate: '', count: 0 };
  const log:      { date: string }[]        = compJson   ? JSON.parse(compJson)   : [];

  const weekSessions = sessions.filter((s) => s.date >= cutoff);
  const totalSec     = weekSessions.reduce((s, x) => s + x.durationSeconds, 0);

  return {
    hours: Math.round((totalSec / 3600) * 10) / 10,
    streak: streak.count,
    tasksCompleted: log.filter((l) => l.date >= cutoff).length,
    cgpa,
  };
}
