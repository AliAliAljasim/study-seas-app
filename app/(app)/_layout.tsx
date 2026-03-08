import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function AppLayout() {
  const { isDark } = useTheme();
  const bg = isDark ? '#1E1E1E' : '#F2F2F7';
  const text = isDark ? '#FFFFFF' : '#000000';

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: isDark ? '#2D2D2D' : '#FFFFFF' },
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
  );
}
