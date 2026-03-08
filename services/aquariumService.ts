import AsyncStorage from '@react-native-async-storage/async-storage';
import { FishEgg, OwnedFish, FishSpecies, FISH_SPECIES, rollFishSpecies } from '../models/aquariumModels';
import { generateId } from '../models/taskModels';

const EGGS_KEY = 'aquarium_eggs';
const FISH_KEY = 'aquarium_fish';

export async function getEggs(): Promise<FishEgg[]> {
  const json = await AsyncStorage.getItem(EGGS_KEY);
  return json ? JSON.parse(json) : [];
}

export async function awardEgg(): Promise<FishEgg> {
  const egg: FishEgg = { id: generateId(), earnedAt: new Date().toISOString() };
  const eggs = await getEggs();
  await AsyncStorage.setItem(EGGS_KEY, JSON.stringify([...eggs, egg]));
  return egg;
}

export async function getOwnedFish(): Promise<OwnedFish[]> {
  const json = await AsyncStorage.getItem(FISH_KEY);
  return json ? JSON.parse(json) : [];
}

export async function hatchEgg(eggId: string): Promise<{ fish: OwnedFish; species: FishSpecies }> {
  const eggs = await getEggs();
  await AsyncStorage.setItem(EGGS_KEY, JSON.stringify(eggs.filter((e) => e.id !== eggId)));

  const species = rollFishSpecies();
  const fish: OwnedFish = { id: generateId(), speciesId: species.id, hatchedAt: new Date().toISOString() };

  const owned = await getOwnedFish();
  await AsyncStorage.setItem(FISH_KEY, JSON.stringify([...owned, fish]));

  return { fish, species };
}

export async function loadSamplePack(): Promise<void> {
  const now = new Date().toISOString();
  const owned = await getOwnedFish();
  const alreadyOwned = new Set(owned.map((f) => f.speciesId));
  const newFish: OwnedFish[] = FISH_SPECIES
    .filter((s) => !alreadyOwned.has(s.id))
    .map((s) => ({ id: generateId(), speciesId: s.id, hatchedAt: now }));
  await AsyncStorage.setItem(FISH_KEY, JSON.stringify([...owned, ...newFish]));
}
