export type FishRarity = 'trash' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type FishHabitat = 'surface' | 'floor' | 'depths';
export type BiomeKey = 'shallows' | 'open_water' | 'coral_reef' | 'sandy_bed' | 'shipwreck' | 'deep_reef' | 'abyss';

export interface FishSpecies {
  id: string;
  name: string;
  emoji: string;
  rarity: FishRarity;
  habitat: FishHabitat;
  description: string;
  color: string;
}

export const HABITAT_LABELS: Record<FishHabitat, string> = {
  surface: 'Surface',
  floor:   'Ocean Floor',
  depths:  'Depths',
};

export interface FishEgg {
  id: string;
  earnedAt: string;
  readyAt: string;     // ISO – when it can be hatched (earnedAt + 24 h)
  expiresAt: string;   // ISO – disappears if not hatched (readyAt + 48 h)
  speciesHint?: string; // e.g. 'otter' for the guaranteed starter egg
}

export interface OwnedFish {
  id: string;
  speciesId: string;
  hatchedAt: string;
}

export const RARITY_COLORS: Record<FishRarity, string> = {
  trash:     '#5D4037',
  common:    '#78909C',
  uncommon:  '#4CAF50',
  rare:      '#2196F3',
  epic:      '#9C27B0',
  legendary: '#FF9800',
};

export const RARITY_LABELS: Record<FishRarity, string> = {
  trash:     'Trash',
  common:    'Common',
  uncommon:  'Uncommon',
  rare:      'Rare',
  epic:      'Epic',
  legendary: 'Legendary',
};

const RARITY_WEIGHTS: Record<FishRarity, number> = {
  trash:     25,
  common:    50,
  uncommon:  25,
  rare:      15,
  epic:      8,
  legendary: 2,
};

export const FISH_SPECIES: FishSpecies[] = [
  // ── Trash ───────────────────────────────────────────────
  { id: 'worm',              name: 'Worm',                   emoji: '🪱', rarity: 'trash',     habitat: 'surface', color: '#A1887F', description: 'Wriggling bait. Nothing more, nothing less.' },
  { id: 'rusty_can',         name: 'Rusty Can',              emoji: '🥫', rarity: 'trash',     habitat: 'floor',   color: '#8D6E63', description: 'An old can lost to the depths. Not a trophy.' },
  { id: 'apple_core',        name: 'Apple Core',             emoji: '🍎', rarity: 'trash',     habitat: 'surface', color: '#EF9A9A', description: "Someone's litter. The fish aren't impressed either." },
  { id: 'bottle',            name: 'Bottle',                 emoji: '🍶', rarity: 'trash',     habitat: 'surface', color: '#80CBC4', description: 'A message inside... just kidding, it\'s empty.' },
  { id: 'seaweed',           name: 'Seaweed',                emoji: '🌿', rarity: 'trash',     habitat: 'floor',   color: '#388E3C', description: 'Tangles the line every time. Part of the experience.' },
  // ── Common ──────────────────────────────────────────────
  { id: 'goldfish',          name: 'Goldfish',               emoji: '🐟', rarity: 'common',    habitat: 'surface', color: '#FFA726', description: 'A classic aquarium fish. Round and cheerful.' },
  { id: 'guppy',             name: 'Guppy',                  emoji: '🐟', rarity: 'common',    habitat: 'surface', color: '#AB47BC', description: 'Tiny but colorful. Found in nearly every freshwater tank.' },
  { id: 'bluegill',          name: 'Bluegill',               emoji: '🐟', rarity: 'common',    habitat: 'surface', color: '#29B6F6', description: 'A sunfish with a cheerful blue-tinted gill cover.' },
  { id: 'silverjaw_minnow',  name: 'Silverjaw Minnow',       emoji: '🐟', rarity: 'common',    habitat: 'surface', color: '#B0BEC5', description: 'A small schooling fish with a silvery sheen.' },
  { id: 'tadpole',           name: 'Tadpole',                emoji: '🐸', rarity: 'common',    habitat: 'surface', color: '#66BB6A', description: 'A frog-in-progress. Wriggles through murky shallows.' },
  { id: 'mussel',            name: 'Mussel',                 emoji: '🐚', rarity: 'common',    habitat: 'floor',   color: '#5C6BC0', description: 'Clings to rocks with strong threads. Filters the water clean.' },
  { id: 'anchovy',           name: 'Anchovy',                emoji: '🐟', rarity: 'common',    habitat: 'surface', color: '#90A4AE', description: 'Small, silvery, and abundant. Schools by the million.' },
  { id: 'goby',              name: 'Goby',                   emoji: '🐟', rarity: 'common',    habitat: 'floor',   color: '#A5D6A7', description: 'A tiny bottom-hugger with big, watchful eyes.' },
  { id: 'shrimp',            name: 'Shrimp',                 emoji: '🦐', rarity: 'common',    habitat: 'floor',   color: '#FFAB91', description: 'Scuttles backwards through coral and reef.' },
  { id: 'starfish',          name: 'Starfish',               emoji: '⭐', rarity: 'common',    habitat: 'floor',   color: '#FF7043', description: 'Five arms, infinite patience. Moves slower than it looks.' },
  // ── Uncommon ────────────────────────────────────────────
  { id: 'bass',              name: 'Bass',                   emoji: '🐟', rarity: 'uncommon',  habitat: 'surface', color: '#66BB6A', description: 'A feisty freshwater fighter. Popular with anglers.' },
  { id: 'catfish',           name: 'Catfish',                emoji: '🐟', rarity: 'uncommon',  habitat: 'floor',   color: '#8D6E63', description: 'Whiskers down, belly flat. Rules the river bottom.' },
  { id: 'yellow_perch',      name: 'Yellow Perch',           emoji: '🐟', rarity: 'uncommon',  habitat: 'surface', color: '#FDD835', description: 'Striped and feisty. A favorite in northern lakes.' },
  { id: 'neon_tetra',        name: 'Neon Tetra',             emoji: '🐠', rarity: 'uncommon',  habitat: 'surface', color: '#29B6F6', description: 'Electric blue and pink. Glows like a neon sign.' },
  { id: 'clownfish',         name: 'Clownfish',              emoji: '🐠', rarity: 'uncommon',  habitat: 'floor',   color: '#FF7043', description: 'Bold orange and white. Loves its anemone home.' },
  { id: 'surgeonfish',       name: 'Surgeonfish',            emoji: '🐠', rarity: 'uncommon',  habitat: 'surface', color: '#29B6F6', description: 'Named for the sharp spine near its tail. Handle with care.' },
  { id: 'yellow_tang',       name: 'Yellow Tang',            emoji: '🐠', rarity: 'uncommon',  habitat: 'floor',   color: '#FDD835', description: 'Bright yellow and flat. A reef staple.' },
  { id: 'flounder',          name: 'Flounder',               emoji: '🐟', rarity: 'uncommon',  habitat: 'floor',   color: '#A5D6A7', description: 'Both eyes on one side. Lies in wait on the seabed.' },
  { id: 'jellyfish',         name: 'Jellyfish',              emoji: '🪼', rarity: 'uncommon',  habitat: 'surface', color: '#CE93D8', description: 'Drifts with the current. No brain, no problem.' },
  { id: 'crab_dungeness',    name: 'Dungeness Crab',         emoji: '🦀', rarity: 'uncommon',  habitat: 'floor',   color: '#FF7043', description: 'A West Coast favorite. Meaty claws, armored shell.' },
  { id: 'coral',             name: 'Coral',                  emoji: '🪸', rarity: 'uncommon',  habitat: 'floor',   color: '#FF8A65', description: 'Not a fish, but a whole living colony.' },
  { id: 'seashell',          name: 'Seashell',               emoji: '🐚', rarity: 'uncommon',  habitat: 'floor',   color: '#FFCC80', description: 'Empty now, but once a home to something small.' },
  { id: 'sand_dollar',       name: 'Sand Dollar',            emoji: '⭕', rarity: 'uncommon',  habitat: 'floor',   color: '#F5F5DC', description: 'Flat, pale, and perfectly round. A beach treasure.' },
  // ── Rare ────────────────────────────────────────────────
  { id: 'carp',              name: 'Carp',                   emoji: '🐟', rarity: 'rare',      habitat: 'surface', color: '#FF8A65', description: 'Ancient and stubborn. Grows enormous in still water.' },
  { id: 'rainbow_trout',     name: 'Rainbow Trout',          emoji: '🐟', rarity: 'rare',      habitat: 'surface', color: '#EC407A', description: 'Iridescent flanks, cold-water spirit. A prized catch.' },
  { id: 'salmon',            name: 'Salmon',                 emoji: '🐟', rarity: 'rare',      habitat: 'surface', color: '#FF7043', description: 'Swims upstream against all odds. A symbol of persistence.' },
  { id: 'angelfish',         name: 'Angelfish',              emoji: '🐠', rarity: 'rare',      habitat: 'surface', color: '#66BB6A', description: 'Tall, graceful fins. Glides through freshwater like silk.' },
  { id: 'seahorse',          name: 'Seahorse',               emoji: '🐡', rarity: 'rare',      habitat: 'floor',   color: '#80DEEA', description: 'Drifts on ocean currents. Fathers carry the young.' },
  { id: 'pufferfish',        name: 'Pufferfish',             emoji: '🐡', rarity: 'rare',      habitat: 'floor',   color: '#FFF176', description: 'Inflates when threatened. Cute until it isn\'t.' },
  { id: 'blue_groper',       name: 'Blue Groper',            emoji: '🐠', rarity: 'rare',      habitat: 'floor',   color: '#42A5F5', description: 'A hefty reef fish with bold blue coloring.' },
  { id: 'napoleon_wrasse',   name: 'Napoleon Wrasse',        emoji: '🐠', rarity: 'rare',      habitat: 'floor',   color: '#5C6BC0', description: 'Enormous lips and a humped forehead. Hard to miss.' },
  { id: 'tuna',              name: 'Tuna',                   emoji: '🐟', rarity: 'rare',      habitat: 'surface', color: '#42A5F5', description: 'Built for speed. One of the ocean\'s apex swimmers.' },
  { id: 'lure',              name: 'Lure',                   emoji: '🎣', rarity: 'trash',     habitat: 'surface', color: '#FFD54F', description: 'Lost by a fisherman. Now it fishes for you.' },
  // ── Epic ────────────────────────────────────────────────
  { id: 'arowana',           name: 'Arowana',                emoji: '🐉', rarity: 'epic',      habitat: 'surface', color: '#FFD700', description: 'Dragon fish of the tropics. Leaps to catch prey mid-air.' },
  { id: 'purple_tang',       name: 'Purple Tang',            emoji: '🐠', rarity: 'epic',      habitat: 'floor',   color: '#9C27B0', description: 'Deep violet with a bright tail. Rare on any reef.' },
  { id: 'blue_angelfish',    name: 'Blue Angelfish',         emoji: '🐠', rarity: 'epic',      habitat: 'floor',   color: '#1E88E5', description: 'Vivid blue stripes on a saltwater angel. Stunning.' },
  { id: 'moray_eel',         name: 'Moray Eel',              emoji: '🐍', rarity: 'epic',      habitat: 'depths',  color: '#4CAF50', description: "Lurks in crevices with a permanent scowl. Don't reach in." },
  { id: 'ribbon_eel',        name: 'Ribbon Eel',             emoji: '🐍', rarity: 'epic',      habitat: 'depths',  color: '#1565C0', description: 'Paper-thin and electric blue. Moves like a ribbon in wind.' },
  { id: 'stingray',          name: 'Stingray',               emoji: '🐟', rarity: 'epic',      habitat: 'depths',  color: '#546E7A', description: 'Glides like a shadow. The barb is for defense only.' },
  { id: 'anglerfish',        name: 'Anglerfish',             emoji: '🐡', rarity: 'epic',      habitat: 'depths',  color: '#37474F', description: 'Lures prey with its own built-in light. Deep sea nightmare.' },
  { id: 'upside_down_jellyfish', name: 'Upside-Down Jellyfish', emoji: '🪼', rarity: 'epic',  habitat: 'depths',  color: '#80CBC4', description: 'Rests on the seafloor, tentacles facing up. Highly unusual.' },
  { id: 'pearl',             name: 'Pearl',                  emoji: '⚪', rarity: 'epic',      habitat: 'depths',  color: '#F5F5F5', description: 'Formed over years inside a mollusk. Perfectly smooth.' },
  // ── Legendary ───────────────────────────────────────────
  { id: 'otter',             name: 'River Otter',            emoji: '🦦', rarity: 'legendary', habitat: 'surface', color: '#8D6E63', description: 'Your loyal companion from the very beginning. Followed you here.' },
  { id: 'crab_blue',         name: 'Blue Crab',              emoji: '🦀', rarity: 'legendary', habitat: 'floor',   color: '#1E88E5', description: 'Iridescent blue claws. Rare and striking in the wild.' },
  { id: 'crab_king',         name: 'King Crab',              emoji: '🦀', rarity: 'legendary', habitat: 'depths',  color: '#E53935', description: 'The largest crab in the sea. A legend among fishermen.' },
  { id: 'great_white_shark', name: 'Great White Shark',      emoji: '🦈', rarity: 'legendary', habitat: 'depths',  color: '#546E7A', description: 'The apex predator. Ancient, powerful, and feared.' },
];

// Biome → species mapping (used for unlock checks and roll filtering)
export const BIOME_SPECIES: Record<BiomeKey, readonly string[]> = {
  shallows:   ['worm', 'apple_core', 'bottle', 'lure', 'goldfish', 'guppy', 'bluegill', 'otter'],
  open_water: ['silverjaw_minnow', 'tadpole', 'anchovy', 'bass', 'yellow_perch', 'neon_tetra', 'surgeonfish'],
  coral_reef: ['jellyfish', 'carp', 'rainbow_trout', 'salmon', 'angelfish', 'tuna', 'arowana'],
  sandy_bed:  ['rusty_can', 'seaweed', 'mussel', 'goby', 'shrimp', 'starfish', 'catfish'],
  shipwreck:  ['clownfish', 'yellow_tang', 'flounder', 'crab_dungeness', 'coral', 'seashell', 'sand_dollar'],
  deep_reef:  ['seahorse', 'pufferfish', 'blue_groper', 'napoleon_wrasse', 'purple_tang', 'blue_angelfish', 'crab_blue'],
  abyss:      ['ribbon_eel', 'anglerfish', 'pearl', 'crab_king', 'great_white_shark', 'moray_eel', 'stingray', 'upside_down_jellyfish'],
};

/** Compute which biomes are currently unlocked based on owned fish. */
export function computeUnlockedBiomes(ownedFish: OwnedFish[]): Set<BiomeKey> {
  const ownedIds = new Set(ownedFish.map((f) => f.speciesId));

  const uniqueSurface = FISH_SPECIES.filter(
    (f) => f.habitat === 'surface' && f.id !== 'otter' && ownedIds.has(f.id),
  ).length;

  const uniqueFloor = FISH_SPECIES.filter(
    (f) => f.habitat === 'floor' && ownedIds.has(f.id),
  ).length;

  const uniqueTotal = ownedIds.size;

  const unlocked = new Set<BiomeKey>(['shallows']); // always unlocked

  if (uniqueSurface >= 2) unlocked.add('open_water');
  if (uniqueSurface >= 4) unlocked.add('coral_reef');
  if (uniqueSurface >= 6) {
    unlocked.add('sandy_bed');
    if (uniqueTotal >= 14) unlocked.add('shipwreck');
    if (uniqueTotal >= 16) unlocked.add('deep_reef');
  }
  if (uniqueFloor >= 10) unlocked.add('abyss');

  return unlocked;
}

// Otter is exclusive to the starter egg — never appears in random rolls
const ROLLABLE = FISH_SPECIES.filter((f) => f.id !== 'otter');

export function rollFishSpecies(allowedSpeciesIds?: Set<string>): FishSpecies {
  const pool = allowedSpeciesIds
    ? ROLLABLE.filter((f) => allowedSpeciesIds.has(f.id))
    : ROLLABLE;

  const available = (pool.length > 0 ? pool : ROLLABLE);

  const availableRarities = (Object.keys(RARITY_WEIGHTS) as FishRarity[]).filter(
    (r) => available.some((f) => f.rarity === r),
  );

  const total = availableRarities.reduce((sum, r) => sum + RARITY_WEIGHTS[r], 0);
  let roll = Math.random() * total;
  let chosenRarity: FishRarity = availableRarities[0];
  for (const rarity of availableRarities) {
    roll -= RARITY_WEIGHTS[rarity];
    if (roll <= 0) { chosenRarity = rarity; break; }
  }

  const rarityPool = available.filter((f) => f.rarity === chosenRarity);
  return rarityPool[Math.floor(Math.random() * rarityPool.length)];
}
