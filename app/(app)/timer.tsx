import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Modal, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getTheme } from '../../constants/colors';
import { useLayout, modalOverlay, modalCard } from '../../constants/layout';
import { useAuth } from '../../context/AuthContext';
import { awardEgg } from '../../services/aquariumService';
import { useTutorial } from '../../context/TutorialContext';
import * as taskService from '../../services/taskService';
import { Task, priorityColor } from '../../models/taskModels';
import { logSession, logTaskCompletion, getDailyHours } from '../../services/studyStatsService';

type Technique = 'Flowtime' | 'Pomodoro' | '52/17 Rule';
type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';

const prefsDoc = (uid: string) => doc(db, 'users', uid, 'data', 'timerPrefs');

interface TimerPrefs {
  pomodoroFocus: number;
  pomodoroShort: number;
  pomodoroLong: number;
  rule52Focus: number;
  rule17Break: number;
  flowtimeShort: number;
  flowtimeLong: number;
}

const DEFAULT_PREFS: TimerPrefs = {
  pomodoroFocus: 25, pomodoroShort: 5,  pomodoroLong: 15,
  rule52Focus:   52, rule17Break:   17,
  flowtimeShort:  5, flowtimeLong:  10,
};

const TECHNIQUE_INFO: Record<Technique, string> = {
  Flowtime:     'Work until you naturally lose focus, then take a short break.',
  Pomodoro:     'Focused sprints with short breaks. Long break after every 4 sessions.',
  '52/17 Rule': '52 min deep work + 17 min genuine rest.',
};

const PHASE_COLORS: Record<TimerPhase, string> = {
  focus: '#3DBDAA', shortBreak: '#52B788', longBreak: '#2E86AB',
};

function buildTechniques(p: TimerPrefs) {
  return {
    Flowtime:     { focus: p.flowtimeShort * 60, shortBreak: p.flowtimeShort * 60, longBreak: p.flowtimeLong * 60,  longBreakAfter: 4 },
    Pomodoro:     { focus: p.pomodoroFocus * 60,  shortBreak: p.pomodoroShort * 60, longBreak: p.pomodoroLong * 60,  longBreakAfter: 4 },
    '52/17 Rule': { focus: p.rule52Focus * 60,    shortBreak: p.rule17Break * 60,   longBreak: p.rule17Break * 60,   longBreakAfter: 3 },
  };
}

export default function TimerPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const { isTablet } = useLayout();
  const { step, setSpotlight, advance } = useTutorial();

  const [prefs, setPrefs] = useState<TimerPrefs>(DEFAULT_PREFS);
  const techniques = useMemo(() => buildTechniques(prefs), [prefs]);

  const [technique, setTechnique]           = useState<Technique>('Pomodoro');
  const [phase, setPhase]                   = useState<TimerPhase>('focus');
  const [seconds, setSeconds]               = useState(techniques['Pomodoro'].focus);
  const [running, setRunning]               = useState(false);
  const [sessionCount, setSessionCount]     = useState(0);
  const [completedSessions, setCompleted]   = useState(0);
  const [totalFocusSec, setTotalFocusSec]   = useState(0);
  const [history, setHistory]               = useState<{ label: string; duration: number; at: string }[]>([]);
  const [selectedTask, setSelectedTask]     = useState<Task | null>(null);
  const [pendingTasks, setPendingTasks]     = useState<Task[]>([]);
  const [taskSessionSec, setTaskSessionSec] = useState(0);
  const [dailyHours, setDailyHours]         = useState<{ date: string; hours: number }[]>([]);

  // Sheet visibility
  const [showTechnique, setShowTechnique] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [showSettings,   setShowSettings]   = useState(false);
  const [showAnalytics,  setShowAnalytics]  = useState(false);
  const [showHistory,    setShowHistory]    = useState(false);

  const intervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusStartRef     = useRef(0);
  const playBtnRef        = useRef<View>(null);
  const tutorialStepRef   = useRef(step);
  const phaseCompleteRef  = useRef(false);
  const selectedTaskRef   = useRef<Task | null>(null);
  const breakAnim         = useRef(new Animated.Value(0)).current;

  useEffect(() => { selectedTaskRef.current = selectedTask; }, [selectedTask]);
  useEffect(() => { tutorialStepRef.current = step; }, [step]);

  useEffect(() => {
    if (!user?.uid) return;
    getDoc(prefsDoc(user.uid)).then((snap) => {
      if (snap.exists()) setPrefs({ ...DEFAULT_PREFS, ...snap.data() });
    });
    getDailyHours(user.uid).then(setDailyHours);
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) taskService.getAllTasks(user.uid).then((all) =>
      setPendingTasks(all.filter((t) => !t.completed))
    );
  }, [user?.uid]);

  useEffect(() => {
    if (step === 'timer_prompt') {
      stopTimer(); setPhase('focus'); setSeconds(3);
      setTimeout(() => {
        playBtnRef.current?.measureInWindow((x, y, w, h) => {
          if (w > 0) setSpotlight({ x, y, w, h });
        });
      }, 600);
    } else {
      setSpotlight(null);
    }
  }, [step]);

  useEffect(() => {
    Animated.timing(breakAnim, {
      toValue: phase === 'focus' ? 0 : 1, duration: 500, useNativeDriver: false,
    }).start();
  }, [phase]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (seconds === 0 && phaseCompleteRef.current) {
      phaseCompleteRef.current = false;
      handlePhaseComplete();
    }
  }, [seconds]);

  // ── Timer controls ──────────────────────────────────────

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  };

  const startTimer = () => {
    if (running) return;
    setRunning(true);
    focusStartRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          phaseCompleteRef.current = true;
          return 0;
        }
        if (phase === 'focus') setTaskSessionSec((t) => t + 1);
        return s - 1;
      });
    }, 1000);
  };

  const resetTimer = () => {
    stopTimer();
    setPhase('focus');
    setSeconds(techniques[technique].focus);
    setTaskSessionSec(0);
  };

  const skipBreak = () => {
    stopTimer();
    setPhase('focus');
    setSeconds(techniques[technique].focus);
  };

  const changeTechnique = (t: Technique) => {
    stopTimer();
    setTechnique(t);
    setPhase('focus');
    setSeconds(buildTechniques(prefs)[t].focus);
    setSessionCount(0);
    setTaskSessionSec(0);
    setShowTechnique(false);
  };

  const handlePhaseComplete = () => {
    const cfg = techniques[technique];
    if (phase === 'focus') {
      if (tutorialStepRef.current === 'timer_prompt') advance();
      const elapsed = Math.round((Date.now() - focusStartRef.current) / 1000);
      setTotalFocusSec((t) => t + elapsed);
      setCompleted((c) => c + 1);
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      const taskAtComplete = selectedTaskRef.current;
      setHistory((h) => [{
        label: taskAtComplete ? taskAtComplete.title : `${technique} Focus`,
        duration: elapsed,
        at: new Date().toLocaleTimeString(),
      }, ...h.slice(0, 9)]);
      const isLong = newCount % cfg.longBreakAfter === 0;
      setPhase(isLong ? 'longBreak' : 'shortBreak');
      setSeconds(isLong ? cfg.longBreak : cfg.shortBreak);
      setTaskSessionSec(0);
      if (user?.uid) {
        awardEgg(user.uid);
        logSession(user.uid, elapsed, taskAtComplete?.id);
        getDailyHours(user.uid).then(setDailyHours);
      }
      const markDoneBtn = taskAtComplete && user?.uid ? [{
        text: '✓ Mark Task Done',
        onPress: () => {
          taskService.updateTask(user.uid!, {
            ...taskAtComplete, completed: true, progressState: 'done',
            lastCompleted: new Date().toISOString(),
          });
          logTaskCompletion(user.uid!, taskAtComplete.id);
          setSelectedTask(null);
          taskService.getAllTasks(user.uid!).then((all) =>
            setPendingTasks(all.filter((t) => !t.completed))
          );
        },
      }] : [];
      Alert.alert(
        'Focus Session Complete! 🎉',
        `Great work! Time for a ${isLong ? 'long' : 'short'} break.\n\n🥚 A fish egg has been added to your Aquarium!`,
        [...markDoneBtn, { text: markDoneBtn.length ? 'Later' : 'OK' }],
      );
    } else {
      setPhase('focus');
      setSeconds(cfg.focus);
      Alert.alert('Break Over!', 'Ready for your next focus session?', [{ text: "Let's go!" }]);
    }
  };

  const savePrefs = async (updated: TimerPrefs) => {
    setPrefs(updated);
    if (user?.uid) await setDoc(prefsDoc(user.uid), updated);
    stopTimer(); setPhase('focus');
    setSeconds(buildTechniques(updated)[technique].focus);
    setSessionCount(0);
  };

  const adjustPref = (key: keyof TimerPrefs, delta: number, min = 1, max = 120) => {
    const next = { ...prefs, [key]: Math.min(max, Math.max(min, prefs[key] + delta)) };
    setPrefs(next);
    savePrefs(next);
  };

  // ── Derived values ──────────────────────────────────────

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const totalSec = techniques[technique][
    phase === 'focus' ? 'focus' : phase === 'shortBreak' ? 'shortBreak' : 'longBreak'
  ];
  const progress   = 1 - seconds / totalSec;
  const phaseColor = PHASE_COLORS[phase];
  const isBreak    = phase !== 'focus';

  const estSec      = selectedTask ? (selectedTask.estimatedHours ?? 0) * 3600 + (selectedTask.estimatedMinutes ?? 0) * 60 : 0;
  const estProgress = estSec > 0 ? Math.min(1, taskSessionSec / estSec) : 0;

  // ── Render ──────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[{ flex: 1 }, isTablet && { maxWidth: 680, width: '100%', alignSelf: 'center' }]}>

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.techniquePill, { backgroundColor: phaseColor + '22', borderColor: phaseColor + '55' }]}
          onPress={() => setShowTechnique(true)}
        >
          <Text style={[styles.techniquePillText, { color: phaseColor }]}>{technique}</Text>
          <Ionicons name="chevron-down" size={13} color={phaseColor} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowSettings(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="settings-outline" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Task pill ── */}
      <TouchableOpacity
        style={[styles.taskPill, { backgroundColor: theme.card }]}
        onPress={() => setShowTaskPicker(true)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={selectedTask ? 'ellipse' : 'list-outline'}
          size={14}
          color={selectedTask ? priorityColor(selectedTask.priority) : theme.textSecondary}
        />
        <Text
          style={[styles.taskPillText, { color: selectedTask ? theme.text : theme.textSecondary }]}
          numberOfLines={1}
        >
          {selectedTask ? selectedTask.title : 'Focus on a task…'}
        </Text>
        {selectedTask ? (
          <TouchableOpacity
            onPress={() => { setSelectedTask(null); setTaskSessionSec(0); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
        )}
      </TouchableOpacity>

      {/* Estimated time progress — thin strip under task pill */}
      {selectedTask && estSec > 0 && (
        <View style={styles.estStrip}>
          <View style={[styles.estStripBg, { backgroundColor: theme.card }]}>
            <View style={[styles.estStripFill, { width: `${estProgress * 100}%`, backgroundColor: phaseColor }]} />
          </View>
          <Text style={[styles.estStripLabel, { color: theme.textSecondary }]}>
            {Math.round(estProgress * 100)}% of estimated {selectedTask.estimatedHours}h {selectedTask.estimatedMinutes}m
          </Text>
        </View>
      )}

      {/* ── Timer area ── */}
      <View style={styles.timerArea}>

        {/* Phase label — only visible during breaks */}
        {isBreak && (
          <View style={[styles.breakChip, { backgroundColor: phaseColor + '20', borderColor: phaseColor + '55' }]}>
            <Text style={[styles.breakChipText, { color: phaseColor }]}>
              {phase === 'shortBreak' ? '☕ Short Break' : '🛋️ Long Break'}
            </Text>
          </View>
        )}

        {/* Timer circle */}
        <Animated.View
          style={[
            styles.timerCircleWrap,
            { backgroundColor: isBreak ? phaseColor + '0E' : 'transparent', borderRadius: 140 },
          ]}
        >
          <View style={[styles.timerRing, { borderColor: phaseColor + '30' }]}>
            <View style={[styles.timerInner, { borderColor: phaseColor }]}>
              <Text style={[styles.timerText, { color: phaseColor }]}>{fmt(seconds)}</Text>
              <Text style={[styles.timerSub, { color: theme.textSecondary }]}>
                {isBreak ? 'break' : running ? 'focus' : 'paused'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Progress bar */}
        <View style={[styles.progressBar, { backgroundColor: theme.card }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: phaseColor }]} />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: theme.card }]} onPress={resetTimer}>
            <Ionicons name="refresh" size={22} color={theme.textSecondary} />
          </TouchableOpacity>

          <View ref={playBtnRef} collapsable={false}>
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: phaseColor }]}
              onPress={running ? stopTimer : startTimer}
            >
              <Ionicons name={running ? 'pause' : 'play'} size={30} color="#0D1B2A" />
            </TouchableOpacity>
          </View>

          {isBreak ? (
            <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: theme.card }]} onPress={skipBreak}>
              <Ionicons name="arrow-forward" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 48 }} />
          )}
        </View>
      </View>

      {/* ── Bottom stats + icon buttons ── */}
      <View style={[styles.bottomBar, { borderTopColor: theme.border }]}>
        <StatPill label="Done" value={completedSessions} color="#52B788" />
        <StatPill label="Sessions" value={sessionCount} color="#3DBDAA" />
        <StatPill label="Focus" value={`${Math.floor(totalFocusSec / 60)}m`} color="#2E86AB" />
        <View style={styles.bottomDivider} />
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: theme.card }]}
          onPress={() => setShowAnalytics(true)}
        >
          <Ionicons name="bar-chart-outline" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: theme.card }]}
          onPress={() => setShowHistory(true)}
        >
          <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ════ Sheets ════════════════════════════════════════ */}

      {/* Technique picker */}
      <Sheet visible={showTechnique} onClose={() => setShowTechnique(false)} title="Technique" theme={theme} isTablet={isTablet}>
        {(Object.keys(techniques) as Technique[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.techniqueRow, { borderBottomColor: theme.border, backgroundColor: technique === t ? '#3DBDAA18' : 'transparent' }]}
            onPress={() => changeTechnique(t)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.techniqueRowTitle, { color: theme.text }]}>{t}</Text>
              <Text style={[styles.techniqueRowDesc, { color: theme.textSecondary }]}>{TECHNIQUE_INFO[t]}</Text>
            </View>
            {technique === t && <Ionicons name="checkmark" size={20} color="#3DBDAA" />}
          </TouchableOpacity>
        ))}
      </Sheet>

      {/* Task picker */}
      <Sheet visible={showTaskPicker} onClose={() => setShowTaskPicker(false)} title="Select Task" theme={theme} isTablet={isTablet}>
        {pendingTasks.length === 0 ? (
          <View style={styles.emptySheet}>
            <Text style={{ fontSize: 32 }}>✅</Text>
            <Text style={[styles.emptySheetText, { color: theme.textSecondary }]}>No pending tasks</Text>
          </View>
        ) : (
          pendingTasks
            .slice()
            .sort((a, b) => {
              const O: Record<string, number> = { high: 3, medium: 2, low: 1, none: 0 };
              return (O[b.priority] ?? 0) - (O[a.priority] ?? 0);
            })
            .map((task, i, arr) => (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.taskRow,
                  { borderBottomColor: theme.border },
                  i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth },
                ]}
                onPress={() => { setSelectedTask(task); setTaskSessionSec(0); setShowTaskPicker(false); }}
              >
                <View style={[styles.taskDot, { backgroundColor: priorityColor(task.priority) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskRowText, { color: theme.text }]} numberOfLines={1}>{task.title}</Text>
                  {(task.estimatedHours > 0 || task.estimatedMinutes > 0) && (
                    <Text style={[styles.taskRowMeta, { color: theme.textSecondary }]}>
                      Est. {task.estimatedHours}h {task.estimatedMinutes}m
                    </Text>
                  )}
                </View>
                {selectedTask?.id === task.id && <Ionicons name="checkmark" size={18} color="#3DBDAA" />}
              </TouchableOpacity>
            ))
        )}
      </Sheet>

      {/* Analytics */}
      <Sheet visible={showAnalytics} onClose={() => setShowAnalytics(false)} title="Focus This Week" theme={theme} isTablet={isTablet}>
        <FocusBarChart data={dailyHours} color="#3DBDAA" isDark={isDark} />
      </Sheet>

      {/* History */}
      <Sheet visible={showHistory} onClose={() => setShowHistory(false)} title="Session History" theme={theme} isTablet={isTablet}>
        {history.length === 0 ? (
          <View style={styles.emptySheet}>
            <Text style={{ fontSize: 32 }}>🎯</Text>
            <Text style={[styles.emptySheetText, { color: theme.textSecondary }]}>No sessions yet</Text>
          </View>
        ) : (
          history.map((h, i) => (
            <View key={i} style={[styles.historyRow, { borderBottomColor: theme.border }, i < history.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={[styles.historyDot, { backgroundColor: phaseColor }]} />
              <Text style={[styles.historyLabel, { color: theme.text }]}>{h.label}</Text>
              <Text style={[styles.historyMeta, { color: theme.textSecondary }]}>
                {Math.floor(h.duration / 60)}m · {h.at}
              </Text>
            </View>
          ))
        )}
      </Sheet>

      {/* Settings */}
      <Sheet visible={showSettings} onClose={() => setShowSettings(false)} title="Timer Settings" theme={theme} scrollable isTablet={isTablet}>
        <SettingsSection title="Pomodoro" isDark={isDark}>
          <PrefRow label="Focus" value={prefs.pomodoroFocus} onMinus={() => adjustPref('pomodoroFocus', -5)} onPlus={() => adjustPref('pomodoroFocus', 5)} theme={theme} />
          <PrefRow label="Short Break" value={prefs.pomodoroShort} onMinus={() => adjustPref('pomodoroShort', -1)} onPlus={() => adjustPref('pomodoroShort', 1)} theme={theme} />
          <PrefRow label="Long Break" value={prefs.pomodoroLong} onMinus={() => adjustPref('pomodoroLong', -5)} onPlus={() => adjustPref('pomodoroLong', 5)} theme={theme} />
        </SettingsSection>
        <SettingsSection title="52/17 Rule" isDark={isDark}>
          <PrefRow label="Focus" value={prefs.rule52Focus} onMinus={() => adjustPref('rule52Focus', -1)} onPlus={() => adjustPref('rule52Focus', 1)} theme={theme} />
          <PrefRow label="Break" value={prefs.rule17Break} onMinus={() => adjustPref('rule17Break', -1)} onPlus={() => adjustPref('rule17Break', 1)} theme={theme} />
        </SettingsSection>
        <SettingsSection title="Flowtime" isDark={isDark}>
          <PrefRow label="Short Break" value={prefs.flowtimeShort} onMinus={() => adjustPref('flowtimeShort', -1)} onPlus={() => adjustPref('flowtimeShort', 1)} theme={theme} />
          <PrefRow label="Long Break" value={prefs.flowtimeLong} onMinus={() => adjustPref('flowtimeLong', -5)} onPlus={() => adjustPref('flowtimeLong', 5)} theme={theme} />
        </SettingsSection>
      </Sheet>

      </View>
    </SafeAreaView>
  );
}

// ── Reusable Sheet ─────────────────────────────────────────

function Sheet({ visible, onClose, title, theme, children, scrollable, isTablet }: {
  visible: boolean; onClose: () => void; title: string;
  theme: any; children: React.ReactNode; scrollable?: boolean; isTablet?: boolean;
}) {
  const cardStyle = modalCard(!!isTablet, theme.surface, { gap: 0 });
  const inner = (
    <View style={cardStyle}>
      {!isTablet && <View style={styles.sheetHandle} />}
      <View style={styles.sheetHeader}>
        <Text style={[styles.sheetTitle, { color: theme.text }]}>{title}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
      {scrollable
        ? <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        : children}
    </View>
  );
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={modalOverlay(!!isTablet)} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={isTablet ? {} : { width: '100%' }}>
          {inner}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Sub-components ─────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SettingsSection({ title, children, isDark }: { title: string; children: React.ReactNode; isDark: boolean }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={[styles.settingsSectionTitle, { color: isDark ? '#7AAFC8' : '#2E86AB' }]}>{title}</Text>
      <View style={[styles.settingsSectionCard, { backgroundColor: isDark ? '#1A2C3D' : '#F0F8FF' }]}>
        {children}
      </View>
    </View>
  );
}

function PrefRow({ label, value, onMinus, onPlus, theme }: {
  label: string; value: number; onMinus: () => void; onPlus: () => void; theme: any;
}) {
  return (
    <View style={[styles.prefRow, { borderBottomColor: theme.border }]}>
      <Text style={[styles.prefLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View style={styles.prefControls}>
        <TouchableOpacity style={[styles.prefBtn, { backgroundColor: theme.card }]} onPress={onMinus}>
          <Ionicons name="remove" size={16} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.prefValue, { color: theme.text }]}>{value} min</Text>
        <TouchableOpacity style={[styles.prefBtn, { backgroundColor: theme.card }]} onPress={onPlus}>
          <Ionicons name="add" size={16} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FocusBarChart({ data, color, isDark }: { data: { date: string; hours: number }[]; color: string; isDark: boolean }) {
  const W = 300; const H = 120;
  const PAD = { left: 30, bottom: 26, top: 10, right: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const maxH   = Math.max(...data.map((d) => d.hours), 0.5);
  const barW   = Math.floor(chartW / data.length) - 5;
  const tc     = isDark ? '#7AAFC8' : '#5A7E9B';
  const gc     = isDark ? '#1A3050' : '#E0ECF8';
  const day    = (d: string) => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][new Date(d + 'T12:00:00').getDay()];

  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <Svg width={W} height={H}>
        {[0, 0.5, 1].map((f) => {
          const y = PAD.top + chartH * (1 - f);
          return <Line key={f} x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke={gc} strokeWidth={1} />;
        })}
        <SvgText x={2} y={PAD.top + chartH / 2 + 4} fontSize={9} fill={tc}>{maxH.toFixed(1)}h</SvgText>
        {data.map((d, i) => {
          const bH = Math.max(2, (d.hours / maxH) * chartH);
          const x  = PAD.left + i * (chartW / data.length) + 2;
          return (
            <Rect key={d.date} x={x} y={PAD.top + chartH - bH} width={barW} height={bH} rx={3}
              fill={i === data.length - 1 ? color : color + '55'} />
          );
        })}
        {data.map((d, i) => (
          <SvgText key={d.date} x={PAD.left + i * (chartW / data.length) + barW / 2 + 2}
            y={H - 7} fontSize={9} fill={tc} textAnchor="middle">{day(d.date)}</SvgText>
        ))}
      </Svg>
      <Text style={{ fontSize: 11, color: tc }}>Today is highlighted</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { flex: 1 },

  // Top bar
  topBar:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  techniquePill:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  techniquePillText: { fontSize: 13, fontWeight: '700' },

  // Task pill
  taskPill:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginVertical: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  taskPillText: { flex: 1, fontSize: 14 },

  // Estimated time strip
  estStrip:      { marginHorizontal: 20, marginBottom: 4, gap: 3 },
  estStripBg:    { height: 3, borderRadius: 2, overflow: 'hidden' },
  estStripFill:  { height: 3, borderRadius: 2 },
  estStripLabel: { fontSize: 11 },

  // Timer area — centred, takes up remaining space
  timerArea:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingVertical: 8 },
  breakChip:       { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  breakChipText:   { fontSize: 14, fontWeight: '600' },
  timerCircleWrap: { padding: 20 },
  timerRing:       { width: 220, height: 220, borderRadius: 110, borderWidth: 10, justifyContent: 'center', alignItems: 'center' },
  timerInner:      { width: 182, height: 182, borderRadius: 91, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  timerText:       { fontSize: 52, fontWeight: '800', fontVariant: ['tabular-nums'] },
  timerSub:        { fontSize: 13, marginTop: 2 },
  progressBar:     { width: 220, height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill:    { height: 5, borderRadius: 3 },

  // Controls
  controls:    { flexDirection: 'row', alignItems: 'center', gap: 28 },
  playBtn:     { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  secondaryBtn:{ width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },

  // Bottom bar
  bottomBar:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  statPill:     { flex: 1, alignItems: 'center' },
  statValue:    { fontSize: 18, fontWeight: '800' },
  statLabel:    { fontSize: 10, color: '#888', marginTop: 1 },
  bottomDivider:{ width: 1, height: 28, backgroundColor: '#2A3F5633' },
  iconBtn:      { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  // Sheet
  sheetOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  sheetCard:    { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32, maxHeight: '75%' },
  sheetHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: '#2A3F5688', alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  sheetHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14 },
  sheetTitle:   { fontSize: 17, fontWeight: '700' },

  // Technique picker rows
  techniqueRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  techniqueRowTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  techniqueRowDesc:  { fontSize: 12, lineHeight: 16 },

  // Task picker rows
  taskRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 14 },
  taskDot:     { width: 8, height: 8, borderRadius: 4 },
  taskRowText: { fontSize: 15, fontWeight: '500' },
  taskRowMeta: { fontSize: 12, marginTop: 2 },

  // History rows
  historyRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 13 },
  historyDot:   { width: 7, height: 7, borderRadius: 4 },
  historyLabel: { flex: 1, fontSize: 14 },
  historyMeta:  { fontSize: 12 },

  // Empty state
  emptySheet:     { alignItems: 'center', paddingVertical: 36, gap: 10 },
  emptySheetText: { fontSize: 14 },

  // Settings
  settingsSectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, paddingHorizontal: 24, marginBottom: 6 },
  settingsSectionCard:  { marginHorizontal: 16, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 2, marginBottom: 8 },
  prefRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  prefLabel:    { fontSize: 14 },
  prefControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  prefBtn:      { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  prefValue:    { fontSize: 14, fontWeight: '700', minWidth: 56, textAlign: 'center' },
});
