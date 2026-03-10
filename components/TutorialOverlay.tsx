import { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  useWindowDimensions, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTutorial, TutorialStep } from '../context/TutorialContext';

// ─── Step content config ──────────────────────────────

interface StepInfo {
  emoji: string;
  title: string;
  body: string;
  cta?: string;
  ctaVariant?: 'primary' | 'soft';
  onCta?: (router: ReturnType<typeof useRouter>, advance: () => void, dismiss: () => void) => void;
  showSkip?: boolean;
}

const STEP_INFO: Record<TutorialStep, StepInfo> = {
  dashboard_hero: {
    emoji: '🌊',
    title: 'Welcome to StudyTide!',
    body: 'Tap the ocean banner to visit your aquarium and begin your journey.',
    showSkip: true,
  },
  aquarium_biome: {
    emoji: '🗺',
    title: 'Your Ocean Map',
    body: 'Tap Sunlit Shallows to peek inside your first biome!',
    showSkip: true,
  },
  aquarium_empty: {
    emoji: '🐟',
    title: "It's Empty...",
    body: 'No creatures yet! Tap ← to go back and head to the Focus Timer.',
    showSkip: true,
  },
  timer_prompt: {
    emoji: '⏱',
    title: 'Focus Time!',
    body: 'A 3-second session is ready. Tap ▶ to start and earn your first egg!',
    showSkip: true,
  },
  egg_tab: {
    emoji: '🥚',
    title: 'You Earned an Egg!',
    body: 'Head to your Aquarium to hatch your very first creature.',
    cta: 'Open Aquarium →',
    ctaVariant: 'primary',
    onCta: (router, advance) => { router.push('/aquarium'); advance(); },
    showSkip: false,
  },
  egg_hatch: {
    emoji: '✨',
    title: 'Ready to Hatch!',
    body: 'Tap the glowing egg to meet your very first creature!',
    showSkip: false,
  },
  tank_return: {
    emoji: '🦦',
    title: 'New Friend!',
    body: 'Tap the Tank tab to see your creature swimming!',
    showSkip: false,
  },
  bestiary_view: {
    emoji: '📖',
    title: 'The Bestiary',
    body: 'Tap Bestiary to see every creature you\'ve discovered.',
    showSkip: false,
  },
  dashboard_features: {
    emoji: '🛠',
    title: 'Your Study Tools',
    body: 'Focus Timer earns eggs. Calendar helps you plan. Tasks keep you on track. Progress tracks your grades.',
    cta: "Let's go! 🚀",
    ctaVariant: 'primary',
    onCta: (_, advance) => advance(),
    showSkip: false,
  },
  done: {
    emoji: '',
    title: '',
    body: '',
  },
};

// ─── Spotlight pulse animation ────────────────────────

function SpotlightBorder({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.0] });
  const pad = 10;
  return (
    <Animated.View style={{
      position: 'absolute',
      top: y - pad, left: x - pad,
      width: w + pad * 2, height: h + pad * 2,
      borderRadius: 20, borderWidth: 2.5,
      borderColor: '#3DBDAA',
      opacity,
    }} />
  );
}

// ─── Main overlay ─────────────────────────────────────

export default function TutorialOverlay() {
  const { step, spotlight, isVisible, advance, skip, dismiss } = useTutorial();
  const router = useRouter();
  const { width: W, height: H } = useWindowDimensions();

  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
    } else {
      cardAnim.setValue(0);
    }
  }, [isVisible, step]);

  if (!isVisible || !step || step === 'done') return null;

  const info = STEP_INFO[step];
  const hasSp = !!spotlight;
  const PAD = 12;

  // 4-rect dark overlay to create spotlight hole
  const topH    = hasSp ? Math.max(0, spotlight!.y - PAD) : H;
  const botY    = hasSp ? spotlight!.y + spotlight!.h + PAD : 0;
  const botH    = hasSp ? Math.max(0, H - botY) : 0;
  const leftW   = hasSp ? Math.max(0, spotlight!.x - PAD) : 0;
  const rightX  = hasSp ? spotlight!.x + spotlight!.w + PAD : 0;
  const rightW  = hasSp ? Math.max(0, W - rightX) : 0;
  const spH     = hasSp ? spotlight!.h + PAD * 2 : 0;
  const spY     = hasSp ? spotlight!.y - PAD : 0;
  const dark    = 'rgba(5,15,28,0.82)';

  // Message card position: if spotlight is in top 60% → show card below; else above
  const cardBelow = hasSp ? (spotlight!.y + spotlight!.h < H * 0.6) : true;

  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [cardBelow ? 40 : -40, 0],
  });

  const handleCta = () => {
    info.onCta?.(router, advance, dismiss);
  };

  const cardPos = cardBelow
    ? { bottom: 32 }
    : { top: Math.max(60, hasSp ? spY - 130 : 80) };

  return (
    <>
      {/* Layer 1: purely visual — never intercepts any touches */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]} pointerEvents="none">
        {hasSp ? (
          <>
            <View style={[s.dark, { top: 0, left: 0, right: 0, height: topH, backgroundColor: dark }]} />
            <View style={[s.dark, { top: botY, left: 0, right: 0, bottom: 0, backgroundColor: dark }]} />
            <View style={[s.dark, { top: spY, left: 0, width: leftW, height: spH, backgroundColor: dark }]} />
            <View style={[s.dark, { top: spY, left: rightX, right: 0, height: spH, backgroundColor: dark }]} />
            <SpotlightBorder x={spotlight!.x} y={spotlight!.y} w={spotlight!.w} h={spotlight!.h} />
          </>
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: dark }]} />
        )}
      </View>

      {/* Layer 2: card only — box-none so only the card itself captures touches */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]} pointerEvents="box-none">
        <Animated.View
          style={[s.card, cardPos, { opacity: cardAnim, transform: [{ translateY: cardTranslateY }] }]}
        >
          {info.showSkip && (
            <View style={s.cardTop}>
              <TouchableOpacity onPress={skip}>
                <Text style={s.skipText}>Skip tutorial</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={s.contentRow}>
            <Text style={s.emoji}>{info.emoji}</Text>
            <View style={s.textBlock}>
              <Text style={s.title}>{info.title}</Text>
              <Text style={s.body}>{info.body}</Text>
            </View>
          </View>

          {info.cta && (
            <TouchableOpacity
              style={[s.ctaBtn, info.ctaVariant === 'soft' ? s.ctaSoft : s.ctaPrimary]}
              onPress={handleCta}
            >
              <Text style={[s.ctaText, info.ctaVariant === 'soft' && { color: '#7AAFC8' }]}>
                {info.cta}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  dark: { position: 'absolute' },
  card: {
    position: 'absolute',
    left: 16, right: 16,
    backgroundColor: '#0E1E30',
    borderRadius: 20,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#1E3A54',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 16,
  },
  cardTop: { alignItems: 'flex-end' },
  skipText: { color: '#456B84', fontSize: 11 },
  contentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  emoji: { fontSize: 26, lineHeight: 32 },
  textBlock: { flex: 1 },
  title: { fontSize: 14, fontWeight: '800', color: '#E8F4FD' },
  body: { fontSize: 12, color: '#7AAFC8', lineHeight: 17, marginTop: 2 },
  ctaBtn: { borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  ctaPrimary: { backgroundColor: '#3DBDAA' },
  ctaSoft: { backgroundColor: '#152234', borderWidth: 1, borderColor: '#2A3F56' },
  ctaText: { color: '#0D1B2A', fontWeight: '700', fontSize: 13 },
});
