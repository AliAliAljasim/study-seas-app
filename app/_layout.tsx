import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { TutorialProvider, useTutorial } from '../context/TutorialContext';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const { initForUser } = useTutorial();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)/sign-in');
    } else if (user && inAuth) {
      router.replace('/(app)');
    }
  }, [user, loading, segments]);

  useEffect(() => {
    if (user?.uid) initForUser(user.uid);
  }, [user?.uid]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1B2A' }}>
        <ActivityIndicator color="#3DBDAA" size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <TutorialProvider>
          <RootLayoutNav />
        </TutorialProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
