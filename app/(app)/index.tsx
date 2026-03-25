import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Easing, Alert, Modal, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient as SvgGrad, Stop, Rect, Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTutorial } from '../../context/TutorialContext';
import { getTheme } from '../../constants/colors';
import { checkDailyLoginEgg, getEggs, getOwnedFish } from '../../services/aquariumService';
import { getAllTasks } from '../../services/taskService';
import { computeUnlockedBiomes } from '../../models/aquariumModels';
import { Task, priorityColor } from '../../models/taskModels';
import { getWeeklyStats, WeeklyStats } from '../../services/studyStatsService';

// ─── Data ─────────────────────────────────────────────

const QUOTES = [
  'The ocean is calling — dive deep.',
  'Every great journey begins with a single stroke.',
  'Still waters run deep. So do you.',
  'Even the smallest fish makes ripples.',
  'Patience grows pearls.',
  'Explore the depths. Discover yourself.',
  'Tides rise, and so will you.',
];

interface Feature {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

const FEATURES: Feature[] = [
  { title: 'Focus Timer',  subtitle: 'Earn eggs through deep work',  icon: 'timer-outline',         color: '#2E86AB', route: '/timer' },
  { title: 'Calendar',    subtitle: 'Plan and schedule sessions',    icon: 'calendar-outline',       color: '#52B788', route: '/calendar' },
  { title: 'Tasks',       subtitle: 'Track what needs doing',        icon: 'checkmark-done-outline', color: '#9381FF', route: '/todo' },
  { title: 'Progress',    subtitle: 'GPA and grade tracking',        icon: 'bar-chart-outline',      color: '#F4845F', route: '/grades' },
];

// ─── Helpers ──────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'Night owl 🦉';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Burning the midnight oil';
}

function getDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getTodayQuote() {
  const day = Math.floor(Date.now() / 86_400_000);
  return QUOTES[day % QUOTES.length];
}

// ─── Spotlight ocean background ───────────────────────

function SpotlightBg({ width, height, isDark }: { width: number; height: number; isDark: boolean }) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <SvgGrad id="sg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0"   stopColor={isDark ? '#0A1F36' : '#0C5F80'} stopOpacity="1" />
          <Stop offset="0.6" stopColor={isDark ? '#0E3050' : '#1A8FAA'} stopOpacity="1" />
          <Stop offset="1"   stopColor={isDark ? '#0D4A6A' : '#3DBDAA'} stopOpacity="1" />
        </SvgGrad>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#sg)" />
      {/* Bubbles */}
      <Circle cx={width * 0.08} cy={height * 0.30} r={3}  fill="white" opacity="0.13" />
      <Circle cx={width * 0.20} cy={height * 0.65} r={5}  fill="white" opacity="0.08" />
      <Circle cx={width * 0.78} cy={height * 0.22} r={7}  fill="white" opacity="0.07" />
      <Circle cx={width * 0.90} cy={height * 0.55} r={4}  fill="white" opacity="0.10" />
      <Circle cx={width * 0.55} cy={height * 0.18} r={2}  fill="white" opacity="0.16" />
      {/* Light ray */}
      <Path d={`M ${width * 0.72},0 L ${width * 0.44},${height} L ${width * 0.36},${height} Z`} fill="white" opacity="0.05" />
      {/* Wave */}
      <Path
        d={`M0,${height * 0.72} Q${width*0.25},${height*0.58} ${width*0.5},${height*0.72} Q${width*0.75},${height*0.86} ${width},${height*0.70} L${width},${height} L0,${height} Z`}
        fill="white" opacity={isDark ? '0.05' : '0.11'}
      />
    </Svg>
  );
}

// ─── Floating fish ────────────────────────────────────

function FloatingFish({ emoji, delay, x, y }: { emoji: string; delay: number; x: number; y: number }) {
  const ty = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(op, { toValue: 1, duration: 700, delay: delay * 180, useNativeDriver: true }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(ty, { toValue: -7, duration: 2000 + delay * 250, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(ty, { toValue:  0, duration: 2000 + delay * 250, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ])).start();
  }, []);

  return (
    <Animated.Text style={[s.fish, { left: x, top: y, opacity: op, transform: [{ translateY: ty }] }]}>
      {emoji}
    </Animated.Text>
  );
}

// ─── Stat pill ────────────────────────────────────────

function StatPill({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <View style={s.pill}>
      <Text style={s.pillIcon}>{icon}</Text>
      <Text style={s.pillVal}>{value}</Text>
      <Text style={s.pillLabel}>{label}</Text>
    </View>
  );
}

// ─── Feature row item ─────────────────────────────────

function FeatureRow({ feature, isDark, onPress, last }: {
  feature: Feature; isDark: boolean; onPress: () => void; last?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 50 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[s.featureRow, !last && { borderBottomWidth: 1, borderBottomColor: isDark ? '#1E3A5470' : '#E8F4FD' }]}
        onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}
      >
        <View style={[s.featureIcon, { backgroundColor: feature.color + '20' }]}>
          <Ionicons name={feature.icon} size={20} color={feature.color} />
        </View>
        <View style={s.featureText}>
          <Text style={[s.featureTitle, { color: isDark ? '#E8F4FD' : '#0D1B2A' }]}>{feature.title}</Text>
          <Text style={[s.featureSub, { color: isDark ? '#4D7A96' : '#7AAFC8' }]}>{feature.subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={isDark ? '#2A4A64' : '#B8D8E8'} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Weekly stat tile ─────────────────────────────────

function WeeklyStat({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View style={s.wItem}>
      <Text style={s.wIcon}>{icon}</Text>
      <Text style={[s.wValue, { color }]}>{value}</Text>
      <Text style={s.wLabel}>{label}</Text>
    </View>
  );
}

// ─── Main page ────────────────────────────────────────

export default function HomePage() {
  const { user, signOut } = useAuth();
  const { isDark } = useTheme();
  const router    = useRouter();
  const theme     = getTheme(isDark);
  const { width } = useWindowDimensions();
  const firstName = user?.displayName?.split(' ')[0] ?? 'Explorer';
  const uid       = user?.uid ?? '';
  const quote     = getTodayQuote();

  const { step, setSpotlight, advance } = useTutorial();
  const heroRef     = useRef<View>(null);
  const featuresRef = useRef<View>(null);

  useEffect(() => {
    if (step === 'dashboard_hero') {
      setTimeout(() => {
        heroRef.current?.measureInWindow((x, y, w, h) => {
          if (w > 0) setSpotlight({ x, y, w, h });
        });
      }, 500);
    } else if (step === 'dashboard_features') {
      setTimeout(() => {
        featuresRef.current?.measureInWindow((x, y, w, h) => {
          if (w > 0) setSpotlight({ x, y, w, h });
        });
      }, 500);
    } else {
      setSpotlight(null);
    }
  }, [step]);

  const [fishCount,        setFishCount]        = useState(0);
  const [eggCount,         setEggCount]         = useState(0);
  const [pendingTasks,     setPendingTasks]      = useState(0);
  const [biomesCount,      setBiomesCount]       = useState(1);
  const [showDailyEggModal, setShowDailyEggModal] = useState(false);
  const [priorityTasks,    setPriorityTasks]     = useState<Task[]>([]);
  const [weeklyStats,      setWeeklyStats]       = useState<WeeklyStats | null>(null);

  const load = useCallback(async () => {
    if (!uid) return;
    const [ownedFish, eggs, tasks] = await Promise.all([
      getOwnedFish(uid), getEggs(uid), getAllTasks(uid),
    ]);
    setFishCount(new Set(ownedFish.map((f) => f.speciesId)).size);
    setEggCount(eggs.length);
    const pending = tasks.filter((t) => !t.completed);
    setPendingTasks(pending.length);
    setBiomesCount(computeUnlockedBiomes(ownedFish).size);
    const ORDER: Record<string, number> = { high: 3, medium: 2, low: 1, none: 0 };
    setPriorityTasks(
      pending
        .filter((t) => t.priority !== 'none')
        .sort((a, b) => (ORDER[b.priority] ?? 0) - (ORDER[a.priority] ?? 0))
        .slice(0, 3),
    );
    getWeeklyStats(uid).then(setWeeklyStats);
  }, [uid]);

  useEffect(() => {
    if (!uid || step !== 'done') return;
    checkDailyLoginEgg(uid).then((egg) => {
      if (egg) setShowDailyEggModal(true);
    });
    load();
  }, [uid, step, load]);

  // Re-fetch GPA whenever dashboard comes back into focus (e.g. after editing grades)
  useFocusEffect(useCallback(() => {
    if (uid) getWeeklyStats(uid).then(setWeeklyStats);
  }, [uid]));

  const handleSignOut = () =>
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);

  const spotH = 160;
  const FLOATS = [
    { emoji: '🐟', x: (width - 48) * 0.50, y: 14 },
    { emoji: '🐠', x: (width - 48) * 0.62, y: 36 },
    { emoji: '🦦', x: (width - 48) * 0.74, y: 18 },
    { emoji: '🐡', x: (width - 48) * 0.82, y: 44 },
  ];

  return (
    <SafeAreaView style={[s.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Top bar ── */}
        <View style={s.topBar}>
          <View>
            <Text style={[s.greeting, { color: isDark ? '#4D7A96' : '#7AAFC8' }]}>{getGreeting()}</Text>
            <Text style={[s.name, { color: isDark ? '#E8F4FD' : '#0D1B2A' }]}>{firstName}</Text>
          </View>
          <View style={s.topActions}>
            <TouchableOpacity style={[s.topBtn, { backgroundColor: isDark ? '#152234' : '#EAF4FB' }]} onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={18} color={isDark ? '#7AAFC8' : '#2E86AB'} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.topBtn, { backgroundColor: isDark ? '#152234' : '#EAF4FB' }]} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={18} color={isDark ? '#7AAFC8' : '#2E86AB'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Date + quote ── */}
        <Text style={[s.dateRow, { color: isDark ? '#2A4A64' : '#9BBFD4' }]}>
          {getDate()}  ·  {quote}
        </Text>

        {/* ── Spotlight card ── */}
        <View ref={heroRef} collapsable={false}>
          <TouchableOpacity
            style={[s.spotlight, { height: spotH }]}
            onPress={() => {
              if (step === 'dashboard_hero') advance();
              router.push('/aquarium');
            }}
            activeOpacity={0.9}
          >
            <SpotlightBg width={width - 40} height={spotH} isDark={isDark} />

            {/* Floating fish */}
            {FLOATS.map((f, i) => (
              <FloatingFish key={i} emoji={f.emoji} delay={i} x={f.x} y={f.y} />
            ))}

            {/* Text overlay */}
            <View style={s.spotContent}>
              <Text style={s.spotLabel}>MY AQUARIUM</Text>
              <Text style={s.spotTitle}>Your ocean awaits 🌊</Text>
              <View style={s.spotCta}>
                <Text style={s.spotCtaText}>Explore →</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Stats row ── */}
        <View style={s.pillRow}>
          <StatPill icon="🐟" value={fishCount}    label="fish" />
          <StatPill icon="🥚" value={eggCount}     label="eggs" />
          <StatPill icon="🗺"  value={biomesCount}  label="biomes" />
          <StatPill icon="✅" value={pendingTasks}  label="tasks" />
        </View>

        {/* ── Weekly summary ── */}
        {weeklyStats && (
          <View style={[s.weeklyCard, { backgroundColor: isDark ? '#0F1E30' : '#FFFFFF', borderColor: isDark ? '#1E3A54' : '#E0EEF8' }]}>
            <Text style={[s.sectionLabel, { color: isDark ? '#2A4A64' : '#9BBFD4' }]}>THIS WEEK</Text>
            <View style={s.weeklyGrid}>
              <WeeklyStat icon="⏱" value={`${weeklyStats.hours}h`}  label="studied"    color="#2E86AB" />
              <WeeklyStat icon="✅" value={String(weeklyStats.tasksCompleted)} label="tasks done" color="#52B788" />
              <WeeklyStat icon="🔥" value={`${weeklyStats.streak}`} label="streak"     color="#F4845F" />
              {weeklyStats.cgpa !== null
                ? <WeeklyStat icon="📊" value={weeklyStats.cgpa.toFixed(2)} label="GPA" color="#9381FF" />
                : <WeeklyStat icon="📚" value="—"   label="GPA"        color="#9381FF" />}
            </View>
          </View>
        )}

        {/* ── Feature list ── */}
        <View ref={featuresRef} collapsable={false} style={[s.featureCard, { backgroundColor: isDark ? '#0F1E30' : '#FFFFFF', borderColor: isDark ? '#1E3A54' : '#E0EEF8' }]}>
          <Text style={[s.sectionLabel, { color: isDark ? '#2A4A64' : '#9BBFD4' }]}>YOUR SPACE</Text>
          {FEATURES.map((f, i) => (
            <FeatureRow
              key={f.route}
              feature={f}
              isDark={isDark}
              onPress={() => router.push(f.route as any)}
              last={i === FEATURES.length - 1}
            />
          ))}
        </View>

        {/* ── Priority Tasks ── */}
        {priorityTasks.length > 0 && (
          <View style={[s.priorityCard, { backgroundColor: isDark ? '#0F1E30' : '#FFFFFF', borderColor: isDark ? '#1E3A54' : '#E0EEF8' }]}>
            <Text style={[s.sectionLabel, { color: isDark ? '#2A4A64' : '#9BBFD4' }]}>PRIORITY TASKS</Text>
            {priorityTasks.map((task, i) => {
              const pc = priorityColor(task.priority);
              return (
                <TouchableOpacity
                  key={task.id}
                  style={[s.priorityRow, i < priorityTasks.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#1E3A5470' : '#E8F4FD' }]}
                  onPress={() => router.push('/todo' as any)}
                >
                  <View style={[s.priorityDot, { backgroundColor: pc }]} />
                  <Text style={[s.priorityTitle, { color: isDark ? '#E8F4FD' : '#0D1B2A' }]} numberOfLines={1}>{task.title}</Text>
                  <View style={[s.priorityBadge, { backgroundColor: pc + '22' }]}>
                    <Text style={[s.priorityBadgeText, { color: pc }]}>{task.priority}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* ── Daily login egg modal ── */}
      <Modal
        visible={showDailyEggModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDailyEggModal(false)}
      >
        <TouchableOpacity
          style={s.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowDailyEggModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[s.modalCard, { backgroundColor: isDark ? '#0F1E30' : '#FFFFFF' }]}>
              {/* Egg glow */}
              <View style={s.eggGlow}>
                <Text style={s.eggEmoji}>🥚</Text>
              </View>
              <Text style={[s.modalTitle, { color: isDark ? '#E8F4FD' : '#0D1B2A' }]}>
                Daily Egg!
              </Text>
              <Text style={[s.modalBody, { color: isDark ? '#4D7A96' : '#7AAFC8' }]}>
                Welcome back! You've earned a free egg for logging in today. It'll be ready to hatch at midnight — come back then!
              </Text>
              <TouchableOpacity
                style={s.modalBtn}
                onPress={() => {
                  setShowDailyEggModal(false);
                  router.push('/aquarium');
                }}
              >
                <Text style={s.modalBtnText}>Go to Aquarium 🌊</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDailyEggModal(false)} style={{ marginTop: 10 }}>
                <Text style={{ color: isDark ? '#2A4A64' : '#9BBFD4', fontSize: 13 }}>Maybe later</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 14, paddingTop: 12 },

  // Top bar
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  name:     { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginTop: 1 },
  topActions: { flexDirection: 'row', gap: 8 },
  topBtn: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  // Date / quote
  dateRow: { fontSize: 12, fontWeight: '500', lineHeight: 17 },

  // Spotlight
  spotlight: {
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fish: { position: 'absolute', fontSize: 24 },
  spotContent: { padding: 18, gap: 4 },
  spotLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  spotTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  spotCta: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
    marginTop: 2,
  },
  spotCtaText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  // Stats pills
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1, alignItems: 'center', paddingVertical: 8, gap: 1,
    backgroundColor: 'transparent',
  },
  pillIcon:  { fontSize: 16 },
  pillVal:   { fontSize: 15, fontWeight: '800', color: '#3DBDAA' },
  pillLabel: { fontSize: 10, color: '#4D7A96', fontWeight: '600' },

  // Feature list card
  featureCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 4,
  },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.3, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 13 },
  featureIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '700' },
  featureSub:   { fontSize: 11, fontWeight: '500', marginTop: 1 },

  // Daily egg modal
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  modalCard: {
    borderRadius: 28, padding: 28, alignItems: 'center', gap: 10,
    width: '100%', maxWidth: 340,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  eggGlow: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#3DBDAA22',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  eggEmoji:    { fontSize: 52 },
  modalTitle:  { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  modalBody:   { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  modalBtn: {
    marginTop: 6, backgroundColor: '#2E86AB',
    borderRadius: 16, paddingHorizontal: 28, paddingVertical: 13, width: '100%', alignItems: 'center',
  },
  modalBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Weekly summary card
  weeklyCard: {
    borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, paddingBottom: 14,
  },
  weeklyGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  wItem:  { alignItems: 'center', flex: 1, paddingTop: 4, gap: 2 },
  wIcon:  { fontSize: 18 },
  wValue: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  wLabel: { fontSize: 9, color: '#4D7A96', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  // Priority tasks card
  priorityCard: {
    borderRadius: 18, borderWidth: 1, overflow: 'hidden', paddingHorizontal: 4,
  },
  priorityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 11,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityTitle: { flex: 1, fontSize: 13, fontWeight: '600' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  priorityBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
});
