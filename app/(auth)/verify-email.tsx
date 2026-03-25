import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmailPage() {
  const { user, signOut, sendVerification, reloadUser } = useAuth();
  const [checking, setChecking]   = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown]   = useState(0);
  const didAutoSend = useRef(false);

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  // Auto-send on first mount in case the sign-up send failed
  useEffect(() => {
    if (didAutoSend.current) return;
    didAutoSend.current = true;
    sendVerification()
      .then(() => setCooldown(60))
      .catch((e) => {
        // too-many-requests means an email was already sent recently — don't block resend
        if (e?.code !== 'auth/too-many-requests') {
          console.error('[VerifyEmail] auto-send failed:', e);
        }
      });
  }, []);

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    setResending(true);
    try {
      await sendVerification();
      setCooldown(60);
      Alert.alert('Email Sent', 'A new verification link has been sent to your inbox.');
    } catch (e: any) {
      Alert.alert('Error', 'Could not send email. Please try again shortly.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerified = async () => {
    setChecking(true);
    try {
      const verified = await reloadUser();
      if (!verified) {
        Alert.alert('Not Yet', 'Your email hasn\'t been verified yet. Check your inbox and spam folder.');
      }
      // If verified, _layout.tsx will automatically redirect to (app)
    } catch {
      Alert.alert('Error', 'Could not check verification status.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.icon, { transform: [{ scale: pulse }] }]}>
        📬
      </Animated.Text>

      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.subtitle}>
        We sent a verification link to
      </Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.hint}>
        Open the link in your email, then come back and tap the button below.{'\n'}Can't find it? Check your spam folder.
      </Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleCheckVerified} disabled={checking}>
        {checking ? (
          <ActivityIndicator color="#0D1B2A" />
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={20} color="#0D1B2A" />
            <Text style={styles.primaryBtnText}>I've verified my email</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryBtn, (resending || cooldown > 0) && styles.secondaryBtnDisabled]}
        onPress={handleResend}
        disabled={resending || cooldown > 0}
      >
        {resending ? (
          <ActivityIndicator color="#3DBDAA" size="small" />
        ) : (
          <Text style={styles.secondaryBtnText}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
        <Ionicons name="log-out-outline" size={16} color="#456B84" />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0D1B2A', justifyContent: 'center', alignItems: 'center', padding: 32 },
  icon:        { fontSize: 72, marginBottom: 24 },
  title:       { fontSize: 26, fontWeight: '800', color: '#E8F4FD', marginBottom: 12, textAlign: 'center' },
  subtitle:    { fontSize: 15, color: '#7AAFC8', textAlign: 'center' },
  email:       { fontSize: 15, color: '#3DBDAA', fontWeight: '700', marginTop: 4, marginBottom: 16, textAlign: 'center' },
  hint:        { fontSize: 14, color: '#456B84', textAlign: 'center', lineHeight: 20, marginBottom: 36 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#3DBDAA', borderRadius: 14,
    height: 54, paddingHorizontal: 28, justifyContent: 'center',
    width: '100%', marginBottom: 14,
    shadowColor: '#3DBDAA', shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  primaryBtnText:       { color: '#0D1B2A', fontSize: 16, fontWeight: '700' },
  secondaryBtn:         { borderWidth: 1.5, borderColor: '#3DBDAA', borderRadius: 14, height: 50, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: 32 },
  secondaryBtnDisabled: { borderColor: '#2A3F56' },
  secondaryBtnText:     { color: '#3DBDAA', fontSize: 15, fontWeight: '600' },
  signOutBtn:           { flexDirection: 'row', alignItems: 'center', gap: 6 },
  signOutText:          { color: '#456B84', fontSize: 14 },
});
