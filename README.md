# Study App

A React Native / Expo study companion with a fish-collection mechanic. Complete focus sessions and daily check-ins to earn fish eggs, hatch new species, and build out your aquarium — while tracking grades, tasks, and study habits all in one place.

---

## Features

### Dashboard (`/`)
- Greeting, daily quote, and date
- Aquarium spotlight card linking to your collection
- Live stats pills — fish collected, eggs waiting, biomes unlocked, pending tasks
- **Weekly summary card** — hours studied, tasks done, study streak, and current GPA at a glance
- **Priority tasks preview** — top 3 high-priority pending tasks surface directly on the home screen
- Daily login egg modal — a free egg is awarded once per calendar day (Eastern Time), ready to hatch at midnight ET

### Focus Timer (`/timer`)
- Three techniques: **Pomodoro** (25/5), **Flowtime**, and **52/17 Rule**
- **Task focus selector** — pick a pending task before starting; session history shows the task name
- After each focus session: earn a fish egg, log a study session to the streak tracker, and optionally mark the linked task as complete in one tap
- Session history (in-memory per session) with duration and timestamps

### Tasks (`/todo`)
- List-based organisation with custom colours
- Per-task: title, description, priority (none / low / medium / high), due date, and **repeat interval** (none / daily / weekly)
- Long-press to delete with a 3.5-second **undo snackbar** — no confirmation dialog
- Checking off a task logs it to the weekly stats

### Calendar (`/calendar`)
- Monthly calendar with colour-coded event dots
- Event categories: Study, Exam, Assignment, Personal, Reminder
- **Spinner time picker** — up/down chevrons for hour (0–23) and minute (5-min steps); tap "Set time" to activate, ✕ to clear
- Upcoming events panel (next 5)
- Long-press to delete with **undo snackbar**

### Grades (`/grades`)
- **Courses tab** — add courses with credit hours; add weighted assignments; live letter grade and percentage per course
- **GPA tab** — cumulative GPA hero, current semester breakdown, past semesters, and a **GPA trend line chart** (SVG, appears once you have 2+ data points)
- **Goal tab** — "what score do I need?" calculator

### Aquarium (`/aquarium`)
- Egg incubation system — eggs become hatchable after a set countdown (daily login egg is ready at midnight ET; focus-session eggs take 24 h)
- Random species rolls weighted by rarity and unlocked biomes
- **Fish journal** — tap any owned species in the bestiary to read a real-world fact or pop-culture reference about it (popup modal)
- Bestiary sorted by rarity with owned/missing indicators
- Biome unlock progression: Fresh Water → Salt Water → Deep Sea etc.

### Settings (`/settings`)
- Light / Dark / System theme toggle

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React Native 0.81 + Expo 54 |
| Navigation | Expo Router (file-based) |
| Storage | `@react-native-async-storage/async-storage` |
| Icons | `@expo/vector-icons` (Ionicons) |
| Charts / SVG | `react-native-svg` |
| Calendar UI | `react-native-calendars` |

No backend — all data is stored locally on-device.

---

## Project Structure

```
study-app/
├── app/
│   ├── (auth)/          # Sign-in and sign-up screens
│   └── (app)/           # Main app screens (tab/stack layout)
│       ├── index.tsx    # Dashboard
│       ├── timer.tsx    # Focus timer
│       ├── todo.tsx     # Task lists
│       ├── calendar.tsx # Calendar & events
│       ├── grades.tsx   # Grade tracker
│       ├── aquarium.tsx # Fish collection
│       └── settings.tsx # Theme settings
├── components/
│   └── FishSVG.tsx      # Fish sprite renderer
├── context/
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── TutorialContext.tsx
├── models/
│   ├── taskModels.ts    # Task / TaskList / priority types
│   └── aquariumModels.ts # Fish species, biomes, rarity
├── services/
│   ├── aquariumService.ts   # Egg lifecycle, daily login, hatching
│   ├── taskService.ts       # Task CRUD (AsyncStorage)
│   └── studyStatsService.ts # Session logging, streak, weekly stats
├── constants/
│   └── colors.ts        # Light/dark theme tokens
└── assets/fish/         # 51 pixel-art fish sprites
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the Expo dev server
npx expo start
```

Scan the QR code with Expo Go (iOS / Android) or run in a simulator.

---

## Fish Collection

The app ships with **51 species** across several rarity tiers:

| Rarity | Examples |
|---|---|
| Trash | Worm, Rusty Can, Bottle |
| Common | Goldfish, Guppy, Anchovy |
| Uncommon | Clownfish, Seahorse, Crab Dungeness |
| Rare | Anglerfish, Moray Eel, Napoleon Wrasse |
| Epic | Great White Shark, King Crab, Ribbon Eel |
| Legendary | Otter *(starter, non-rollable)* |

New biomes unlock as your collection grows, expanding the pool of rollable species.
