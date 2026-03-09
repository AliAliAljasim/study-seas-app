import React from 'react';
import { Image, ImageSourcePropType } from 'react-native';

// ── Pixel Gnome Fishing Pack — all 50 sprites ─────────────
const FISH_SPRITES: Record<string, ImageSourcePropType> = {
  // Fresh Water
  goldfish:               require('../assets/fish/goldfish.png'),
  guppy:                  require('../assets/fish/guppy.png'),
  bluegill:               require('../assets/fish/bluegill.png'),
  silverjaw_minnow:       require('../assets/fish/silverjaw_minnow.png'),
  tadpole:                require('../assets/fish/tadpole.png'),
  mussel:                 require('../assets/fish/mussel.png'),
  bass:                   require('../assets/fish/bass.png'),
  catfish:                require('../assets/fish/catfish.png'),
  yellow_perch:           require('../assets/fish/yellow_perch.png'),
  neon_tetra:             require('../assets/fish/neon_tetra.png'),
  carp:                   require('../assets/fish/carp.png'),
  rainbow_trout:          require('../assets/fish/rainbow_trout.png'),
  salmon:                 require('../assets/fish/salmon.png'),
  angelfish:              require('../assets/fish/angelfish.png'),
  arowana:                require('../assets/fish/arowana.png'),
  // Salt Water
  anchovy:                require('../assets/fish/anchovy.png'),
  goby:                   require('../assets/fish/goby.png'),
  shrimp:                 require('../assets/fish/shrimp.png'),
  starfish:               require('../assets/fish/starfish.png'),
  clownfish:              require('../assets/fish/clownfish.png'),
  surgeonfish:            require('../assets/fish/surgeonfish.png'),
  yellow_tang:            require('../assets/fish/yellow_tang.png'),
  flounder:               require('../assets/fish/flounder.png'),
  jellyfish:              require('../assets/fish/jellyfish.png'),
  crab_dungeness:         require('../assets/fish/crab_dungeness.png'),
  seahorse:               require('../assets/fish/seahorse.png'),
  pufferfish:             require('../assets/fish/pufferfish.png'),
  blue_groper:            require('../assets/fish/blue_groper.png'),
  napoleon_wrasse:        require('../assets/fish/napoleon_wrasse.png'),
  tuna:                   require('../assets/fish/tuna.png'),
  purple_tang:            require('../assets/fish/purple_tang.png'),
  blue_angelfish:         require('../assets/fish/blue_angelfish.png'),
  moray_eel:              require('../assets/fish/moray_eel.png'),
  ribbon_eel:             require('../assets/fish/ribbon_eel.png'),
  stingray:               require('../assets/fish/stingray.png'),
  anglerfish:             require('../assets/fish/anglerfish.png'),
  upside_down_jellyfish:  require('../assets/fish/upside_down_jellyfish.png'),
  crab_blue:              require('../assets/fish/crab_blue.png'),
  crab_king:              require('../assets/fish/crab_king.png'),
  great_white_shark:      require('../assets/fish/great_white_shark.png'),
  // Misc
  worm:                   require('../assets/fish/worm.png'),
  rusty_can:              require('../assets/fish/rusty_can.png'),
  apple_core:             require('../assets/fish/apple_core.png'),
  bottle:                 require('../assets/fish/bottle.png'),
  seaweed:                require('../assets/fish/seaweed.png'),
  coral:                  require('../assets/fish/coral.png'),
  seashell:               require('../assets/fish/seashell.png'),
  sand_dollar:            require('../assets/fish/sand_dollar.png'),
  lure:                   require('../assets/fish/lure.png'),
  pearl:                  require('../assets/fish/pearl.png'),
  otter:                  require('../assets/fish/otter.png'),
};

export type FishVariant =
  | 'oval'
  | 'slim'
  | 'angel'
  | 'disc'
  | 'mandarin'
  | 'fancy'
  | 'seahorse'
  | 'octopus'
  | 'marine';

export interface FishVisual {
  variant: FishVariant;
  body: string;
  accent: string;
  detail: string;
}

// Kept for aquarium.tsx (card background tinting + size hints)
export const SPECIES_VISUALS: Record<string, FishVisual> = {
  // Fresh Water
  goldfish:              { variant: 'oval',     body: '#FFA726', accent: '#E65100', detail: '#FFE082' },
  guppy:                 { variant: 'slim',     body: '#AB47BC', accent: '#6A1B9A', detail: '#E1BEE7' },
  bluegill:              { variant: 'disc',     body: '#29B6F6', accent: '#0277BD', detail: '#B3E5FC' },
  silverjaw_minnow:      { variant: 'slim',     body: '#B0BEC5', accent: '#546E7A', detail: '#ECEFF1' },
  tadpole:               { variant: 'slim',     body: '#66BB6A', accent: '#2E7D32', detail: '#C8E6C9' },
  mussel:                { variant: 'disc',     body: '#5C6BC0', accent: '#283593', detail: '#C5CAE9' },
  bass:                  { variant: 'oval',     body: '#66BB6A', accent: '#2E7D32', detail: '#C8E6C9' },
  catfish:               { variant: 'oval',     body: '#8D6E63', accent: '#4E342E', detail: '#D7CCC8' },
  yellow_perch:          { variant: 'oval',     body: '#FDD835', accent: '#F57F17', detail: '#FFF9C4' },
  neon_tetra:            { variant: 'slim',     body: '#29B6F6', accent: '#01579B', detail: '#DCF5FF' },
  carp:                  { variant: 'oval',     body: '#FF8A65', accent: '#BF360C', detail: '#FFE0B2' },
  rainbow_trout:         { variant: 'slim',     body: '#EC407A', accent: '#880E4F', detail: '#FCE4EC' },
  salmon:                { variant: 'oval',     body: '#FF7043', accent: '#BF360C', detail: '#FBE9E7' },
  angelfish:             { variant: 'angel',    body: '#66BB6A', accent: '#2E7D32', detail: '#C8E6C9' },
  arowana:               { variant: 'slim',     body: '#FFD700', accent: '#F57F17', detail: '#FFF9C4' },
  // Salt Water
  anchovy:               { variant: 'slim',     body: '#90A4AE', accent: '#37474F', detail: '#ECEFF1' },
  goby:                  { variant: 'slim',     body: '#A5D6A7', accent: '#388E3C', detail: '#E8F5E9' },
  shrimp:                { variant: 'oval',     body: '#FFAB91', accent: '#BF360C', detail: '#FBE9E7' },
  starfish:              { variant: 'disc',     body: '#FF7043', accent: '#BF360C', detail: '#FBE9E7' },
  clownfish:             { variant: 'oval',     body: '#FF7043', accent: '#C8471F', detail: '#FFF4E8' },
  surgeonfish:           { variant: 'oval',     body: '#29B6F6', accent: '#0277BD', detail: '#B3E5FC' },
  yellow_tang:           { variant: 'disc',     body: '#FDD835', accent: '#F57F17', detail: '#FFF9C4' },
  flounder:              { variant: 'disc',     body: '#A5D6A7', accent: '#388E3C', detail: '#E8F5E9' },
  jellyfish:             { variant: 'octopus',  body: '#CE93D8', accent: '#6A1B9A', detail: '#F3E5F5' },
  crab_dungeness:        { variant: 'octopus',  body: '#FF7043', accent: '#BF360C', detail: '#FBE9E7' },
  seahorse:              { variant: 'seahorse', body: '#80DEEA', accent: '#00838F', detail: '#E0F7FA' },
  pufferfish:            { variant: 'oval',     body: '#FFF176', accent: '#F9A825', detail: '#FFFDE7' },
  blue_groper:           { variant: 'oval',     body: '#42A5F5', accent: '#0D47A1', detail: '#BBDEFB' },
  napoleon_wrasse:       { variant: 'oval',     body: '#5C6BC0', accent: '#1A237E', detail: '#C5CAE9' },
  tuna:                  { variant: 'marine',   body: '#42A5F5', accent: '#0D47A1', detail: '#BBDEFB' },
  purple_tang:           { variant: 'disc',     body: '#9C27B0', accent: '#4A148C', detail: '#E1BEE7' },
  blue_angelfish:        { variant: 'angel',    body: '#1E88E5', accent: '#0D47A1', detail: '#BBDEFB' },
  moray_eel:             { variant: 'marine',   body: '#4CAF50', accent: '#1B5E20', detail: '#C8E6C9' },
  ribbon_eel:            { variant: 'marine',   body: '#1565C0', accent: '#0D47A1', detail: '#BBDEFB' },
  stingray:              { variant: 'disc',     body: '#546E7A', accent: '#263238', detail: '#ECEFF1' },
  anglerfish:            { variant: 'fancy',    body: '#37474F', accent: '#102027', detail: '#90A4AE' },
  upside_down_jellyfish: { variant: 'octopus',  body: '#80CBC4', accent: '#00695C', detail: '#E0F2F1' },
  crab_blue:             { variant: 'octopus',  body: '#1E88E5', accent: '#0D47A1', detail: '#BBDEFB' },
  crab_king:             { variant: 'octopus',  body: '#E53935', accent: '#B71C1C', detail: '#FFCDD2' },
  great_white_shark:     { variant: 'marine',   body: '#546E7A', accent: '#263238', detail: '#ECEFF1' },
  // Misc
  worm:                  { variant: 'slim',     body: '#A1887F', accent: '#4E342E', detail: '#D7CCC8' },
  rusty_can:             { variant: 'oval',     body: '#8D6E63', accent: '#4E342E', detail: '#D7CCC8' },
  apple_core:            { variant: 'oval',     body: '#EF9A9A', accent: '#B71C1C', detail: '#FFCDD2' },
  bottle:                { variant: 'oval',     body: '#80CBC4', accent: '#00695C', detail: '#E0F2F1' },
  seaweed:               { variant: 'slim',     body: '#388E3C', accent: '#1B5E20', detail: '#C8E6C9' },
  coral:                 { variant: 'fancy',    body: '#FF8A65', accent: '#BF360C', detail: '#FFE0B2' },
  seashell:              { variant: 'oval',     body: '#FFCC80', accent: '#E65100', detail: '#FFF8E1' },
  sand_dollar:           { variant: 'disc',     body: '#F5F5DC', accent: '#A1887F', detail: '#FAFAFA' },
  lure:                  { variant: 'slim',     body: '#FFD54F', accent: '#FF6F00', detail: '#FFF9C4' },
  pearl:                 { variant: 'disc',     body: '#F5F5F5', accent: '#9E9E9E', detail: '#FFFFFF' },
  otter:                 { variant: 'oval',     body: '#8D6E63', accent: '#4E342E', detail: '#D7CCC8' },
};

export function getFishDimensions(variant: FishVariant, size: number) {
  const ar: Record<FishVariant, number> = {
    oval:     100 / 60,
    slim:     110 / 56,
    angel:    66  / 120,
    disc:     90  / 90,
    mandarin: 96  / 72,
    fancy:    128 / 82,
    seahorse: 54  / 100,
    octopus:  100 / 82,
    marine:   132 / 70,
  };
  return { width: Math.round(size * (ar[variant] ?? 1.5)), height: size };
}

interface FishSVGProps {
  speciesId: string;
  size: number;
}

export default function FishSVG({ speciesId, size }: FishSVGProps) {
  const sprite = FISH_SPRITES[speciesId];
  const variant = SPECIES_VISUALS[speciesId]?.variant ?? 'oval';
  const effectiveSize = speciesId === 'otter' ? size * 2 : size;
  const { width, height } = getFishDimensions(variant, effectiveSize);
  if (!sprite) return null;
  return (
    <Image
      source={sprite}
      style={{ width, height }}
      resizeMode="contain"
      fadeDuration={0}
    />
  );
}
