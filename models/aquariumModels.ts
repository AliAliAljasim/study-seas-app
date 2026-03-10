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
  journal?: string;
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
  { id: 'worm',              name: 'Worm',                   emoji: '🪱', rarity: 'trash',     habitat: 'surface', color: '#A1887F', description: 'Wriggling bait. Nothing more, nothing less.',
    journal: 'Earthworms (Lumbricus terrestris) are the most widely used fishing bait in the world. They contain tiny bristles called setae that grip soil as they burrow, sometimes reaching depths of 2 meters. Charles Darwin spent 40 years studying earthworms and concluded they were among the most important animals on Earth for soil health.' },
  { id: 'rusty_can',         name: 'Rusty Can',              emoji: '🥫', rarity: 'trash',     habitat: 'floor',   color: '#8D6E63', description: 'An old can lost to the depths. Not a trophy.',
    journal: 'Steel cans take 50–100 years to decompose in saltwater as iron slowly oxidizes into iron(III) oxide — rust. The process accelerates in salt water due to electrolytic corrosion. Abandoned cans on the ocean floor are sometimes colonized by tube worms and barnacles, becoming accidental artificial reefs.' },
  { id: 'apple_core',        name: 'Apple Core',             emoji: '🍎', rarity: 'trash',     habitat: 'surface', color: '#EF9A9A', description: "Someone's litter. The fish aren't impressed either.",
    journal: 'Apple seeds contain amygdalin, a compound that releases small amounts of hydrogen cyanide when digested. A human would need to chew hundreds of seeds for a toxic dose. Fortunately, fruit cores decompose within weeks in water, and the seeds may sprout along riverbanks — an accidental form of seed dispersal.' },
  { id: 'bottle',            name: 'Bottle',                 emoji: '🍶', rarity: 'trash',     habitat: 'surface', color: '#80CBC4', description: "A message inside... just kidding, it's empty.",
    journal: 'Glass takes over 1 million years to fully decompose in nature — it simply erodes into smaller and smaller shards called microplastics. The oldest message-in-a-bottle on record was found in Australia in 2018, sent from a German research ship in 1886. It had drifted for 131 years and 7 months.' },
  { id: 'seaweed',           name: 'Seaweed',                emoji: '🌿', rarity: 'trash',     habitat: 'floor',   color: '#388E3C', description: 'Tangles the line every time. Part of the experience.',
    journal: 'Giant kelp (Macrocystis pyrifera) is one of the fastest-growing organisms on Earth, reaching up to 60 cm per day and forming underwater forests over 45 meters tall. Kelp forests support thousands of species and sequester vast amounts of carbon. Carrageenan, extracted from red seaweed, is found in ice cream, toothpaste, and baby formula.' },
  // ── Common ──────────────────────────────────────────────
  { id: 'goldfish',          name: 'Goldfish',               emoji: '🐟', rarity: 'common',    habitat: 'surface', color: '#FFA726', description: 'A classic aquarium fish. Round and cheerful.',
    journal: 'Goldfish (Carassius auratus) were first domesticated in Tang Dynasty China over 1,000 years ago, selectively bred from wild grey-green carp. The famous "3-second memory" myth is false — studies show goldfish can remember things for months and can even be trained to perform tricks. The oldest pet goldfish on record, named Tish, lived 43 years.' },
  { id: 'guppy',             name: 'Guppy',                  emoji: '🐟', rarity: 'common',    habitat: 'surface', color: '#AB47BC', description: 'Tiny but colorful. Found in nearly every freshwater tank.',
    journal: 'Guppies (Poecilia reticulata) are native to Trinidad and Venezuela and are one of the most studied fish in evolutionary biology. They are livebearers — females give birth to up to 200 live fry per pregnancy — and can store sperm for months. Named after Robert John Lechmere Guppy, who sent specimens to the British Museum in 1866. They were also used in some countries to control mosquito larvae.' },
  { id: 'bluegill',          name: 'Bluegill',               emoji: '🐟', rarity: 'common',    habitat: 'surface', color: '#29B6F6', description: 'A sunfish with a cheerful blue-tinted gill cover.',
    journal: 'Bluegill (Lepomis macrochirus) are the most commonly caught freshwater fish in North America. The iridescent blue patch on their gill cover gives them their name. Males build and vigorously guard circular nests on the lake bottom, fanning the eggs with their fins to keep them oxygenated. They can live up to 10 years and are a critical part of the food web, eaten by bass, herons, and otters.' },
  { id: 'silverjaw_minnow',  name: 'Silverjaw Minnow',       emoji: '🐟', rarity: 'common',    habitat: 'surface', color: '#B0BEC5', description: 'A small schooling fish with a silvery sheen.',
    journal: 'Silverjaw minnows (Notropis buccatus) are native to the eastern United States, found in clear, sandy streams. Their distinctively enlarged lower jaw helps them feed on insects at the water surface with precision. Like most minnows, they produce alarm pheromones — when injured, they release a chemical that causes nearby fish to scatter immediately, a behavior discovered by Karl von Frisch in the 1930s.' },
  { id: 'tadpole',           name: 'Tadpole',                emoji: '🐸', rarity: 'common',    habitat: 'surface', color: '#66BB6A', description: 'A frog-in-progress. Wriggles through murky shallows.',
    journal: 'Tadpoles are the aquatic larval stage of frogs and toads (order Anura). They breathe through internal gills and feed primarily on algae. Metamorphosis — the transformation into a frog — is triggered by thyroid hormones and takes 6–12 weeks depending on the species and temperature. During this process, the animal regrows nearly every organ. The word "tadpole" comes from Middle English tode-pol, meaning "toad-head."' },
  { id: 'mussel',            name: 'Mussel',                 emoji: '🐚', rarity: 'common',    habitat: 'floor',   color: '#5C6BC0', description: 'Clings to rocks with strong threads. Filters the water clean.',
    journal: 'Blue mussels (Mytilus edulis) can filter up to 65 liters of water per day, removing phytoplankton and suspended particles. They anchor themselves to surfaces using byssal threads — protein fibers so strong that engineers have studied them for water-resistant adhesives. In the 2000s, mussel-inspired synthetic adhesives were developed for use in wet surgical conditions. Mussels are farmed extensively and are one of the most sustainably produced foods in the world.' },
  { id: 'anchovy',           name: 'Anchovy',                emoji: '🐟', rarity: 'common',    habitat: 'surface', color: '#90A4AE', description: 'Small, silvery, and abundant. Schools by the million.',
    journal: 'Anchovies (family Engraulidae) form enormous schools of millions and are a keystone species in marine ecosystems — eaten by tuna, dolphins, seabirds, and whales. Ancient Romans fermented anchovies into a condiment called garum, their equivalent of ketchup, used in virtually every dish. The Peruvian anchovy fishery is the largest single-species fishery in the world by weight.' },
  { id: 'goby',              name: 'Goby',                   emoji: '🐟', rarity: 'common',    habitat: 'floor',   color: '#A5D6A7', description: 'A tiny bottom-hugger with big, watchful eyes.',
    journal: 'Gobies (family Gobiidae) form one of the largest fish families with over 2,000 species. They have fused pelvic fins that act as a suction cup, letting them cling to rocks in strong currents. The dwarf pygmy goby (Eviota sigillata) lives only 59 days — one of the shortest lifespans of any vertebrate. Some goby species form remarkable partnerships with blind shrimp, acting as a lookout in exchange for shelter in the shrimp\'s burrow.' },
  { id: 'shrimp',            name: 'Shrimp',                 emoji: '🦐', rarity: 'common',    habitat: 'floor',   color: '#FFAB91', description: 'Scuttles backwards through coral and reef.',
    journal: 'Shrimp belong to the order Decapoda ("ten-footed") and have blue blood, colored by hemocyanin — a copper-based oxygen carrier, unlike the iron-based hemoglobin of vertebrates. The mantis shrimp (Stomatopoda) is not a true shrimp but can punch with the force of a rifle bullet — fast enough to boil water in its wake through cavitation. True cleaner shrimp set up "cleaning stations" on reefs where fish queue up to have parasites removed.' },
  { id: 'starfish',          name: 'Starfish',               emoji: '⭐', rarity: 'common',    habitat: 'floor',   color: '#FF7043', description: 'Five arms, infinite patience. Moves slower than it looks.',
    journal: 'Sea stars (class Asteroidea) are not fish at all — they are echinoderms, more closely related to sea urchins. They have no brain or blood, using seawater pumped through a hydraulic vascular system to move and feed. Their stomach can emerge from their body to digest prey externally. Some species can regenerate an entire body from a single severed arm. Scientists have renamed them "sea stars" since the early 2000s to avoid confusion.' },
  // ── Uncommon ────────────────────────────────────────────
  { id: 'bass',              name: 'Bass',                   emoji: '🐟', rarity: 'uncommon',  habitat: 'surface', color: '#66BB6A', description: 'A feisty freshwater fighter. Popular with anglers.',
    journal: 'Largemouth bass (Micropterus salmoides) are the most popular sport fish in North America, with a multi-billion-dollar recreational fishing industry built around them. They can open their mouths wide enough to swallow prey nearly half their own body size. The world record largemouth bass weighed 10.1 kg and was caught in Lake Biwa, Japan in 2009 — tied with a 1932 Georgia record. Bass have been introduced worldwide, sometimes with devastating effects on native fish populations.' },
  { id: 'catfish',           name: 'Catfish',                emoji: '🐟', rarity: 'uncommon',  habitat: 'floor',   color: '#8D6E63', description: 'Whiskers down, belly flat. Rules the river bottom.',
    journal: 'Catfish (order Siluriformes) comprise over 3,600 species — about 10% of all fish species. Their entire body surface is covered in taste buds, making them essentially a swimming tongue. The Mekong giant catfish (Pangasianodon gigas) can reach 3 meters and 300 kg, making it one of the largest freshwater fish. Wels catfish in European rivers have been documented emerging from water to grab pigeons on riverbanks.' },
  { id: 'yellow_perch',      name: 'Yellow Perch',           emoji: '🐟', rarity: 'uncommon',  habitat: 'surface', color: '#FDD835', description: 'Striped and feisty. A favorite in northern lakes.',
    journal: 'Yellow perch (Perca flavescens) are widely distributed across northern North America and are commercially important in the Great Lakes. Their distinctive dark vertical stripes serve as disruptive camouflage in weedy shallows. They are highly social, forming schools by size — each fish prefers to be near others of similar length. Their roe sacks are considered a delicacy in the Great Lakes region.' },
  { id: 'neon_tetra',        name: 'Neon Tetra',             emoji: '🐠', rarity: 'uncommon',  habitat: 'surface', color: '#29B6F6', description: 'Electric blue and pink. Glows like a neon sign.',
    journal: 'Neon tetras (Paracheirodon innesi) are one of the most popular aquarium fish in the world — over 1.5 million are sold in the US every week. Their iridescent blue-green stripe is produced not by pigment but by light-reflecting cells called iridocytes, making the color structural rather than chemical. At night or when stressed, the stripe fades. They were first discovered in the Peruvian Amazon in 1934 and caused a sensation in the aquarium hobby.' },
  { id: 'clownfish',         name: 'Clownfish',              emoji: '🐠', rarity: 'uncommon',  habitat: 'floor',   color: '#FF7043', description: 'Bold orange and white. Loves its anemone home.',
    journal: 'Clownfish (subfamily Amphiprioninae) are sequential hermaphrodites: all individuals are born male. The dominant fish in any group becomes female. They live in mutualistic relationships with sea anemones, protected by a coating of mucus that prevents the anemone\'s stinging cells from firing. Clownfish were made globally famous by the 2003 Pixar film Finding Nemo — ironically, the film\'s plot could never happen in nature, as Marlin would have become female after Coral died.' },
  { id: 'surgeonfish',       name: 'Surgeonfish',            emoji: '🐠', rarity: 'uncommon',  habitat: 'surface', color: '#29B6F6', description: 'Named for the sharp spine near its tail. Handle with care.',
    journal: 'Surgeonfish (family Acanthuridae) have razor-sharp retractable spines near their tails called "scalpels" or "lancets," used for defense. The blue tang (Paracanthurus hepatus) — the species Dory is based on in Finding Nemo and Finding Dory — is a real Indo-Pacific surgeonfish. After the 2016 Finding Dory release, demand for blue tangs at pet stores surged, raising concerns about reef impacts since they cannot be captive-bred at scale.' },
  { id: 'yellow_tang',       name: 'Yellow Tang',            emoji: '🐠', rarity: 'uncommon',  habitat: 'floor',   color: '#FDD835', description: 'Bright yellow and flat. A reef staple.',
    journal: 'Yellow tang (Zebrasoma flavescens) are found almost exclusively around Hawaii, where they are the most abundant reef fish. They graze on filamentous algae all day, performing a vital reef maintenance role. At night, their vivid yellow fades and a brown stripe appears — believed to be a camouflage adaptation during sleep. They were the first marine fish to be commercially bred in captivity, a breakthrough announced in 2015 at the University of Hawaii.' },
  { id: 'flounder',          name: 'Flounder',               emoji: '🐟', rarity: 'uncommon',  habitat: 'floor',   color: '#A5D6A7', description: 'Both eyes on one side. Lies in wait on the seabed.',
    journal: 'Flounders (order Pleuronectiformes) begin life as normal upright fish with one eye on each side. As larvae, one eye migrates across the skull so both end up on the same side — a remarkable metamorphosis driven by a burst of thyroid hormone. This lets them lie flat on the seabed and still see clearly. They can change their skin pattern to match the seafloor in less than 2 seconds, one of the best camouflage abilities in the ocean.' },
  { id: 'jellyfish',         name: 'Jellyfish',              emoji: '🪼', rarity: 'uncommon',  habitat: 'surface', color: '#CE93D8', description: 'Drifts with the current. No brain, no problem.',
    journal: 'Jellyfish (class Scyphozoa) have existed for over 500 million years, predating dinosaurs by 250 million years. They are 95% water and have no brain, heart, or bones — only a simple nerve net. The immortal jellyfish (Turritopsis dohrnii) can biologically revert to its juvenile polyp state after reaching adulthood and repeat the process indefinitely, making it theoretically immortal. Jellyfish blooms have been increasing globally, partly due to ocean warming and overfishing of their natural predators.' },
  { id: 'crab_dungeness',    name: 'Dungeness Crab',         emoji: '🦀', rarity: 'uncommon',  habitat: 'floor',   color: '#FF7043', description: 'A West Coast favorite. Meaty claws, armored shell.',
    journal: 'Dungeness crab (Metacarcinus magister) are named after Dungeness, Washington, where commercial harvesting began in the late 1800s. They are the most commercially valuable crab fishery on the US West Coast, worth over $220 million annually. To grow, they must molt their entire rigid exoskeleton — during the soft-shell phase they are vulnerable to predators. They can live up to 13 years and migrate seasonally between shallow and deep water.' },
  { id: 'coral',             name: 'Coral',                  emoji: '🪸', rarity: 'uncommon',  habitat: 'floor',   color: '#FF8A65', description: 'Not a fish, but a whole living colony.',
    journal: 'Corals are animals — colonies of tiny polyps — not plants or rocks. Each polyp secretes a calcium carbonate skeleton, building reef structures over thousands of years. They have a symbiotic relationship with photosynthetic algae (zooxanthellae) that live inside their tissues and provide up to 90% of the coral\'s energy. The Great Barrier Reef, the largest living structure on Earth and visible from space, is under threat from warming oceans causing mass bleaching events.' },
  { id: 'seashell',          name: 'Seashell',               emoji: '🐚', rarity: 'uncommon',  habitat: 'floor',   color: '#FFCC80', description: 'Empty now, but once a home to something small.',
    journal: 'Mollusk shells are built by secreting calcium carbonate — the same material as chalk and limestone. The direction a shell spirals is genetically determined: nearly all coil clockwise (dextral), and left-spiraling (sinistral) shells are extremely rare and highly valued by collectors. The giant clam (Tridacna gigas) grows the largest shell of any bivalve, reaching 1.2 meters and 250 kg. Shells have served as currency, tools, instruments, and jewelry across human cultures for 100,000 years.' },
  { id: 'sand_dollar',       name: 'Sand Dollar',            emoji: '⭕', rarity: 'uncommon',  habitat: 'floor',   color: '#F5F5DC', description: 'Flat, pale, and perfectly round. A beach treasure.',
    journal: 'Sand dollars (order Clypeasteroida) are echinoderms, closely related to sea urchins. The smooth white disk people find on beaches is actually the bleached skeleton (test) of a dead animal. Living sand dollars are covered in dense purple spines and tiny tube feet. The "petals" etched on their surface are actually pores used for gas exchange. They move through sand using coordinated spine movements and can burrow completely in minutes.' },
  // ── Rare ────────────────────────────────────────────────
  { id: 'carp',              name: 'Carp',                   emoji: '🐟', rarity: 'rare',      habitat: 'surface', color: '#FF8A65', description: 'Ancient and stubborn. Grows enormous in still water.',
    journal: 'Common carp (Cyprinus carpio) were among the first fish domesticated by humans, over 2,000 years ago in China. Koi are a selectively bred ornamental variety. The oldest recorded individual fish was Hanako, a koi in Japan who died in 1977 at an estimated age of 226 years — determined by examining growth rings in her scales. Introduced carp are considered invasive in North America and Australia, disrupting native ecosystems by uprooting aquatic plants.' },
  { id: 'rainbow_trout',     name: 'Rainbow Trout',          emoji: '🐟', rarity: 'rare',      habitat: 'surface', color: '#EC407A', description: 'Iridescent flanks, cold-water spirit. A prized catch.',
    journal: 'Rainbow trout (Oncorhynchus mykiss) are native to cold Pacific coast rivers of North America and are one of the most studied fish in the world, used extensively in biological and toxicology research. Their iridescent pink lateral stripe is produced by light-refracting skin cells. The sea-run form — called steelhead — migrates to the ocean and back. Rainbow trout were the first fish to have their complete genome sequenced, in 2014.' },
  { id: 'salmon',            name: 'Salmon',                 emoji: '🐟', rarity: 'rare',      habitat: 'surface', color: '#FF7043', description: 'Swims upstream against all odds. A symbol of persistence.',
    journal: 'Pacific salmon (genus Oncorhynchus) are anadromous — born in freshwater, spending years in the ocean, then navigating back to their exact birth stream to spawn and die. They navigate using Earth\'s magnetic field and an extraordinary sense of smell, detecting their home stream\'s unique chemical signature diluted to one part per billion. After spawning, their decomposing bodies fertilize surrounding forests with marine nutrients — over 70 species, including bears, eagles, and trees, depend on this cycle.' },
  { id: 'angelfish',         name: 'Angelfish',              emoji: '🐠', rarity: 'rare',      habitat: 'surface', color: '#66BB6A', description: 'Tall, graceful fins. Glides through freshwater like silk.',
    journal: 'Freshwater angelfish (Pterophyllum scalare) are native to the Amazon, Orinoco, and Essequibo river basins of South America. Their tall, laterally compressed bodies let them maneuver through dense flooded vegetation and hide among vertical roots. They were first brought to Europe around 1909 and became one of the earliest widely kept aquarium fish. In the wild, angelfish form monogamous pairs and both parents guard eggs and fry, fanning them with their fins and moving them if danger approaches.' },
  { id: 'seahorse',          name: 'Seahorse',               emoji: '🐡', rarity: 'rare',      habitat: 'floor',   color: '#80DEEA', description: 'Drifts on ocean currents. Fathers carry the young.',
    journal: 'Seahorses (genus Hippocampus) are the only fish where males become pregnant. The female deposits eggs into a specialized pouch on the male\'s abdomen, where he fertilizes them and gestates up to 2,000 young for 10–25 days. Seahorses mate for life and perform an elaborate courtship dance each morning, linking tails, mirroring each other\'s movements, and changing colors together. They are the slowest fish in the ocean, moving by fluttering a dorsal fin up to 70 times per second.' },
  { id: 'pufferfish',        name: 'Pufferfish',             emoji: '🐡', rarity: 'rare',      habitat: 'floor',   color: '#FFF176', description: "Inflates when threatened. Cute until it isn't.",
    journal: 'Pufferfish (family Tetraodontidae) contain tetrodotoxin (TTX), one of the most potent neurotoxins known — up to 1,200 times more toxic than cyanide, with no known antidote. The toxin is produced by symbiotic bacteria, not the fish itself. In Japan, pufferfish (fugu) is a regulated delicacy prepared only by chefs who train 3+ years and pass a licensing exam. Pufferfish males create intricate geometric "crop circle" patterns on the seabed to attract females — discovered off Japan in 2011.' },
  { id: 'blue_groper',       name: 'Blue Groper',            emoji: '🐠', rarity: 'rare',      habitat: 'floor',   color: '#42A5F5', description: 'A hefty reef fish with bold blue coloring.',
    journal: 'Eastern blue groper (Achoerodus viridis) are a protected species in New South Wales, Australia, beloved for their bold curiosity toward divers. They are sequential protogynous hermaphrodites — all individuals are born female, and dominant individuals become male, turning the signature electric blue. They can grow to 1 meter and live over 35 years. They crush mollusks with powerful pharyngeal teeth and are considered a keystone species for controlling sea urchin populations on NSW reefs.' },
  { id: 'napoleon_wrasse',   name: 'Napoleon Wrasse',        emoji: '🐠', rarity: 'rare',      habitat: 'floor',   color: '#5C6BC0', description: 'Enormous lips and a humped forehead. Hard to miss.',
    journal: 'The humphead wrasse (Cheilinus undulatus) — also called Napoleon or Maori wrasse — is one of the largest coral reef fish, reaching 2.3 meters and 190 kg. The distinctive hump on its forehead, called a cephalic hump, grows larger with age. It is one of few fish that can eat the toxic crown-of-thorns starfish and the box jellyfish, making it a critical reef predator. Listed as Endangered on the IUCN Red List due to overfishing for the live reef fish food trade in Southeast Asia.' },
  { id: 'tuna',              name: 'Tuna',                   emoji: '🐟', rarity: 'rare',      habitat: 'surface', color: '#42A5F5', description: "Built for speed. One of the ocean's apex swimmers.",
    journal: 'Bluefin tuna (Thunnus thynnus) are among the fastest fish in the ocean, reaching 70 km/h using their crescent-shaped tail. Uniquely for fish, they are warm-blooded — a countercurrent heat exchange system keeps their muscles 10°C warmer than the surrounding water, enabling sustained high-speed swimming in cold oceans. A single Pacific bluefin tuna sold at Tokyo\'s Toyosu fish market in January 2019 for ¥333.6 million ($3.1 million USD) — the highest price ever paid for a fish.' },
  { id: 'lure',              name: 'Lure',                   emoji: '🎣', rarity: 'trash',     habitat: 'surface', color: '#FFD54F', description: 'Lost by a fisherman. Now it fishes for you.',
    journal: 'Fishing lures are designed to mimic the movement, color, and vibration of prey. The oldest known artificial fishing lure was carved from bone and found at a Neolithic site in Switzerland, over 8,000 years old. The bass lure industry alone in the US is worth over $700 million annually. Deep-sea anglerfish use a bioluminescent lure that grows directly from their forehead — the original fishing rod, evolved over millions of years.' },
  // ── Epic ────────────────────────────────────────────────
  { id: 'arowana',           name: 'Arowana',                emoji: '🐉', rarity: 'epic',      habitat: 'surface', color: '#FFD700', description: 'Dragon fish of the tropics. Leaps to catch prey mid-air.',
    journal: 'Arowanas (family Osteoglossidae) are living fossils — their lineage dates back 220 million years to the Triassic period. The Asian arowana (Scleropages formosus) is the most expensive aquarium fish in the world, with rare red specimens selling for over $300,000 due to their revered status in Chinese culture as "dragon fish" (longyu), believed to bring wealth and good luck. They can leap over 3 meters out of the water to snatch insects, lizards, and even small birds from overhanging branches.' },
  { id: 'purple_tang',       name: 'Purple Tang',            emoji: '🐠', rarity: 'epic',      habitat: 'floor',   color: '#9C27B0', description: 'Deep violet with a bright tail. Rare on any reef.',
    journal: 'Purple tangs (Zebrasoma xanthurum) are found in the Red Sea, Arabian Sea, and Gulf of Aden — a relatively restricted range compared to most reef fish. Their vivid coloration comes from true pigment, unlike many reef fish whose colors are structural. They are highly territorial and one of the most aggressive tang species, often claiming large territories on the reef. Unusually, they retain their intense purple color even under anesthesia, suggesting it has a constant physiological function beyond signaling.' },
  { id: 'blue_angelfish',    name: 'Blue Angelfish',         emoji: '🐠', rarity: 'epic',      habitat: 'floor',   color: '#1E88E5', description: 'Vivid blue stripes on a saltwater angel. Stunning.',
    journal: 'The blue angelfish (Holacanthus bermudensis) is found in the Western Atlantic and Gulf of Mexico around rocky reefs and coral. Juveniles look entirely different from adults — dark blue with curved white and blue vertical stripes, serving as protective mimicry. The transformation from juvenile to adult coloration happens gradually over about a year. They can hybridize naturally with queen angelfish (Holacanthus ciliaris), producing offspring with intermediate markings — one of the best-documented natural fish hybrids.' },
  { id: 'moray_eel',         name: 'Moray Eel',              emoji: '🐍', rarity: 'epic',      habitat: 'depths',  color: '#4CAF50', description: "Lurks in crevices with a permanent scowl. Don't reach in.",
    journal: 'Moray eels (family Muraenidae) have a second set of jaws — pharyngeal jaws — that sit in their throat and shoot forward into the mouth to grip and pull prey back into the esophagus, like the monster in Alien. Their constant open-mouthed "scowl" is just how they breathe — pumping water over their gills. Green moray eels look green because of a yellow mucus coating over their blue-grey skin. Some species have been documented cooperating with groupers to hunt prey from hiding spots.' },
  { id: 'ribbon_eel',        name: 'Ribbon Eel',             emoji: '🐍', rarity: 'epic',      habitat: 'depths',  color: '#1565C0', description: 'Paper-thin and electric blue. Moves like a ribbon in wind.',
    journal: 'Ribbon eels (Rhinomuraena quaesita) are the most colorful of all moray eels and undergo a dramatic sex change during their lives. All individuals begin as jet black males, then transition to brilliant electric blue as they mature, and finally turn yellow when they become female. The transformation between each phase involves a complete change in coloration. Their elaborate, frilly nostrils help them detect chemical signals in the water and are one of the most distinctive features of any reef fish.' },
  { id: 'stingray',          name: 'Stingray',               emoji: '🐟', rarity: 'epic',      habitat: 'depths',  color: '#546E7A', description: 'Glides like a shadow. The barb is for defense only.',
    journal: 'Stingrays (order Myliobatiformes) are closely related to sharks, sharing cartilaginous skeletons. They navigate and hunt using electroreception — sensing the weak electric fields produced by buried prey\'s muscle contractions. Their venomous barb is made of modified dermal denticles and is purely defensive. Steve Irwin ("The Crocodile Hunter") died from a stingray barb to the heart in 2006, an extraordinarily rare accident — stingrays normally only sting when stepped on or threatened.' },
  { id: 'anglerfish',        name: 'Anglerfish',             emoji: '🐡', rarity: 'epic',      habitat: 'depths',  color: '#37474F', description: 'Lures prey with its own built-in light. Deep sea nightmare.',
    journal: 'Deep-sea anglerfish (order Lophiiformes) live in the midnight zone at 200–2,000 m depth. Their glowing lure (esca) is powered by bioluminescent bacteria living in a mutualistic relationship. In some species, the tiny males (1/10 the size of females) permanently fuse onto the female\'s body when they find one — their circulatory systems merge, and the male becomes essentially a sperm-producing appendage. A single female may carry up to six parasitic males at once. This was discovered in 1924 and initially mistaken for a new species.' },
  { id: 'upside_down_jellyfish', name: 'Upside-Down Jellyfish', emoji: '🪼', rarity: 'epic',  habitat: 'depths',  color: '#80CBC4', description: 'Rests on the seafloor, tentacles facing up. Highly unusual.',
    journal: 'Upside-down jellyfish (Cassiopea species) are unique among jellyfish in resting bell-down on the seafloor with their tentacles pointing upward. This is not laziness — they harbor photosynthetic zooxanthellae algae in their tentacles and farm sunlight in shallow tropical lagoons and mangroves. They can release clouds of tiny stinging cells (called cassiosomes) into the surrounding water, stinging swimmers without any direct contact — earning them the nickname "stinging water" jellyfish.' },
  { id: 'pearl',             name: 'Pearl',                  emoji: '⚪', rarity: 'epic',      habitat: 'depths',  color: '#F5F5F5', description: 'Formed over years inside a mollusk. Perfectly smooth.',
    journal: 'Natural pearls form when a foreign irritant — almost always a parasite, not a grain of sand as commonly believed — lodges inside a mollusk. The animal coats it in nacre (mother-of-pearl) layer by layer, a process taking 2–7 years. The largest natural pearl ever found, the "Pearl of Puerto" or "Pearl of Allah," weighs 6.4 kg and was discovered in the Philippines in 1934. For decades it was kept under a Filipino fisherman\'s bed before its value was recognized — it is now estimated to be worth over $100 million.' },
  // ── Legendary ───────────────────────────────────────────
  { id: 'otter',             name: 'River Otter',            emoji: '🦦', rarity: 'legendary', habitat: 'surface', color: '#8D6E63', description: 'Your loyal companion from the very beginning.',
    journal: 'River otters (Lontra canadensis) are among the most playful and intelligent mammals in North America. Sea otters famously hold hands with their partners while floating asleep to avoid drifting apart — a behavior called "rafting." They have the densest fur of any mammal: up to 1 million hairs per square inch, trapping air for insulation and buoyancy. River otters can close their ears and nostrils underwater, hold their breath for 8 minutes, and reach speeds of 11 km/h swimming.' },
  { id: 'crab_blue',         name: 'Blue Crab',              emoji: '🦀', rarity: 'legendary', habitat: 'floor',   color: '#1E88E5', description: 'Iridescent blue claws. Rare and striking in the wild.',
    journal: 'Blue crabs (Callinectes sapidus) have a name that translates to "beautiful savory swimmer" in Greek and Latin — surprisingly apt. Unlike most crabs, they are powerful swimmers, using flat paddle-like rear legs. They must molt their entire hard shell to grow, and during this vulnerable "soft-shell" phase they are a prized culinary delicacy, eaten whole. The Chesapeake Bay blue crab fishery, worth over $400 million annually, is the largest blue crab fishery in the world.' },
  { id: 'crab_king',         name: 'King Crab',              emoji: '🦀', rarity: 'legendary', habitat: 'depths',  color: '#E53935', description: 'The largest crab in the sea. A legend among fishermen.',
    journal: 'Red king crabs (Paralithodes camtschaticus) can have a leg span of 1.8 meters and weigh up to 12 kg. Despite their name, they are not true crabs — they are more closely related to hermit crabs, with an asymmetrical abdomen tucked beneath their body. They migrate seasonally in massive herds of thousands along the Bering Sea floor. The Alaskan king crab fishery, immortalized by the TV series Deadliest Catch, is one of the most dangerous commercial fishing operations in the world, with a fatality rate 25 times the US national average.' },
  { id: 'great_white_shark', name: 'Great White Shark',      emoji: '🦈', rarity: 'legendary', habitat: 'depths',  color: '#546E7A', description: 'The apex predator. Ancient, powerful, and feared.',
    journal: 'Great white sharks (Carcharodon carcharias) can grow to 6 meters and 2,000 kg and have been on Earth for 11 million years. Like tuna, they are warm-blooded. They have up to 300 serrated triangular teeth arranged in multiple rows — losing one is no problem, as new teeth rotate forward continuously throughout their lives. The 1975 film Jaws gave them an enduring fearsome reputation, but they kill fewer than 5 people per year worldwide. In stark contrast, humans kill approximately 100 million sharks annually, mostly through finning.' },
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

export function rollFishSpecies(allowedSpeciesIds?: Set<string>, ownedSpeciesIds?: Set<string>): FishSpecies {
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

  // Already-owned species get half the weight so new discoveries are favoured
  const weights = rarityPool.map((f) => (ownedSpeciesIds?.has(f.id) ? 0.5 : 1.0));
  const weightTotal = weights.reduce((a, b) => a + b, 0);
  let w = Math.random() * weightTotal;
  for (let i = 0; i < rarityPool.length; i++) {
    w -= weights[i];
    if (w <= 0) return rarityPool[i];
  }
  return rarityPool[rarityPool.length - 1];
}
