import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../services/firebase';

const ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential':    'Invalid email or password.',
  'auth/user-not-found':        'No account found with this email.',
  'auth/wrong-password':        'Incorrect password.',
  'auth/too-many-requests':     'Too many attempts. Please try again later.',
  'auth/network-request-failed':'Network error. Check your connection.',
};

export default function SignInPage() {
  const { signIn } = useAuth();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [focused, setFocused]       = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password.trim());
    } catch (e: any) {
      Alert.alert('Sign In Failed', ERROR_MESSAGES[e.code] ?? 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert('Enter Email', 'Type your email address above, then tap Forgot Password.');
      return;
    }
    Alert.alert(
      'Reset Password',
      `Send a reset link to ${email.trim()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send', onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, email.trim());
              Alert.alert('Email Sent', 'Check your inbox for a password reset link.');
            } catch (e: any) {
              Alert.alert('Error', ERROR_MESSAGES[e.code] ?? 'Could not send reset email.');
            }
          },
        },
      ],
    );
  };

  const isFocused = (f: string) => focused === f;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>📚</Text>
          <Text style={styles.title}>StudyTide</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={[styles.inputWrapper, isFocused('email') && styles.inputFocused]}>
            <Ionicons name="mail-outline" size={20} color={isFocused('email') ? '#3DBDAA' : '#7AAFC8'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#456B84"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <View style={[styles.inputWrapper, isFocused('pw') && styles.inputFocused]}>
            <Ionicons name="lock-closed-outline" size={20} color={isFocused('pw') ? '#3DBDAA' : '#7AAFC8'} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor="#456B84"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onFocus={() => setFocused('pw')}
              onBlur={() => setFocused(null)}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#7AAFC8" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleSignIn} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#0D1B2A" />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up" style={styles.link}>Sign Up</Link>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0D1B2A' },
  scroll:       { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header:       { alignItems: 'center', marginBottom: 40 },
  logo:         { fontSize: 64, marginBottom: 16 },
  title:        { fontSize: 28, fontWeight: '700', color: '#3DBDAA', marginBottom: 8 },
  subtitle:     { fontSize: 16, color: '#7AAFC8', textAlign: 'center' },
  form:         { gap: 14 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#152234', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#2A3F56',
    paddingHorizontal: 14, height: 54,
  },
  inputFocused: { borderColor: '#3DBDAA' },
  inputIcon:    { marginRight: 10 },
  input:        { flex: 1, color: '#E8F4FD', fontSize: 16 },
  eyeBtn:       { padding: 4 },
  forgotRow:    { alignItems: 'flex-end', marginTop: -4 },
  forgotText:   { color: '#3DBDAA', fontSize: 14, fontWeight: '600' },
  btn: {
    backgroundColor: '#3DBDAA', borderRadius: 14,
    height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 4,
    shadowColor: '#3DBDAA', shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  btnText:      { color: '#0D1B2A', fontSize: 17, fontWeight: '700' },
  footer:       { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  footerText:   { color: '#7AAFC8', fontSize: 15 },
  link:         { color: '#3DBDAA', fontSize: 15, fontWeight: '600' },
});
