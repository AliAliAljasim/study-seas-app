import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function SignUpPage() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUp(name.trim(), email.trim(), password.trim());
    } catch (e: any) {
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'An account with this email already exists.',
      };
      Alert.alert('Sign Up Failed', messages[e.code] ?? 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>📚</Text>
          <Text style={styles.title}>Begin Your Journey</Text>
          <Text style={styles.subtitle}>Create your Study App account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#7AAFC8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#456B84"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#7AAFC8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#456B84"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#7AAFC8" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor="#456B84"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#7AAFC8" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#7AAFC8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#456B84"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleSignUp} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#0D1B2A" />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" style={styles.link}>
              Sign In
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B2A' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#3DBDAA', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#7AAFC8', textAlign: 'center' },
  form: { gap: 16 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#152234',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3F56',
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#E8F4FD', fontSize: 16 },
  eyeBtn: { padding: 4 },
  btn: {
    backgroundColor: '#3DBDAA',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#0D1B2A', fontSize: 17, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { color: '#7AAFC8', fontSize: 15 },
  link: { color: '#3DBDAA', fontSize: 15, fontWeight: '600' },
});
