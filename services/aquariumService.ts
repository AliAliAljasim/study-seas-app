import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch, onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { FishEgg, OwnedFish, FishSpecies, FISH_SPECIES, rollFishSpecies, computeUnlockedBiomes, BIOME_SPECIES, BiomeKey } from '../models/aquariumModels';
import { generateId } from '../models/taskModels';

// ── Firestore paths ───────────────────────────────────
const eggsCol  = (uid: string) => collection(db, 'users', uid, 'eggs');
const fishCol  = (uid: string) => collection(db, 'users', uid, 'fish');
const metaDoc  = (uid: string) => doc(db, 'users', uid, 'data', 'meta');
const eggDoc   = (uid: string, id: string) => doc(db, 'users', uid, 'eggs', id);
const fishDoc  = (uid: string, id: string) => doc(db, 'users', uid, 'fish', id);

const INCUBATION_MS   = 24 * 60 * 60 * 1000;
const HATCH_WINDOW_MS = 48 * 60 * 60 * 1000;

function buildEgg(speciesHint?: string, incubationMs = INCUBATION_MS): FishEgg {
  const now = Date.now();
  return {
    id: generateId(),
    earnedAt:  new Date(now).toISOString(),
    readyAt:   new Date(now + incubationMs).toISOString(),
    expiresAt: new Date(now + incubationMs + HATCH_WINDOW_MS).toISOString(),
    ...(speciesHint ? { speciesHint } : {}),
  };
}

async function loadAndCleanEggs(uid: string): Promise<FishEgg[]> {
  const snap = await getDocs(eggsCol(uid));
  const now = Date.now();
  const batch = writeBatch(db);
  let deletedAny = false;

  const valid: FishEgg[] = [];
  for (const d of snap.docs) {
    const egg = d.data() as FishEgg;
    // Migrate legacy eggs missing readyAt or earnedAt
    if (!egg.earnedAt) {
      egg.earnedAt = (egg as any).awardedAt ?? new Date(now).toISOString();
    }
    if (!egg.readyAt) {
      const earned = new Date(egg.earnedAt).getTime();
      const base = isNaN(earned) ? now : earned;
      egg.readyAt   = new Date(base + INCUBATION_MS).toISOString();
      egg.expiresAt = new Date(base + INCUBATION_MS + HATCH_WINDOW_MS).toISOString();
      batch.set(d.ref, egg);
    }
    if (new Date(egg.expiresAt ?? 0).getTime() > now) {
      valid.push(egg);
    } else {
      batch.delete(d.ref);
      deletedAny = true;
    }
  }
  if (deletedAny || snap.docs.some((d) => !(d.data() as FishEgg).readyAt)) {
    await batch.commit();
  }
  return valid;
}

// ── Public API ────────────────────────────────────────

export async function getEggs(uid: string): Promise<FishEgg[]> {
  return loadAndCleanEggs(uid);
}

export async function awardEgg(uid: string, speciesHint?: string): Promise<FishEgg> {
  const egg = buildEgg(speciesHint);
  await setDoc(eggDoc(uid, egg.id), egg);
  return egg;
}

export async function claimStarterEgg(uid: string): Promise<FishEgg | null> {
  const meta = await getDoc(metaDoc(uid));
  if (meta.exists() && meta.data().starterClaimed) return null;
  // Record account creation date so the daily egg buffer can use it
  await setDoc(metaDoc(uid), { starterClaimed: true, accountCreatedDate: getEasternDateString() }, { merge: true });
  const egg = buildEgg('otter', 5_000);
  await setDoc(eggDoc(uid, egg.id), egg);
  return egg;
}

function getEasternDateString(): string {
  return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' });
}

function getMsUntilEasternMidnight(): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)!.value);
  const elapsedMs = get('hour') * 3_600_000 + get('minute') * 60_000 + get('second') * 1_000;
  return 86_400_000 - elapsedMs;
}

export async function checkDailyLoginEgg(uid: string): Promise<FishEgg | null> {
  const today = getEasternDateString();
  const meta = await getDoc(metaDoc(uid));
  const data = meta.exists() ? meta.data() : {};

  // No egg on the day the account was created — reward starts the following day
  if (data.accountCreatedDate === today) return null;

  if (data.lastLoginDate === today) return null;
  await setDoc(metaDoc(uid), { lastLoginDate: today }, { merge: true });
  const egg = buildEgg(undefined, getMsUntilEasternMidnight());
  await setDoc(eggDoc(uid, egg.id), egg);
  return egg;
}

export async function getOwnedFish(uid: string): Promise<OwnedFish[]> {
  const snap = await getDocs(fishCol(uid));
  return snap.docs.map((d) => d.data() as OwnedFish);
}

export function subscribeToEggs(uid: string, cb: (eggs: FishEgg[]) => void): () => void {
  return onSnapshot(eggsCol(uid), (snap) => cb(snap.docs.map((d) => d.data() as FishEgg)));
}

export function subscribeToFish(uid: string, cb: (fish: OwnedFish[]) => void): () => void {
  return onSnapshot(fishCol(uid), (snap) => cb(snap.docs.map((d) => d.data() as OwnedFish)));
}

export async function hatchEgg(uid: string, eggId: string): Promise<{ fish: OwnedFish; species: FishSpecies }> {
  const eggs = await loadAndCleanEggs(uid);
  const egg = eggs.find((e) => e.id === eggId);
  if (!egg) throw new Error('Egg not found or expired');

  await deleteDoc(eggDoc(uid, eggId));

  const currentOwned = await getOwnedFish(uid);
  const hinted = egg.speciesHint ? FISH_SPECIES.find((s) => s.id === egg.speciesHint) : undefined;

  let species: FishSpecies;
  if (hinted) {
    species = hinted;
  } else {
    const unlockedBiomes = computeUnlockedBiomes(currentOwned);
    const allowedIds = new Set<string>();
    for (const biomeKey of unlockedBiomes as Set<BiomeKey>) {
      for (const id of BIOME_SPECIES[biomeKey]) allowedIds.add(id);
    }
    allowedIds.delete('otter');
    const ownedSpeciesIds = new Set(currentOwned.map((f) => f.speciesId));
    species = rollFishSpecies(allowedIds, ownedSpeciesIds);
  }

  const fish: OwnedFish = { id: generateId(), speciesId: species.id, hatchedAt: new Date().toISOString() };
  await setDoc(fishDoc(uid, fish.id), fish);
  return { fish, species };
}

export async function skipEggTimer(uid: string, eggId: string): Promise<void> {
  const eggs = await loadAndCleanEggs(uid);
  const egg = eggs.find((e) => e.id === eggId);
  if (!egg) return;
  await setDoc(eggDoc(uid, eggId), { ...egg, readyAt: new Date().toISOString() });
}

export async function clearOwnedFish(uid: string): Promise<void> {
  const snap = await getDocs(fishCol(uid));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function loadSamplePack(uid: string): Promise<void> {
  const now = new Date().toISOString();
  const owned = await getOwnedFish(uid);
  const alreadyOwned = new Set(owned.map((f) => f.speciesId));
  const batch = writeBatch(db);
  FISH_SPECIES
    .filter((s) => !alreadyOwned.has(s.id))
    .forEach((s) => {
      const fish: OwnedFish = { id: generateId(), speciesId: s.id, hatchedAt: now };
      batch.set(fishDoc(uid, fish.id), fish);
    });
  await batch.commit();
}
