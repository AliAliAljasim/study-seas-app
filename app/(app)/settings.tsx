import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getTheme } from '../../constants/colors';

type ThemeMode = 'light' | 'dark' | 'system';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { isDark, themeMode, setThemeMode } = useTheme();
  const theme = getTheme(isDark);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const THEME_OPTIONS: { label: string; value: ThemeMode; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Light', value: 'light', icon: 'sunny-outline' },
    { label: 'Dark', value: 'dark', icon: 'moon-outline' },
    { label: 'System', value: 'system', icon: 'phone-portrait-outline' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Account Section */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: '#FFD70033' }]}>
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: theme.text }]}>
                {user?.displayName ?? 'User'}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>
                {user?.email ?? ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Theme</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.themeBtn,
                  { borderColor: theme.border },
                  themeMode === opt.value && { backgroundColor: '#FFD700', borderColor: '#FFD700' },
                ]}
                onPress={() => setThemeMode(opt.value)}
              >
                <Ionicons
                  name={opt.icon}
                  size={20}
                  color={themeMode === opt.value ? '#1E1E1E' : theme.textSecondary}
                />
                <Text style={[
                  styles.themeBtnText,
                  { color: theme.textSecondary },
                  themeMode === opt.value && { color: '#1E1E1E', fontWeight: '700' },
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About Section */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: theme.card, gap: 0 }]}>
          <SettingRow
            icon="book-outline"
            label="App Name"
            value="Study App"
            theme={theme}
            noBorder
          />
          <SettingRow
            icon="code-slash-outline"
            label="Platform"
            value="React Native + Expo"
            theme={theme}
            noBorder
          />
          <SettingRow
            icon="server-outline"
            label="Backend"
            value="Firebase"
            theme={theme}
            noBorder
          />
          <SettingRow
            icon="star-outline"
            label="Version"
            value="1.0.0"
            theme={theme}
            isLast
          />
        </View>

        {/* Features Section */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>FEATURES</Text>
        <View style={[styles.card, { backgroundColor: theme.card, gap: 0 }]}>
          {[
            { icon: '⏱️', label: 'Focus Timer', desc: 'Pomodoro, Flowtime, 52/17' },
            { icon: '📅', label: 'Study Calendar', desc: 'Track events by category' },
            { icon: '✅', label: 'Tasks', desc: 'Lists, tasks, and subtasks' },
            { icon: '📊', label: 'Progress', desc: 'Grade & GPA calculators' },
          ].map((f, i, arr) => (
            <View
              key={f.label}
              style={[styles.featureRow, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}
            >
              <Text style={{ fontSize: 22 }}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureLabel, { color: theme.text }]}>{f.label}</Text>
                <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#F44336" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ icon, label, value, theme, noBorder, isLast }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  theme: ReturnType<typeof getTheme>;
  noBorder?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[
      styles.settingRow,
      !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
    ]}>
      <Ionicons name={icon} size={20} color={theme.textSecondary} />
      <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.settingValue, { color: theme.textSecondary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 8, paddingBottom: 40 },
  sectionHeader: {
    fontSize: 12, fontWeight: '700', letterSpacing: 1,
    marginTop: 16, marginBottom: 6, marginLeft: 4,
  },
  card: { borderRadius: 14, padding: 16, gap: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#FFD700' },
  profileName: { fontSize: 17, fontWeight: '700' },
  profileEmail: { fontSize: 13, marginTop: 2 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, gap: 6,
  },
  themeBtnText: { fontSize: 13 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
  },
  settingLabel: { flex: 1, fontSize: 15 },
  settingValue: { fontSize: 14 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
  },
  featureLabel: { fontSize: 14, fontWeight: '600' },
  featureDesc: { fontSize: 12, marginTop: 1 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: 16, padding: 16,
    borderRadius: 14, backgroundColor: '#F4433622',
    borderWidth: 1, borderColor: '#F4433644',
  },
  signOutText: { color: '#F44336', fontSize: 16, fontWeight: '700' },
});
