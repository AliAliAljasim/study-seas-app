import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getTheme } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { awardEgg } from '../../services/aquariumService';

type Technique = 'Flowtime' | 'Pomodoro' | '52/17 Rule';

const TECHNIQUES: Record<Technique, { focus: number; shortBreak: number; longBreak: number; longBreakAfter: number }> = {
  Flowtime:     { focus: 1500, shortBreak: 300,  longBreak: 600,  longBreakAfter: 4 },
  Pomodoro:     { focus: 1500, shortBreak: 300,  longBreak: 900,  longBreakAfter: 4 },
  '52/17 Rule': { focus: 3120, shortBreak: 1020, longBreak: 1020, longBreakAfter: 3 },
};

const TECHNIQUE_INFO: Record<Technique, string> = {
  Flowtime: 'Work until you naturally lose focus, then take a short break.',
  Pomodoro: '25 min focus + 5 min break. After 4 sessions take a 15 min break.',
  '52/17 Rule': '52 min deep work + 17 min genuine rest.',
};

type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';

export default function TimerPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  const [technique, setTechnique] = useState<Technique>('Pomodoro');
  const [phase, setPhase] = useState<TimerPhase>('focus');
  const [seconds, setSeconds] = useState(TECHNIQUES['Pomodoro'].focus);
  const [running, setRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalFocusSeconds, setTotalFocusSeconds] = useState(0);
  const [history, setHistory] = useState<{ label: string; duration: number; at: string }[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusStartRef = useRef<number>(0);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const resetToPhase = (t: Technique, p: TimerPhase) => {
    const cfg = TECHNIQUES[t];
    setSeconds(p === 'focus' ? cfg.focus : p === 'shortBreak' ? cfg.shortBreak : cfg.longBreak);
  };

  const handleTechniqueChange = (t: Technique) => {
    stopTimer();
    setTechnique(t);
    setPhase('focus');
    setSeconds(TECHNIQUES[t].focus);
    setSessionCount(0);
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
          handlePhaseComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  };

  const resetTimer = () => {
    stopTimer();
    setPhase('focus');
    setSeconds(TECHNIQUES[technique].focus);
  };

  const handlePhaseComplete = () => {
    const cfg = TECHNIQUES[technique];
    if (phase === 'focus') {
      const elapsed = Math.round((Date.now() - focusStartRef.current) / 1000);
      setTotalFocusSeconds((t) => t + elapsed);
      setCompletedSessions((c) => c + 1);
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      setHistory((h) => [{
        label: `${technique} Focus`,
        duration: elapsed,
        at: new Date().toLocaleTimeString(),
      }, ...h.slice(0, 9)]);

      const isLongBreak = newCount % cfg.longBreakAfter === 0;
      setPhase(isLongBreak ? 'longBreak' : 'shortBreak');
      setSeconds(isLongBreak ? cfg.longBreak : cfg.shortBreak);
      if (user?.uid) awardEgg(user.uid);
      Alert.alert(
        'Focus Session Complete!',
        `Great work! Time for a ${isLongBreak ? 'long' : 'short'} break.\n\n🥚 A fish egg has been added to your Aquarium!`,
        [{ text: 'OK' }],
      );
    } else {
      setPhase('focus');
      setSeconds(cfg.focus);
      Alert.alert('Break Over!', 'Ready for your next focus session?', [{ text: "Let's go!" }]);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const totalSeconds = TECHNIQUES[technique][phase === 'focus' ? 'focus' : phase === 'shortBreak' ? 'shortBreak' : 'longBreak'];
  const progress = 1 - seconds / totalSeconds;

  const phaseColor = phase === 'focus' ? '#3DBDAA' : phase === 'shortBreak' ? '#52B788' : '#2E86AB';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Technique Selector */}
        <View style={styles.techniqueRow}>
          {(Object.keys(TECHNIQUES) as Technique[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.techniqueBtn, technique === t && { backgroundColor: '#3DBDAA' }]}
              onPress={() => handleTechniqueChange(t)}
            >
              <Text style={[styles.techniqueBtnText, technique === t && { color: '#0D1B2A' }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info */}
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>{TECHNIQUE_INFO[technique]}</Text>

        {/* Phase Label */}
        <View style={[styles.phaseLabel, { backgroundColor: phaseColor + '22' }]}>
          <Text style={[styles.phaseLabelText, { color: phaseColor }]}>
            {phase === 'focus' ? '🔥 Focus Time' : phase === 'shortBreak' ? '☕ Short Break' : '🛋️ Long Break'}
          </Text>
        </View>

        {/* Timer Circle */}
        <View style={styles.timerContainer}>
          <View style={[styles.timerRing, { borderColor: phaseColor + '33' }]}>
            <View style={[styles.timerInner, { borderColor: phaseColor }]}>
              <Text style={[styles.timerText, { color: phaseColor }]}>{formatTime(seconds)}</Text>
              <Text style={[styles.timerSubtext, { color: theme.textSecondary }]}>
                {running ? 'Focus' : 'Paused'}
              </Text>
            </View>
          </View>
          {/* Progress arc placeholder */}
          <View style={[styles.progressBar, { backgroundColor: theme.card }]}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: phaseColor }]} />
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={resetTimer}>
            <Ionicons name="refresh" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: phaseColor }]}
            onPress={running ? stopTimer : startTimer}
          >
            <Ionicons name={running ? 'pause' : 'play'} size={32} color="#0D1B2A" />
          </TouchableOpacity>
        </View>

        {/* Dev: 3-second test timer */}
        <TouchableOpacity
          style={[styles.testTimerBtn, { borderColor: theme.textSecondary + '44' }]}
          onPress={() => { stopTimer(); setPhase('focus'); setSeconds(3); }}
        >
          <Ionicons name="timer-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.testTimerText, { color: theme.textSecondary }]}>3s Test Timer</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
          <StatItem label="Completed" value={completedSessions} color="#52B788" />
          <StatItem label="Session Count" value={sessionCount} color="#3DBDAA" />
          <StatItem label="Total Focus" value={`${Math.floor(totalFocusSeconds / 60)}m`} color="#2E86AB" />
        </View>

        {/* Session History */}
        {history.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Session History</Text>
            {history.map((h, i) => (
              <View key={i} style={[styles.historyItem, { backgroundColor: theme.card }]}>
                <View style={styles.historyDot} />
                <Text style={[styles.historyLabel, { color: theme.text }]}>{h.label}</Text>
                <Text style={[styles.historyMeta, { color: theme.textSecondary }]}>
                  {Math.floor(h.duration / 60)}m · {h.at}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

function StatItem({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  techniqueRow: { flexDirection: 'row', gap: 8 },
  techniqueBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    alignItems: 'center', backgroundColor: '#2A3F5644',
  },
  techniqueBtnText: { fontSize: 12, fontWeight: '600', color: '#888' },
  infoText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  phaseLabel: { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  phaseLabelText: { fontSize: 15, fontWeight: '700' },
  timerContainer: { alignItems: 'center', gap: 16 },
  timerRing: { width: 220, height: 220, borderRadius: 110, borderWidth: 12, justifyContent: 'center', alignItems: 'center' },
  timerInner: { width: 180, height: 180, borderRadius: 90, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  timerText: { fontSize: 52, fontWeight: '800', fontVariant: ['tabular-nums'] },
  timerSubtext: { fontSize: 14, marginTop: 4 },
  progressBar: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24 },
  primaryBtn: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  secondaryBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#2A3F5644', justifyContent: 'center', alignItems: 'center' },
  statsCard: { flexDirection: 'row', borderRadius: 14, padding: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10 },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3DBDAA' },
  historyLabel: { flex: 1, fontSize: 14 },
  historyMeta: { fontSize: 12 },
  testTimerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  testTimerText: { fontSize: 12, fontWeight: '600' },
});
