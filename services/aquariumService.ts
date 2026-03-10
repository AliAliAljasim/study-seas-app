import AsyncStorage from '@react-native-async-storage/async-storage';
import { FishEgg, OwnedFish, FishSpecies, FISH_SPECIES, rollFishSpecies, computeUnlockedBiomes, BIOME_SPECIES, BiomeKey } from '../models/aquariumModels';
import { generateId } from '../models/taskModels';

const eggsKey      = (uid: string) => `aquarium_eggs_${uid}`;
const fishKey      = (uid: string) => `aquarium_fish_${uid}`;
const starterKey   = (uid: string) => `aquarium_starter_claimed_${uid}`;
const lastLoginKey = (uid: string) => `last_login_date_${uid}`;

const INCUBATION_MS   = 24 * 60 * 60 * 1000; // 24 h until ready to hatch
const HATCH_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 h window to hatch before expiry

// ── internal ─────────────────────────────────────────

function buildEgg(speciesHint?: string, incubationMs = INCUBATION_MS): FishEgg {
  const now       = Date.now();
  const readyAt   = new Date(now + incubationMs).toISOString();
  const expiresAt = new Date(now + incubationMs + HATCH_WINDOW_MS).toISOString();
  return {
    id: generateId(),
    earnedAt: new Date(now).toISOString(),
    readyAt,
    expiresAt,
    ...(speciesHint ? { speciesHint } : {}),
  };
}

/** Migrate legacy eggs missing readyAt/expiresAt, then drop any that have expired. */
async function loadAndCleanEggs(uid: string): Promise<FishEgg[]> {
  const json = await AsyncStorage.getItem(eggsKey(uid));
  if (!json) return [];

  const raw: any[] = JSON.parse(json);
  const now = Date.now();

  const migrated: FishEgg[] = raw.map((egg) => {
    if (egg.readyAt) return egg as FishEgg;
    const earned = new Date(egg.earnedAt).getTime();
    return {
      ...egg,
      readyAt:   new Date(earned + INCUBATION_MS).toISOString(),
      expiresAt: new Date(earned + INCUBATION_MS + HATCH_WINDOW_MS).toISOString(),
    } as FishEgg;
  });

  const valid = migrated.filter((e) => new Date(e.expiresAt).getTime() > now);

  if (valid.length !== raw.length) {
    await AsyncStorage.setItem(eggsKey(uid), JSON.stringify(valid));
  }
  return valid;
}

// ── public API ───────────────────────────────────────

export async function getEggs(uid: string): Promise<FishEgg[]> {
  return loadAndCleanEggs(uid);
}

export async function awardEgg(uid: string, speciesHint?: string): Promise<FishEgg> {
  const egg  = buildEgg(speciesHint);
  const eggs = await loadAndCleanEggs(uid);
  await AsyncStorage.setItem(eggsKey(uid), JSON.stringify([...eggs, egg]));
  return egg;
}

/** Awards the free otter egg on first app open. Ready in 5 seconds. Returns null if already claimed. */
export async function claimStarterEgg(uid: string): Promise<FishEgg | null> {
  const already = await AsyncStorage.getItem(starterKey(uid));
  if (already) return null;
  await AsyncStorage.setItem(starterKey(uid), 'true');
  const egg  = buildEgg('otter', 5_000); // 5-second incubation
  const eggs = await loadAndCleanEggs(uid);
  await AsyncStorage.setItem(eggsKey(uid), JSON.stringify([...eggs, egg]));
  return egg;
}

/** Today's date string in Eastern Time — changes at 12:00 AM ET. */
function getEasternDateString(): string {
  return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' });
}

/** Milliseconds from now until the next 12:00 AM Eastern Time (handles EST/EDT automatically). */
function getMsUntilEasternMidnight(): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parseInt(parts.find(p => p.type === t)!.value);
  const elapsedMs = get('hour') * 3_600_000 + get('minute') * 60_000 + get('second') * 1_000;
  return 86_400_000 - elapsedMs;
}

/** Awards one egg per calendar day (ET) on login. Returns null if already awarded today.
 *  The egg incubates until the next 12:00 AM ET so it's always ready when the daily reward resets. */
export async function checkDailyLoginEgg(uid: string): Promise<FishEgg | null> {
  const today = getEasternDateString();
  const last  = await AsyncStorage.getItem(lastLoginKey(uid));
  if (last === today) return null;
  await AsyncStorage.setItem(lastLoginKey(uid), today);

  const egg  = buildEgg(undefined, getMsUntilEasternMidnight());
  const eggs = await loadAndCleanEggs(uid);
  await AsyncStorage.setItem(eggsKey(uid), JSON.stringify([...eggs, egg]));
  return egg;
}

export async function getOwnedFish(uid: string): Promise<OwnedFish[]> {
  const json = await AsyncStorage.getItem(fishKey(uid));
  return json ? JSON.parse(json) : [];
}

export async function hatchEgg(uid: string, eggId: string): Promise<{ fish: OwnedFish; species: FishSpecies }> {
  const eggs = await loadAndCleanEggs(uid);
  const egg  = eggs.find((e) => e.id === eggId);
  if (!egg) throw new Error('Egg not found or expired');

  await AsyncStorage.setItem(eggsKey(uid), JSON.stringify(eggs.filter((e) => e.id !== eggId)));

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
    allowedIds.delete('otter'); // never rollable
    const ownedSpeciesIds = new Set(currentOwned.map((f) => f.speciesId));
    species = rollFishSpecies(allowedIds, ownedSpeciesIds);
  }

  const fish: OwnedFish = { id: generateId(), speciesId: species.id, hatchedAt: new Date().toISOString() };
  await AsyncStorage.setItem(fishKey(uid), JSON.stringify([...currentOwned, fish]));

  return { fish, species };
}

export async function skipEggTimer(uid: string, eggId: string): Promise<void> {
  const eggs = await loadAndCleanEggs(uid);
  const now  = new Date().toISOString();
  const updated = eggs.map((e) => e.id === eggId ? { ...e, readyAt: now } : e);
  await AsyncStorage.setItem(eggsKey(uid), JSON.stringify(updated));
}

export async function clearOwnedFish(uid: string): Promise<void> {
  await AsyncStorage.setItem(fishKey(uid), JSON.stringify([]));
}

export async function loadSamplePack(uid: string): Promise<void> {
  const now = new Date().toISOString();
  const owned = await getOwnedFish(uid);
  const alreadyOwned = new Set(owned.map((f) => f.speciesId));
  const newFish: OwnedFish[] = FISH_SPECIES
    .filter((s) => !alreadyOwned.has(s.id))
    .map((s) => ({ id: generateId(), speciesId: s.id, hatchedAt: now }));
  await AsyncStorage.setItem(fishKey(uid), JSON.stringify([...owned, ...newFish]));
}
