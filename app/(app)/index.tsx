import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getTheme } from '../../constants/colors';

interface Feature {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  route: string;
}

const FEATURES: Feature[] = [
  { title: 'Focus Timer', subtitle: 'Stay present and focused', icon: 'timer-outline', color: '#5B8DEF', bg: '#EBF1FD', route: '/timer' },
  { title: 'Aquarium', subtitle: 'Hatch fish from study sessions', icon: 'water-outline', color: '#26C6DA', bg: '#E0F7FA', route: '/aquarium' },
  { title: 'Calendar', subtitle: 'Plan your study sessions', icon: 'calendar-outline', color: '#4BAE82', bg: '#E8F6F0', route: '/calendar' },
  { title: 'Tasks', subtitle: 'Organize what needs doing', icon: 'checkmark-done-outline', color: '#7B6CF6', bg: '#EDEAFD', route: '/todo' },
  { title: 'Progress', subtitle: 'Track your grades and GPA', icon: 'bar-chart-outline', color: '#E87040', bg: '#FDF0EA', route: '/grades' },
];

const DARK_BG: Record<string, string> = {
  '#EBF1FD': '#1E2D4A',
  '#E0F7FA': '#0D2A2E',
  '#E8F6F0': '#1A3028',
  '#EDEAFD': '#28224A',
  '#FDF0EA': '#4A2E1E',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function HomePage() {
  const { user, signOut } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const theme = getTheme(isDark);
  const firstName = user?.displayName?.split(' ')[0] ?? 'there';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>{getGreeting()}</Text>
            <Text style={[styles.name, { color: theme.text }]}>{firstName}</Text>
            <Text style={[styles.date, { color: theme.textSecondary }]}>{getDate()}</Text>
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={20} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Quote pill ── */}
        <View style={[styles.pill, { backgroundColor: theme.surface }]}>
          <Ionicons name="leaf-outline" size={15} color={theme.textSecondary} />
          <Text style={[styles.pillText, { color: theme.textSecondary }]}>
            Small steps, every day.
          </Text>
        </View>

        {/* ── Section label ── */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>YOUR TOOLS</Text>

        {/* ── Feature cards ── */}
        {FEATURES.map((f) => (
          <FeatureRow key={f.route} feature={f} isDark={isDark} theme={theme} onPress={() => router.push(f.route as any)} />
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureRow({
  feature, isDark, theme, onPress,
}: {
  feature: Feature;
  isDark: boolean;
  theme: ReturnType<typeof getTheme>;
  onPress: () => void;
}) {
  const iconBg = isDark ? DARK_BG[feature.bg] ?? '#2A2A2A' : feature.bg;
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: theme.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={feature.icon} size={26} color={feature.color} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: theme.text }]}>{feature.title}</Text>
        <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>{feature.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },

  // Hero
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingBottom: 8,
  },
  heroText: { gap: 2 },
  greeting: { fontSize: 14, fontWeight: '500' },
  name: { fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  date: { fontSize: 13, marginTop: 2 },
  heroActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },

  // Quote pill
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: { fontSize: 13 },

  // Section label
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginTop: 8 },

  // Feature rows
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 16, borderRadius: 18,
  },
  iconBox: {
    width: 52, height: 52, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSubtitle: { fontSize: 13 },
});
