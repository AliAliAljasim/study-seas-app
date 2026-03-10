import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TutorialStep =
  | 'dashboard_hero'
  | 'aquarium_biome'
  | 'aquarium_empty'
  | 'timer_prompt'
  | 'egg_tab'
  | 'egg_hatch'
  | 'tank_return'
  | 'bestiary_view'
  | 'dashboard_features'
  | 'done';

export interface SpotRect { x: number; y: number; w: number; h: number; }

interface TutorialCtx {
  step: TutorialStep | null;
  spotlight: SpotRect | null;
  dismissed: boolean;
  setSpotlight: (r: SpotRect | null) => void;
  advance: () => void;
  skip: () => void;
  dismiss: () => void;
  initForUser: (uid: string) => Promise<void>;
  isActive: boolean;   // step is not null and not 'done'
  isVisible: boolean;  // isActive && !dismissed
}

const STEPS: TutorialStep[] = [
  'dashboard_hero',
  'aquarium_biome',
  'aquarium_empty',
  'timer_prompt',
  'egg_tab',
  'egg_hatch',
  'tank_return',
  'bestiary_view',
  'dashboard_features',
  'done',
];

const TutorialContext = createContext<TutorialCtx>({
  step: null, spotlight: null, dismissed: false,
  setSpotlight: () => {}, advance: () => {}, skip: () => {}, dismiss: () => {},
  initForUser: async () => {}, isActive: false, isVisible: false,
});

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<TutorialStep | null>(null);
  const [spotlight, setSpotlightState] = useState<SpotRect | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const uidRef = useRef('');

  const setSpotlight = useCallback((r: SpotRect | null) => setSpotlightState(r), []);

  const saveStep = (s: TutorialStep) => {
    if (uidRef.current) AsyncStorage.setItem(`tutorial_${uidRef.current}`, s);
  };

  const advance = useCallback(() => {
    setSpotlightState(null);
    setDismissed(false);
    setStep(prev => {
      if (!prev) return null;
      const idx = STEPS.indexOf(prev);
      const next = STEPS[Math.min(idx + 1, STEPS.length - 1)];
      saveStep(next);
      return next;
    });
  }, []);

  const skip = useCallback(() => {
    setSpotlightState(null);
    setDismissed(false);
    setStep('done');
    if (uidRef.current) AsyncStorage.setItem(`tutorial_${uidRef.current}`, 'done');
  }, []);

  const dismiss = useCallback(() => setDismissed(true), []);

  // Reset dismissed whenever step changes
  useEffect(() => { setDismissed(false); }, [step]);

  const initForUser = useCallback(async (uid: string) => {
    uidRef.current = uid;
    const saved = await AsyncStorage.getItem(`tutorial_${uid}`);
    if (!saved) {
      setStep('dashboard_hero');
      AsyncStorage.setItem(`tutorial_${uid}`, 'dashboard_hero');
    } else {
      setStep(saved as TutorialStep);
    }
  }, []);

  const isActive = !!step && step !== 'done';
  const isVisible = isActive && !dismissed;

  return (
    <TutorialContext.Provider value={{
      step, spotlight, dismissed, setSpotlight,
      advance, skip, dismiss, initForUser, isActive, isVisible,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export const useTutorial = () => useContext(TutorialContext);
