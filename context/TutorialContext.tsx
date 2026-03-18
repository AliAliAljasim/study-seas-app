import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

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
  isActive: boolean;
  isVisible: boolean;
}

const STEPS: TutorialStep[] = [
  'dashboard_hero', 'aquarium_biome', 'aquarium_empty', 'timer_prompt',
  'egg_tab', 'egg_hatch', 'tank_return', 'bestiary_view', 'dashboard_features', 'done',
];

const TutorialContext = createContext<TutorialCtx>({
  step: null, spotlight: null, dismissed: false,
  setSpotlight: () => {}, advance: () => {}, skip: () => {}, dismiss: () => {},
  initForUser: async () => {}, isActive: false, isVisible: false,
});

const metaDoc = (uid: string) => doc(db, 'users', uid, 'meta');

async function saveTutorialStep(uid: string, step: TutorialStep) {
  if (!uid) return;
  await setDoc(metaDoc(uid), { tutorialStep: step }, { merge: true });
}

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<TutorialStep | null>(null);
  const [spotlight, setSpotlightState] = useState<SpotRect | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const uidRef = useRef('');

  const setSpotlight = useCallback((r: SpotRect | null) => setSpotlightState(r), []);

  const advance = useCallback(() => {
    setSpotlightState(null);
    setDismissed(false);
    setStep((prev) => {
      if (!prev) return null;
      const next = STEPS[Math.min(STEPS.indexOf(prev) + 1, STEPS.length - 1)];
      saveTutorialStep(uidRef.current, next);
      return next;
    });
  }, []);

  const skip = useCallback(() => {
    setSpotlightState(null);
    setDismissed(false);
    setStep('done');
    saveTutorialStep(uidRef.current, 'done');
  }, []);

  const dismiss = useCallback(() => setDismissed(true), []);

  useEffect(() => { setDismissed(false); }, [step]);

  const initForUser = useCallback(async (uid: string) => {
    uidRef.current = uid;
    const snap = await getDoc(metaDoc(uid));
    const saved = snap.exists() ? snap.data().tutorialStep : null;
    if (!saved) {
      setStep('dashboard_hero');
      saveTutorialStep(uid, 'dashboard_hero');
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
