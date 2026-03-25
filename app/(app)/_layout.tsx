import { Stack, Redirect } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import TutorialOverlay from '../../components/TutorialOverlay';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();

  if (!loading && !user) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  const bg = isDark ? '#0D1B2A' : '#EEF5FB';
  const text = isDark ? '#E8F4FD' : '#142030';

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: isDark ? '#152234' : '#FFFFFF' },
          headerTintColor: text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Study App', headerShown: false }} />
        <Stack.Screen name="timer" options={{ title: 'Focus Timer' }} />
        <Stack.Screen name="aquarium" options={{ title: 'Aquarium' }} />
        <Stack.Screen name="calendar" options={{ title: 'Study Calendar' }} />
        <Stack.Screen name="todo" options={{ title: 'Tasks' }} />
        <Stack.Screen name="grades" options={{ title: 'Progress Vault' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
      <TutorialOverlay />
    </>
  );
}
