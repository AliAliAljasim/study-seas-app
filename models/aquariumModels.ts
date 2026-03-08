export type FishRarity = 'trash' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type FishHabitat = 'surface' | 'floor' | 'depths';

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
  { id: 'crab_blue',         name: 'Blue Crab',              emoji: '🦀', rarity: 'legendary', habitat: 'floor',   color: '#1E88E5', description: 'Iridescent blue claws. Rare and striking in the wild.' },
  { id: 'crab_king',         name: 'King Crab',              emoji: '🦀', rarity: 'legendary', habitat: 'depths',  color: '#E53935', description: 'The largest crab in the sea. A legend among fishermen.' },
  { id: 'great_white_shark', name: 'Great White Shark',      emoji: '🦈', rarity: 'legendary', habitat: 'depths',  color: '#546E7A', description: 'The apex predator. Ancient, powerful, and feared.' },
];

export function rollFishSpecies(): FishSpecies {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  let chosenRarity: FishRarity = 'common';
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS) as [FishRarity, number][]) {
    roll -= weight;
    if (roll <= 0) { chosenRarity = rarity; break; }
  }
  const pool = FISH_SPECIES.filter((f) => f.rarity === chosenRarity);
  return pool[Math.floor(Math.random() * pool.length)];
}
