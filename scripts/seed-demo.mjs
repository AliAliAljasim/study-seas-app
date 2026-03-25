/**
 * Study Seas — Demo Account Seeder
 *
 * Usage:
 *   1. Create the account in the app (demo@studyseas.app / Demo1234!)
 *   2. Verify the email via the link sent to your inbox
 *   3. Run:  node scripts/seed-demo.mjs
 *
 * The script signs in and writes sample data for every feature.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
} from 'firebase/auth';
import {
  getFirestore, doc, setDoc, collection, writeBatch,
} from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// ── Load .env ────────────────────────────────────────────
dotenv.config();

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const DEMO_EMAIL    = 'demo@studyseas.app';
const DEMO_PASSWORD = 'Demo1234!';

// ── Helpers ──────────────────────────────────────────────
let _id = 1000;
const id = () => `demo_${(_id++).toString(36)}`;
const today      = new Date();
const dateStr    = (x) => x.toISOString().split('T')[0];
const daysAgo    = (n) => { const x = new Date(today); x.setDate(x.getDate() - n); return dateStr(x); };
const daysAhead  = (n) => { const x = new Date(today); x.setDate(x.getDate() + n); return dateStr(x); };

// ── Step 1: sign in or create ────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

let cred;
try {
  console.log(`Signing in as ${DEMO_EMAIL}…`);
  cred = await signInWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
  console.log('Signed into existing account.');
} catch {
  console.log('Account not found — creating it…');
  cred = await createUserWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
  console.log('Account created.');
}
const uid = cred.user.uid;
console.log(`UID: ${uid}`);

// ── Step 2: mark email verified via REST API ─────────────
{
  const idToken = await cred.user.getIdToken();
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${process.env.EXPO_PUBLIC_FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, emailVerified: true, returnSecureToken: false }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    console.error('❌ Could not verify email:', err.error?.message);
    process.exit(1);
  }
  console.log('✅ Email verified via REST API');
}

// ── Step 3: sign out + back in for fresh verified token ──
await signOut(auth);
cred = await signInWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
console.log('✅ Re-signed in with verified token');

// ── Step 4: init Firestore AFTER verified session ────────
const db = getFirestore(app);
const d  = (path) => doc(db, ...path.split('/'));

// ── 1. META ──────────────────────────────────────────────
await setDoc(d(`users/${uid}/data/meta`), {
  tutorialStep:      'done',
  streakLastDate:    daysAgo(0),
  streakCount:       14,
  starterClaimed:    true,
  accountCreatedDate: daysAgo(30),
  lastLoginDate:     daysAgo(0),
});
console.log('✅ Meta');

// ── 2. TASKS ─────────────────────────────────────────────
const lists = [
  { id: id(), title: 'Computer Science',  color: '#2E86AB', description: 'CPS 305 & CPS 406' },
  { id: id(), title: 'Mathematics',       color: '#9381FF', description: 'MTH 314 Linear Algebra' },
  { id: id(), title: 'Physics',           color: '#52B788', description: 'PCS 125 Waves & Fields' },
  { id: id(), title: 'Personal',          color: '#F4A261', description: 'Life stuff' },
];

const [cs, math, phys, personal] = lists;

const tasks = [
  // CS tasks
  { id: id(), listId: cs.id, title: 'Implement Binary Search Tree', priority: 'high', completed: false, progressState: 'inProgress', dueDate: daysAhead(3), estimatedHours: 3, estimatedMinutes: 0, repeatInterval: 'none', category: 'Study', createdAt: new Date().toISOString(), subtasks: [{ id: id(), title: 'Write insert()', completed: true, createdAt: new Date().toISOString(), order: 0 }, { id: id(), title: 'Write delete()', completed: true, createdAt: new Date().toISOString(), order: 1 }, { id: id(), title: 'Write search()', completed: false, createdAt: new Date().toISOString(), order: 2 }, { id: id(), title: 'Write unit tests', completed: false, createdAt: new Date().toISOString(), order: 3 }], notes: [{ id: id(), content: 'Review lecture 8 slides first', isPinned: true, createdAt: new Date().toISOString() }] },
  { id: id(), listId: cs.id, title: 'CPS 406 Software Design Patterns Essay', priority: 'high', completed: false, progressState: 'notStarted', dueDate: daysAhead(7), estimatedHours: 4, estimatedMinutes: 30, repeatInterval: 'none', category: 'Study', createdAt: new Date().toISOString(), subtasks: [], notes: [] },
  { id: id(), listId: cs.id, title: 'Review Sorting Algorithms', priority: 'medium', completed: true, progressState: 'done', dueDate: daysAgo(2), estimatedHours: 1, estimatedMinutes: 30, repeatInterval: 'none', category: 'Study', createdAt: new Date().toISOString(), lastCompleted: new Date().toISOString(), subtasks: [], notes: [] },
  { id: id(), listId: cs.id, title: 'A2 Submission — Linked Lists', priority: 'low', completed: true, progressState: 'done', dueDate: daysAgo(5), estimatedHours: 2, estimatedMinutes: 0, repeatInterval: 'none', category: 'Study', createdAt: new Date().toISOString(), lastCompleted: new Date().toISOString(), subtasks: [], notes: [] },
  { id: id(), listId: cs.id, title: 'Weekly Lab Report', priority: 'medium', completed: false, progressState: 'notStarted', dueDate: daysAhead(1), estimatedHours: 1, estimatedMinutes: 0, repeatInterval: 'weekly', category: 'Study', createdAt: new Date().toISOString(), subtasks: [], notes: [] },

  // Math tasks
  { id: id(), listId: math.id, title: 'Problem Set 5 — Eigenvalues', priority: 'high', completed: false, progressState: 'inProgress', dueDate: daysAhead(2), estimatedHours: 2, estimatedMinutes: 0, repeatInterval: 'none', category: 'Study', createdAt: new Date().toISOString(), subtasks: [{ id: id(), title: 'Questions 1–5', completed: true, createdAt: new Date().toISOString(), order: 0 }, { id: id(), title: 'Questions 6–10', completed: false, createdAt: new Date().toISOString(), order: 1 }], notes: [] },
  { id: id(), listId: math.id, title: 'Study for Midterm — Ch. 1–4', priority: 'high', completed: false, progressState: 'notStarted', dueDate: daysAhead(6), estimatedHours: 5, estimatedMinutes: 0, repeatInterval: 'none', category: 'Study', createdAt: new Date().toISOString(), subtasks: [], notes: [{ id: id(), content: 'Focus on orthogonal projections', isPinned: false, createdAt: new Date().toISOString() }] },
  { id: id(), listId: math.id, title: 'Review Dot Products', priority: 'low', completed: true, progressState: 'done', dueDate: daysAgo(4), estimatedHours: 0, estimatedMinutes: 45, repeatInterval: 'none', category: 'Study', createdAt: new Date().toISOString(), lastCompleted: new Date().toISOString(), subtasks: [], notes: [] },

  // Physics tasks
  { id: id(), listId: phys.id, title: 'Lab 4 — Wave Interference', priority: 'high', completed: false, progressState: 'notStarted', dueDate: daysAhead(4), estimatedHours: 2, estimatedMinutes: 30, repeatInterval: 'none', category: 'Study', createdAt: new Date().toISOString(), subtasks: [{ id: id(), title: 'Gather lab equipment', completed: true, createdAt: new Date().toISOString(), order: 0 }, { id: id(), title: 'Record observations', completed: false, createdAt: new Date().toISOString(), order: 1 }, { id: id(), title: 'Write analysis', completed: false, createdAt: new Date().toISOString(), order: 2 }], notes: [] },
  { id: id(), listId: phys.id, title: 'Read Ch. 12 — Electromagnetic Waves', priority: 'medium', completed: false, progressState: 'notStarted', dueDate: daysAhead(5), estimatedHours: 1, estimatedMinutes: 30, repeatInterval: 'none', category: 'Study', createdAt: new Date().toISOString(), subtasks: [], notes: [] },
  { id: id(), listId: phys.id, title: 'Practice Problems Set 3', priority: 'medium', completed: true, progressState: 'done', dueDate: daysAgo(3), estimatedHours: 1, estimatedMinutes: 0, repeatInterval: 'none', category: 'Study', createdAt: new Date().toISOString(), lastCompleted: new Date().toISOString(), subtasks: [], notes: [] },

  // Personal tasks
  { id: id(), listId: personal.id, title: 'Book dentist appointment', priority: 'low', completed: false, progressState: 'notStarted', dueDate: daysAhead(10), estimatedHours: 0, estimatedMinutes: 15, repeatInterval: 'none', category: 'Study', createdAt: new Date().toISOString(), subtasks: [], notes: [] },
  { id: id(), listId: personal.id, title: 'Grocery run', priority: 'medium', completed: false, progressState: 'notStarted', dueDate: daysAhead(1), estimatedHours: 0, estimatedMinutes: 30, repeatInterval: 'weekly', category: 'Study', createdAt: new Date().toISOString(), subtasks: [{ id: id(), title: 'Oats, eggs, milk', completed: false, createdAt: new Date().toISOString(), order: 0 }, { id: id(), title: 'Chicken & vegetables', completed: false, createdAt: new Date().toISOString(), order: 1 }], notes: [] },
  { id: id(), listId: personal.id, title: 'Call mom', priority: 'low', completed: true, progressState: 'done', dueDate: daysAgo(1), estimatedHours: 0, estimatedMinutes: 20, repeatInterval: 'weekly', category: 'Study', createdAt: new Date().toISOString(), lastCompleted: new Date().toISOString(), subtasks: [], notes: [] },
];

// Write lists
let batch = writeBatch(db);
for (const list of lists) {
  batch.set(d(`users/${uid}/lists/${list.id}`), { ...list, icon: 'folder', tasks: [], createdAt: new Date().toISOString() });
}
await batch.commit();

// Write tasks
batch = writeBatch(db);
for (const task of tasks) {
  batch.set(d(`users/${uid}/tasks/${task.id}`), task);
}
await batch.commit();
console.log(`✅ Tasks (${tasks.length}) + Lists (${lists.length})`);

// ── 3. CALENDAR EVENTS ───────────────────────────────────
const events = [
  // Upcoming exams
  { id: id(), title: 'CPS 305 Midterm Exam',        date: daysAhead(8),  category: 'exam',       startTime: '10:00', endTime: '12:00', description: 'Covers data structures Ch. 1–6' },
  { id: id(), title: 'MTH 314 Midterm Exam',         date: daysAhead(13), category: 'exam',       startTime: '14:00', endTime: '16:00' },
  { id: id(), title: 'PCS 125 Quiz 3',               date: daysAhead(5),  category: 'exam',       startTime: '09:00', endTime: '09:30' },

  // Upcoming assignments
  { id: id(), title: 'CPS 406 Essay Due',            date: daysAhead(7),  category: 'assignment', startTime: '23:59' },
  { id: id(), title: 'MTH 314 Problem Set 5 Due',    date: daysAhead(2),  category: 'assignment', startTime: '23:59' },
  { id: id(), title: 'PCS 125 Lab 4 Due',            date: daysAhead(4),  category: 'assignment', startTime: '17:00' },

  // Study sessions
  { id: id(), title: 'Study Session — Linear Algebra', date: daysAhead(1),  category: 'study', startTime: '14:00', endTime: '17:00', description: 'Focus on eigenvalues & eigenvectors' },
  { id: id(), title: 'Study Session — CPS 305',        date: daysAhead(3),  category: 'study', startTime: '10:00', endTime: '13:00' },
  { id: id(), title: 'Group Study — Physics',          date: daysAhead(6),  category: 'study', startTime: '13:00', endTime: '15:00', description: 'Library room B204' },
  { id: id(), title: 'Pre-Exam Review',                date: daysAhead(7),  category: 'study', startTime: '19:00', endTime: '22:00' },

  // Reminders
  { id: id(), title: 'Submit OSAP documents',          date: daysAhead(10), category: 'reminder' },
  { id: id(), title: 'Drop/Add deadline',              date: daysAhead(14), category: 'reminder', description: 'Last day to drop without academic penalty' },

  // Personal
  { id: id(), title: 'Gym',                            date: daysAhead(0),  category: 'personal', startTime: '07:00', endTime: '08:00' },
  { id: id(), title: 'Gym',                            date: daysAhead(2),  category: 'personal', startTime: '07:00', endTime: '08:00' },
  { id: id(), title: 'Gym',                            date: daysAhead(4),  category: 'personal', startTime: '07:00', endTime: '08:00' },
  { id: id(), title: "Coffee with Alex",               date: daysAhead(3),  category: 'personal', startTime: '12:00', endTime: '13:00' },

  // Past events
  { id: id(), title: 'CPS 305 Assignment 2',          date: daysAgo(5),   category: 'assignment', startTime: '23:59' },
  { id: id(), title: 'MTH 314 Quiz 2',                date: daysAgo(8),   category: 'exam',       startTime: '10:00', endTime: '10:30' },
  { id: id(), title: 'Study Session — Sorting Alg.',  date: daysAgo(2),   category: 'study',      startTime: '15:00', endTime: '17:00' },
];

batch = writeBatch(db);
for (const ev of events) {
  batch.set(d(`users/${uid}/events/${ev.id}`), ev);
}
await batch.commit();
console.log(`✅ Calendar events (${events.length})`);

// ── 4. GRADES ────────────────────────────────────────────
const assignId = () => id();
const grades = {
  courses: [
    {
      id: id(), name: 'CPS 305 — Data Structures', credits: 3,
      assignments: [
        { id: assignId(), name: 'Assignment 1', score: 88,  maxScore: 100, weight: 10 },
        { id: assignId(), name: 'Assignment 2', score: 74,  maxScore: 100, weight: 10 },
        { id: assignId(), name: 'Quiz 1',        score: 17,  maxScore: 20,  weight: 5  },
        { id: assignId(), name: 'Quiz 2',        score: 15,  maxScore: 20,  weight: 5  },
        { id: assignId(), name: 'Midterm',       score: 71,  maxScore: 100, weight: 30 },
      ],
    },
    {
      id: id(), name: 'MTH 314 — Linear Algebra', credits: 3,
      assignments: [
        { id: assignId(), name: 'Problem Set 1', score: 95,  maxScore: 100, weight: 8  },
        { id: assignId(), name: 'Problem Set 2', score: 88,  maxScore: 100, weight: 8  },
        { id: assignId(), name: 'Problem Set 3', score: 90,  maxScore: 100, weight: 8  },
        { id: assignId(), name: 'Problem Set 4', score: 82,  maxScore: 100, weight: 8  },
        { id: assignId(), name: 'Quiz 1',         score: 18,  maxScore: 20,  weight: 5  },
        { id: assignId(), name: 'Quiz 2',         score: 16,  maxScore: 20,  weight: 5  },
      ],
    },
    {
      id: id(), name: 'PCS 125 — Waves & Fields', credits: 3,
      assignments: [
        { id: assignId(), name: 'Lab 1', score: 92,  maxScore: 100, weight: 8  },
        { id: assignId(), name: 'Lab 2', score: 85,  maxScore: 100, weight: 8  },
        { id: assignId(), name: 'Lab 3', score: 89,  maxScore: 100, weight: 8  },
        { id: assignId(), name: 'Quiz 1', score: 14,  maxScore: 20,  weight: 5  },
        { id: assignId(), name: 'Quiz 2', score: 16,  maxScore: 20,  weight: 5  },
        { id: assignId(), name: 'Midterm', score: 78, maxScore: 100, weight: 25 },
      ],
    },
  ],
  pastSemesters: [
    { id: id(), name: 'Fall 2023',   gpa: 3.33, credits: 15 },
    { id: id(), name: 'Winter 2024', gpa: 3.67, credits: 15 },
    { id: id(), name: 'Fall 2024',   gpa: 3.00, credits: 12 },
  ],
};

await setDoc(d(`users/${uid}/data/grades`), grades);
console.log('✅ Grades (3 courses, 3 past semesters)');

// ── 5. TIMER PREFS ───────────────────────────────────────
await setDoc(d(`users/${uid}/data/timerPrefs`), {
  pomodoroFocus: 25, pomodoroShort: 5,  pomodoroLong: 15,
  rule52Focus:   52, rule17Break:   17,
  flowtimeShort:  5, flowtimeLong:  10,
});
console.log('✅ Timer prefs');

// ── 6. STUDY SESSIONS ────────────────────────────────────
const sessions = [];
for (let i = 0; i < 20; i++) {
  const dayOffset = Math.floor(i / 2);
  sessions.push({
    id: id(),
    date: daysAgo(dayOffset),
    duration: 1500 + Math.floor(Math.random() * 2100), // 25–60 min in seconds
    taskId: null,
    createdAt: new Date(today.getTime() - dayOffset * 86400000).toISOString(),
  });
}

batch = writeBatch(db);
for (const s of sessions) {
  batch.set(d(`users/${uid}/sessions/${s.id}`), s);
}
await batch.commit();
console.log(`✅ Study sessions (${sessions.length})`);

// ── 7. COMPLETED TASKS LOG ───────────────────────────────
const completedLog = [];
for (let i = 0; i < 15; i++) {
  completedLog.push({
    id: id(),
    taskId: `task_${i}`,
    date: daysAgo(Math.floor(i / 2)),
    completedAt: new Date(today.getTime() - (i / 2) * 86400000).toISOString(),
  });
}

batch = writeBatch(db);
for (const c of completedLog) {
  batch.set(d(`users/${uid}/completedLog/${c.id}`), c);
}
await batch.commit();
console.log(`✅ Completed task log (${completedLog.length})`);

// ── 8. AQUARIUM — ALL FISH UNLOCKED ──────────────────────
const ALL_FISH_IDS = [
  'worm','rusty_can','apple_core','bottle','seaweed','lure',
  'goldfish','guppy','bluegill','silverjaw_minnow','tadpole','mussel','anchovy','goby','shrimp','starfish',
  'bass','catfish','yellow_perch','neon_tetra','clownfish','surgeonfish','yellow_tang','flounder','jellyfish','crab_dungeness','coral','seashell','sand_dollar',
  'carp','rainbow_trout','salmon','angelfish','seahorse','pufferfish','blue_groper','napoleon_wrasse','tuna',
  'arowana','purple_tang','blue_angelfish','moray_eel','ribbon_eel','stingray','anglerfish','upside_down_jellyfish','pearl',
  'otter','crab_blue','crab_king','great_white_shark',
];

batch = writeBatch(db);
for (const speciesId of ALL_FISH_IDS) {
  const fishId = id();
  batch.set(d(`users/${uid}/fish/${fishId}`), {
    id: fishId,
    speciesId,
    obtainedAt: new Date(today.getTime() - Math.random() * 30 * 86400000).toISOString(),
    count: speciesId === 'otter' ? 1 : Math.floor(Math.random() * 3) + 1,
  });
}
await batch.commit();
console.log(`✅ Fish (${ALL_FISH_IDS.length} species unlocked)`);

// ── 9. AQUARIUM — EGGS ───────────────────────────────────
const eggRarities = ['common', 'uncommon', 'rare', 'epic'];
const eggs = eggRarities.map((rarity, i) => {
  const eggId = id();
  const now = today.getTime();
  const earnedAt = new Date(now - i * 600000).toISOString();
  const readyAt  = new Date(now + (i + 1) * 3600000).toISOString();
  const expiresAt = new Date(now + (i + 1) * 3600000 + 48 * 3600000).toISOString();
  return {
    id: eggId,
    rarity,
    earnedAt,
    readyAt,
    expiresAt,
  };
});

batch = writeBatch(db);
for (const egg of eggs) {
  batch.set(d(`users/${uid}/eggs/${egg.id}`), egg);
}
await batch.commit();
console.log(`✅ Eggs (${eggs.length} — one of each rarity, hatching in 1–4 hrs)`);

// ── 10. NOTIFICATION MAP ─────────────────────────────────
await setDoc(d(`users/${uid}/data/notifMap`), { map: {} });
console.log('✅ Notification map');


console.log('\n🎉 Demo account fully seeded!');
console.log(`   Email:    ${DEMO_EMAIL}`);
console.log(`   Password: ${DEMO_PASSWORD}`);
process.exit(0);
