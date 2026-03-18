import {
  collection, doc, getDoc, getDocs, setDoc, query, where,
} from 'firebase/firestore';
import { db } from './firebase';
import { generateId } from '../models/taskModels';

// ── Firestore paths ───────────────────────────────────
const sessionsCol   = (uid: string) => collection(db, 'users', uid, 'sessions');
const completedCol  = (uid: string) => collection(db, 'users', uid, 'completedLog');
const metaDoc       = (uid: string) => doc(db, 'users', uid, 'meta');

interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  durationSeconds: number;
  taskId?: string;
}
interface StreakData { lastDate: string; count: number; }

/** Returns YYYY-MM-DD in the device's local timezone. */
function localDateStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function todayStr(): string { return localDateStr(); }
function nDaysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDateStr(d);
}

// ── Session logging ───────────────────────────────────

export async function logSession(uid: string, durationSeconds: number, taskId?: string): Promise<void> {
  const today = todayStr();
  const session: StudySession = { id: generateId(), date: today, durationSeconds, ...(taskId ? { taskId } : {}) };
  await setDoc(doc(sessionsCol(uid), session.id), session);

  // Update streak in meta doc
  const metaSnap = await getDoc(metaDoc(uid));
  const meta = metaSnap.exists() ? metaSnap.data() : {};
  const streak: StreakData = { lastDate: meta.streakLastDate ?? '', count: meta.streakCount ?? 0 };
  if (streak.lastDate === today) return;
  const yesterday = nDaysAgoStr(1);
  const count = streak.lastDate === yesterday ? streak.count + 1 : 1;
  await setDoc(metaDoc(uid), { streakLastDate: today, streakCount: count }, { merge: true });
}

// ── Task completion logging ───────────────────────────

export async function logTaskCompletion(uid: string, taskId: string): Promise<void> {
  const entry = { id: generateId(), date: todayStr(), taskId };
  await setDoc(doc(completedCol(uid), entry.id), entry);
}

// ── Daily hours for analytics chart ──────────────────

export async function getDailyHours(uid: string): Promise<{ date: string; hours: number }[]> {
  const cutoff = nDaysAgoStr(6);
  const q = query(sessionsCol(uid), where('date', '>=', cutoff));
  const snap = await getDocs(q);
  const sessions = snap.docs.map((d) => d.data() as StudySession);

  const days: { date: string; hours: number }[] = [];
  for (let i = 6; i >= 0; i--) days.push({ date: nDaysAgoStr(i), hours: 0 });

  const dateSet = new Set(days.map((d) => d.date));
  for (const s of sessions) {
    if (dateSet.has(s.date)) {
      const entry = days.find((d) => d.date === s.date);
      if (entry) entry.hours += s.durationSeconds / 3600;
    }
  }
  return days;
}

// ── CGPA computation ──────────────────────────────────

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

async function computeCGPA(uid: string): Promise<number | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'data', 'grades'));
  const data = snap.exists() ? snap.data() : {};
  const courses: _Course[]  = data.courses ?? [];
  const past:   _PastSem[] = data.pastSemesters ?? [];

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

// ── Weekly stats ──────────────────────────────────────

export interface WeeklyStats {
  hours: number;
  streak: number;
  tasksCompleted: number;
  cgpa: number | null;
}

export async function getWeeklyStats(uid: string): Promise<WeeklyStats> {
  const cutoff = nDaysAgoStr(7);
  const today = todayStr();
  const yesterday = nDaysAgoStr(1);

  const [sessSnap, compSnap, metaSnap, cgpa] = await Promise.all([
    getDocs(query(sessionsCol(uid), where('date', '>=', cutoff))),
    getDocs(query(completedCol(uid), where('date', '>=', cutoff))),
    getDoc(metaDoc(uid)),
    computeCGPA(uid),
  ]);

  const totalSec = sessSnap.docs.reduce((s, d) => s + (d.data().durationSeconds ?? 0), 0);
  const meta = metaSnap.exists() ? metaSnap.data() : {};
  const streakLastDate = meta.streakLastDate ?? '';
  const streakCount = meta.streakCount ?? 0;
  const activeStreak = (streakLastDate === today || streakLastDate === yesterday) ? streakCount : 0;

  return {
    hours: Math.round((totalSec / 3600) * 10) / 10,
    streak: activeStreak,
    tasksCompleted: compSnap.size,
    cgpa,
  };
}
