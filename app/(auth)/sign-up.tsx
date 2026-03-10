import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
  Animated, useWindowDimensions,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGrad, Stop, Rect, Circle } from 'react-native-svg';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

function OceanHeader({ width }: { width: number }) {
  const height = 220;
  return (
    <Svg width={width} height={height} style={{ marginBottom: -1 }}>
      <Defs>
        <SvgGrad id="hg" x1="0" y1="0" x2="0.3" y2="1">
          <Stop offset="0" stopColor="#0A1F36" />
          <Stop offset="0.6" stopColor="#0E4060" />
          <Stop offset="1" stopColor="#166B8A" />
        </SvgGrad>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#hg)" />
      {/* Bubbles */}
      <Circle cx={width * 0.15} cy={60}  r={4} fill="white" opacity="0.10" />
      <Circle cx={width * 0.75} cy={40}  r={6} fill="white" opacity="0.08" />
      <Circle cx={width * 0.88} cy={110} r={3} fill="white" opacity="0.12" />
      <Circle cx={width * 0.30} cy={140} r={5} fill="white" opacity="0.07" />
      {/* Light ray */}
      <Path d={`M${width * 0.7},0 L${width * 0.45},${height} L${width * 0.38},${height} Z`} fill="white" opacity="0.06" />
      {/* Bottom wave */}
      <Path
        d={`M0,${height * 0.72} Q${width * 0.25},${height * 0.60} ${width * 0.5},${height * 0.72} Q${width * 0.75},${height * 0.84} ${width},${height * 0.70} L${width},${height} L0,${height} Z`}
        fill="#0D1B2A"
      />
    </Svg>
  );
}

export default function SignUpPage() {
  const { signUp } = useAuth();
  const { width } = useWindowDimensions();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState<string | null>(null);

  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields.'); return;
    }
    if (password !== confirm) {
      Alert.alert('Password Mismatch', 'Your passwords do not match.'); return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.'); return;
    }
    setLoading(true);
    try {
      await signUp(name.trim(), email.trim(), password.trim());
    } catch (e: any) {
      const msgs: Record<string, string> = {
        'auth/email-already-in-use': 'An account with this email already exists.',
      };
      Alert.alert('Sign Up Failed', msgs[e.code] ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFocused = (field: string) => focused === field;

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Ocean header */}
        <View style={{ marginHorizontal: -24 }}>
          <OceanHeader width={width} />
        </View>

        {/* Logo + title (overlaid on wave) */}
        <Animated.View style={[s.header, { opacity: fadeIn }]}>
          <Text style={s.fishEmoji}>🌊</Text>
          <Text style={s.appName}>StudyTide</Text>
          <Text style={s.tagline}>Begin your ocean adventure</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={[s.form, { opacity: fadeIn }]}>

          {/* Name */}
          <View style={[s.inputWrap, isFocused('name') && s.inputFocused]}>
            <Ionicons name="person-outline" size={18} color={isFocused('name') ? '#3DBDAA' : '#456B84'} style={s.icon} />
            <TextInput
              style={s.input}
              placeholder="Full Name"
              placeholderTextColor="#456B84"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
            />
          </View>

          {/* Email */}
          <View style={[s.inputWrap, isFocused('email') && s.inputFocused]}>
            <Ionicons name="mail-outline" size={18} color={isFocused('email') ? '#3DBDAA' : '#456B84'} style={s.icon} />
            <TextInput
              style={s.input}
              placeholder="Email Address"
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

          {/* Password */}
          <View style={[s.inputWrap, isFocused('pw') && s.inputFocused]}>
            <Ionicons name="lock-closed-outline" size={18} color={isFocused('pw') ? '#3DBDAA' : '#456B84'} style={s.icon} />
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor="#456B84"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              onFocus={() => setFocused('pw')}
              onBlur={() => setFocused(null)}
            />
            <TouchableOpacity onPress={() => setShowPw(v => !v)} style={s.eyeBtn}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color="#456B84" />
            </TouchableOpacity>
          </View>

          {/* Confirm */}
          <View style={[s.inputWrap, isFocused('confirm') && s.inputFocused]}>
            <Ionicons name="lock-closed-outline" size={18} color={isFocused('confirm') ? '#3DBDAA' : '#456B84'} style={s.icon} />
            <TextInput
              style={s.input}
              placeholder="Confirm Password"
              placeholderTextColor="#456B84"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              onFocus={() => setFocused('confirm')}
              onBlur={() => setFocused(null)}
            />
            {confirm.length > 0 && (
              <Ionicons
                name={confirm === password ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={confirm === password ? '#3DBDAA' : '#E76F51'}
              />
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={handleSignUp} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#0D1B2A" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={s.btnText}>Create Account</Text>
                <Text style={{ fontSize: 18 }}>🐠</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.divLine} />
            <Text style={s.divText}>or</Text>
            <View style={s.divLine} />
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>Already exploring? </Text>
            <Link href="/(auth)/sign-in" style={s.link}>Sign In</Link>
          </View>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B2A' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48 },

  header: { alignItems: 'center', marginTop: -40, marginBottom: 32 },
  fishEmoji: { fontSize: 52, marginBottom: 8 },
  appName: { fontSize: 32, fontWeight: '900', color: '#3DBDAA', letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: '#7AAFC8', marginTop: 4 },

  form: { gap: 14 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#152234',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1E3A54',
    paddingHorizontal: 16,
    height: 56,
  },
  inputFocused: { borderColor: '#3DBDAA' },
  icon: { marginRight: 12 },
  input: { flex: 1, color: '#E8F4FD', fontSize: 16 },
  eyeBtn: { padding: 4 },

  btn: {
    backgroundColor: '#3DBDAA',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#3DBDAA',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  btnText: { color: '#0D1B2A', fontSize: 17, fontWeight: '800' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  divLine: { flex: 1, height: 1, backgroundColor: '#1E3A54' },
  divText: { color: '#456B84', fontSize: 13 },

  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: '#7AAFC8', fontSize: 15 },
  link: { color: '#3DBDAA', fontSize: 15, fontWeight: '700' },
});
