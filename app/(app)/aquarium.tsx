import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Animated, Easing, Modal,
} from 'react-native';
import Svg, {
  Path, Ellipse, Circle, Rect, Defs,
  LinearGradient as SvgGradient, Stop, G,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getTheme } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { getEggs, getOwnedFish, hatchEgg, awardEgg, loadSamplePack, claimStarterEgg, clearOwnedFish, skipEggTimer } from '../../services/aquariumService';
import {
  FishEgg, OwnedFish, FishSpecies,
  FISH_SPECIES, RARITY_COLORS, RARITY_LABELS, FishRarity,
  FishHabitat, HABITAT_LABELS, BiomeKey, computeUnlockedBiomes,
} from '../../models/aquariumModels';
import FishSVG, { SPECIES_VISUALS, getFishDimensions } from '../../components/FishSVG';

type Tab = 'tank' | 'eggs' | 'bestiary';

const RARITY_ORDER: FishRarity[] = ['trash', 'common', 'uncommon', 'rare', 'epic', 'legendary'];
const HABITAT_ORDER: FishHabitat[] = ['surface', 'floor', 'depths'];
const BIOME_HEIGHT     = 210;
const BIOME_FLOOR      = 55;   // sand floor height (floor biome only)
const MAX_BIOME_FISH   = 8;  // max species per biome (abyss has 8, others have 7)

// ─── SVG tank backgrounds (7 unique biomes) ──────────

type BgProps = { width: number; height: number; isDark: boolean; uid: string };

// 1 ─ Sunlit Shallows ── bright tropical, sun + starfish + seagrass + shells + caustics
function ShallowsBackground({ width, height, isDark, uid }: BgProps) {
  const gW = `shW_${uid}`, gSun = `shS_${uid}`, gSand = `shD_${uid}`;
  const sandY = height * 0.75;
  const star = (cx: number, cy: number, r: number = 7, ir: number = 2.8): string => {
    let d = '';
    for (let i = 0; i < 5; i++) {
      const ao = ((i * 72) - 90) * Math.PI / 180;
      const ai = ((i * 72 + 36) - 90) * Math.PI / 180;
      d += (i === 0 ? 'M ' : 'L ') + `${(cx + r * Math.cos(ao)).toFixed(1)},${(cy + r * Math.sin(ao)).toFixed(1)} `;
      d += `L ${(cx + ir * Math.cos(ai)).toFixed(1)},${(cy + ir * Math.sin(ai)).toFixed(1)} `;
    }
    return d + 'Z';
  };
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        <SvgGradient id={gW} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"   stopColor={isDark ? '#1A9AAA' : '#4DD0E1'} stopOpacity="1" />
          <Stop offset="0.45" stopColor={isDark ? '#0E7A8A' : '#26C6DA'} stopOpacity="1" />
          <Stop offset="0.8" stopColor={isDark ? '#085A6A' : '#00BCD4'} stopOpacity="1" />
          <Stop offset="1"   stopColor={isDark ? '#064A58' : '#00ACC1'} stopOpacity="1" />
        </SvgGradient>
        <SvgGradient id={gSun} x1="1" y1="0" x2="0.1" y2="1">
          <Stop offset="0"   stopColor="white" stopOpacity={isDark ? '0.25' : '0.55'} />
          <Stop offset="0.6" stopColor="white" stopOpacity="0" />
        </SvgGradient>
        <SvgGradient id={gSand} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"   stopColor={isDark ? '#8A5200' : '#FFE082'} stopOpacity="1" />
          <Stop offset="0.5" stopColor={isDark ? '#5A3200' : '#FFB300'} stopOpacity="1" />
          <Stop offset="1"   stopColor={isDark ? '#3D2000' : '#E65100'} stopOpacity="1" />
        </SvgGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${gW})`} />
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${gSun})`} />
      {/* Sun disk + halo */}
      <Circle cx={width * 0.88} cy={-8} r={44} fill="white" opacity={isDark ? 0.08 : 0.20} />
      <Circle cx={width * 0.88} cy={-8} r={30} fill={isDark ? '#FFE57F' : '#FFF9C4'} opacity={isDark ? 0.60 : 0.90} />
      <Circle cx={width * 0.88} cy={-8} r={18} fill="white" opacity={isDark ? 0.30 : 0.60} />
      {/* Light rays */}
      <Path d={`M ${width*0.88},-8 L ${width*0.74},${height} L ${width*0.67},${height} Z`} fill="white" opacity={isDark ? 0.08 : 0.18} />
      <Path d={`M ${width*0.88},-8 L ${width*0.52},${height} L ${width*0.46},${height} Z`} fill="white" opacity={isDark ? 0.06 : 0.13} />
      <Path d={`M ${width*0.88},-8 L ${width*0.30},${height*0.90} L ${width*0.24},${height*0.90} Z`} fill="white" opacity={isDark ? 0.04 : 0.09} />
      <Path d={`M ${width*0.88},-8 L ${width*0.10},${height*0.70} L ${width*0.05},${height*0.70} Z`} fill="white" opacity={isDark ? 0.03 : 0.07} />
      <Path d={`M ${width*0.88},-8 L ${width*0.95},${height*0.60} L ${width},${height*0.60} Z`} fill="white" opacity={isDark ? 0.04 : 0.10} />
      {/* Caustic light patterns on water */}
      <Path d={`M ${width*0.15},${height*0.30} Q ${width*0.20},${height*0.24} ${width*0.26},${height*0.30}`} stroke="white" strokeWidth={1.5} fill="none" opacity={isDark ? 0.10 : 0.22} />
      <Path d={`M ${width*0.35},${height*0.42} Q ${width*0.40},${height*0.36} ${width*0.46},${height*0.42}`} stroke="white" strokeWidth={1.2} fill="none" opacity={isDark ? 0.08 : 0.18} />
      <Path d={`M ${width*0.55},${height*0.22} Q ${width*0.60},${height*0.16} ${width*0.65},${height*0.22}`} stroke="white" strokeWidth={1.0} fill="none" opacity={isDark ? 0.07 : 0.15} />
      {/* Surface shimmer lines */}
      <Path d={`M 6,5 Q ${width*0.25},1 ${width*0.55},6 Q ${width*0.78},10 ${width-6},4`} stroke="rgba(255,255,255,0.9)" strokeWidth={2.5} fill="none" />
      <Path d={`M 18,14 Q ${width*0.38},9 ${width*0.65},14 Q ${width*0.84},18 ${width-18},12`} stroke="rgba(255,255,255,0.55)" strokeWidth={1.8} fill="none" />
      <Path d={`M 30,22 Q ${width*0.45},18 ${width*0.72},23 Q ${width*0.88},26 ${width-8},20`} stroke="rgba(255,255,255,0.28)" strokeWidth={1.2} fill="none" />
      {/* Sandy bottom with gentle dune curve */}
      <Path d={`M 0,${sandY} Q ${width*0.15},${sandY-10} ${width*0.35},${sandY+4} Q ${width*0.55},${sandY+12} ${width*0.75},${sandY-4} Q ${width*0.88},${sandY-8} ${width},${sandY+2} L ${width},${height} L 0,${height} Z`} fill={`url(#${gSand})`} />
      {/* Sand ripple lines */}
      <Path d={`M ${width*0.06},${sandY+10} Q ${width*0.18},${sandY+7} ${width*0.30},${sandY+13}`} stroke={isDark ? '#A07030' : '#FFD54F'} strokeWidth={1.3} fill="none" opacity={0.55} />
      <Path d={`M ${width*0.36},${sandY+15} Q ${width*0.48},${sandY+11} ${width*0.58},${sandY+18}`} stroke={isDark ? '#A07030' : '#FFD54F'} strokeWidth={1.3} fill="none" opacity={0.45} />
      <Path d={`M ${width*0.65},${sandY+10} Q ${width*0.76},${sandY+7} ${width*0.86},${sandY+14}`} stroke={isDark ? '#A07030' : '#FFD54F'} strokeWidth={1.0} fill="none" opacity={0.38} />
      {/* Seagrass cluster left */}
      <Path d={`M ${width*0.08},${sandY+2} C ${width*0.06},${sandY-22} ${width*0.09},${sandY-38} ${width*0.07},${sandY-54} C ${width*0.05},${sandY-38} ${width*0.06},${sandY-22} ${width*0.08},${sandY+2}`} fill={isDark ? '#0A3A1A' : '#2E7D32'} />
      <Path d={`M ${width*0.10},${sandY+2} C ${width*0.12},${sandY-26} ${width*0.11},${sandY-42} ${width*0.09},${sandY-58} C ${width*0.07},${sandY-42} ${width*0.08},${sandY-26} ${width*0.10},${sandY+2}`} fill={isDark ? '#155232' : '#388E3C'} />
      <Path d={`M ${width*0.12},${sandY+2} C ${width*0.14},${sandY-16} ${width*0.13},${sandY-28} ${width*0.11},${sandY-40} C ${width*0.09},${sandY-28} ${width*0.10},${sandY-16} ${width*0.12},${sandY+2}`} fill={isDark ? '#0A3A1A' : '#1B5E20'} />
      {/* Seagrass cluster center-right */}
      <Path d={`M ${width*0.62},${sandY+2} C ${width*0.60},${sandY-20} ${width*0.63},${sandY-34} ${width*0.61},${sandY-48} C ${width*0.59},${sandY-34} ${width*0.58},${sandY-20} ${width*0.62},${sandY+2}`} fill={isDark ? '#0A3A1A' : '#2E7D32'} />
      <Path d={`M ${width*0.64},${sandY+2} C ${width*0.66},${sandY-24} ${width*0.65},${sandY-40} ${width*0.63},${sandY-56} C ${width*0.61},${sandY-40} ${width*0.62},${sandY-24} ${width*0.64},${sandY+2}`} fill={isDark ? '#155232' : '#388E3C'} />
      <Path d={`M ${width*0.66},${sandY+2} C ${width*0.68},${sandY-16} ${width*0.67},${sandY-28} ${width*0.65},${sandY-42} C ${width*0.63},${sandY-28} ${width*0.65},${sandY-16} ${width*0.66},${sandY+2}`} fill={isDark ? '#0A3A1A' : '#1B5E20'} />
      {/* Starfish × 3 */}
      <Path d={star(width * 0.22, sandY + 9)}          fill={isDark ? '#B84000' : '#FF7043'} opacity={0.92} />
      <Path d={star(width * 0.73, sandY + 7, 6, 2.4)} fill={isDark ? '#CC5500' : '#FF8A65'} opacity={0.85} />
      <Path d={star(width * 0.45, sandY + 11, 5, 2.0)} fill={isDark ? '#A83000' : '#F4511E'} opacity={0.75} />
      {/* Seashell */}
      <Path d={`M ${width*0.84},${sandY+6} Q ${width*0.86},${sandY+2} ${width*0.88},${sandY+6} Q ${width*0.86},${sandY+12} ${width*0.84},${sandY+6} Z`} fill={isDark ? '#8A5A40' : '#FFCC80'} opacity={0.85} />
      <Path d={`M ${width*0.84},${sandY+6} L ${width*0.88},${sandY+6}`} stroke={isDark ? '#6A3A20' : '#FF8A65'} strokeWidth={0.8} fill="none" opacity={0.7} />
      {/* Pebbles scattered */}
      <Ellipse cx={width*0.38} cy={sandY+9}  rx={5} ry={3}   fill={isDark ? '#4A3A28' : '#8D6E63'} opacity={0.72} />
      <Ellipse cx={width*0.46} cy={sandY+13} rx={3} ry={2}   fill={isDark ? '#3E3028' : '#795548'} opacity={0.62} />
      <Ellipse cx={width*0.52} cy={sandY+8}  rx={4} ry={2.5} fill={isDark ? '#42320A' : '#A1887F'} opacity={0.68} />
      <Ellipse cx={width*0.77} cy={sandY+12} rx={3} ry={1.8} fill={isDark ? '#3A2810' : '#6D4C41'} opacity={0.60} />
      <Ellipse cx={width*0.30} cy={sandY+15} rx={2} ry={1.5} fill={isDark ? '#3A2A18' : '#8D6E63'} opacity={0.55} />
      {/* Small bubble trail from sand */}
      <Circle cx={width*0.32} cy={sandY-12} r={1.5} fill="white" opacity={0.25} />
      <Circle cx={width*0.33} cy={sandY-24} r={1.0} fill="white" opacity={0.18} />
      <Circle cx={width*0.31} cy={sandY-36} r={0.8} fill="white" opacity={0.12} />
    </Svg>
  );
}

// 2 ─ Open Water ── pelagic, no floor, distant fish schools, light shafts
function OpenWaterBackground({ width, height, isDark, uid }: BgProps) {
  const gW = `owW_${uid}`, gTop = `owT_${uid}`, gShaft = `owSh_${uid}`, gDeep = `owD_${uid}`;
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        <SvgGradient id={gW} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"   stopColor={isDark ? '#0D4A88' : '#1E88E5'} stopOpacity="1" />
          <Stop offset="0.4" stopColor={isDark ? '#083570' : '#1565C0'} stopOpacity="1" />
          <Stop offset="0.75" stopColor={isDark ? '#042252' : '#0D47A1'} stopOpacity="1" />
          <Stop offset="1"   stopColor={isDark ? '#020F2C' : '#01579B'} stopOpacity="1" />
        </SvgGradient>
        <SvgGradient id={gTop} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="white" stopOpacity={isDark ? '0.18' : '0.35'} />
          <Stop offset="1" stopColor="white" stopOpacity="0" />
        </SvgGradient>
        <SvgGradient id={gShaft} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="white" stopOpacity={isDark ? '0.10' : '0.22'} />
          <Stop offset="1" stopColor="white" stopOpacity="0" />
        </SvgGradient>
        <SvgGradient id={gDeep} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"   stopColor={isDark ? '#001A40' : '#003080'} stopOpacity="0" />
          <Stop offset="1"   stopColor={isDark ? '#000A1A' : '#001040'} stopOpacity="0.7" />
        </SvgGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${gW})`} />
      <Rect x={0} y={0} width={width} height={height * 0.40} fill={`url(#${gTop})`} />
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${gDeep})`} />
      {/* Angled light shafts from surface */}
      <Path d={`M ${width*0.30},0 L ${width*0.38},0 L ${width*0.55},${height} L ${width*0.46},${height} Z`} fill={`url(#${gShaft})`} />
      <Path d={`M ${width*0.58},0 L ${width*0.65},0 L ${width*0.80},${height} L ${width*0.72},${height} Z`} fill={`url(#${gShaft})`} opacity={0.6} />
      <Path d={`M ${width*0.10},0 L ${width*0.16},0 L ${width*0.28},${height*0.75} L ${width*0.22},${height*0.75} Z`} fill={`url(#${gShaft})`} opacity={0.4} />
      {/* Surface shimmer lines */}
      <Path d={`M 5,4 Q ${width*0.28},0 ${width*0.58},5 Q ${width*0.80},9 ${width-5},3`} stroke="rgba(255,255,255,0.90)" strokeWidth={2.5} fill="none" />
      <Path d={`M 16,13 Q ${width*0.40},8 ${width*0.70},13 Q ${width*0.88},17 ${width-16},11`} stroke="rgba(255,255,255,0.50)" strokeWidth={1.8} fill="none" />
      <Path d={`M 28,22 Q ${width*0.50},18 ${width*0.80},23 Q ${width*0.92},26 ${width-8},20`} stroke="rgba(255,255,255,0.25)" strokeWidth={1.2} fill="none" />
      {/* Fish school 1 — upper mid, tight formation */}
      {[0,8,16,6,14,22,4,11].map((off, i) => (
        <Ellipse key={`s1${i}`}
          cx={width*0.65 - i*8 + off*0.5} cy={height*0.24 + (i%3)*6 - off*0.3}
          rx={5} ry={2.2} fill={isDark ? 'rgba(100,160,220,0.40)' : 'rgba(180,220,255,0.45)'} />
      ))}
      {/* Fish school 2 — lower left */}
      {[0,7,14,5,12,18].map((off, i) => (
        <Ellipse key={`s2${i}`}
          cx={width*0.15 + i*7 + off*0.4} cy={height*0.58 + (i%3)*5 - off*0.2}
          rx={3.5} ry={1.6} fill={isDark ? 'rgba(80,140,200,0.32)' : 'rgba(150,200,255,0.36)'} />
      ))}
      {/* Fish school 3 — distant, tiny */}
      {[0,5,10,15,4,9].map((off, i) => (
        <Ellipse key={`s3${i}`}
          cx={width*0.78 - i*5 + off*0.3} cy={height*0.76 + (i%2)*4 - off*0.1}
          rx={2.5} ry={1.2} fill={isDark ? 'rgba(60,120,180,0.24)' : 'rgba(120,180,240,0.28)'} />
      ))}
      {/* Jellyfish silhouette */}
      <Ellipse cx={width*0.82} cy={height*0.42} rx={9} ry={6} fill={isDark ? 'rgba(140,100,200,0.22)' : 'rgba(200,160,255,0.30)'} />
      <Path d={`M ${width*0.78},${height*0.48} Q ${width*0.79},${height*0.56} ${width*0.80},${height*0.50}`} stroke={isDark ? 'rgba(140,100,200,0.15)' : 'rgba(200,160,255,0.22)'} strokeWidth={1} fill="none" />
      <Path d={`M ${width*0.82},${height*0.48} Q ${width*0.82},${height*0.58} ${width*0.83},${height*0.52}`} stroke={isDark ? 'rgba(140,100,200,0.15)' : 'rgba(200,160,255,0.22)'} strokeWidth={1} fill="none" />
      <Path d={`M ${width*0.86},${height*0.47} Q ${width*0.87},${height*0.55} ${width*0.86},${height*0.50}`} stroke={isDark ? 'rgba(140,100,200,0.15)' : 'rgba(200,160,255,0.22)'} strokeWidth={1} fill="none" />
      {/* Depth shimmer bands */}
      <Path d={`M 0,${height*0.38} Q ${width*0.3},${height*0.36} ${width*0.6},${height*0.40} Q ${width*0.8},${height*0.38} ${width},${height*0.37}`} stroke="white" strokeWidth={1.2} fill="none" opacity={isDark ? 0.07 : 0.14} />
      <Path d={`M 0,${height*0.62} Q ${width*0.3},${height*0.60} ${width*0.6},${height*0.64} Q ${width*0.8},${height*0.62} ${width},${height*0.61}`} stroke="white" strokeWidth={0.8} fill="none" opacity={isDark ? 0.04 : 0.09} />
      {/* Floating plankton */}
      {([[0.12,0.18],[0.28,0.42],[0.52,0.28],[0.68,0.62],[0.38,0.70],[0.84,0.36],[0.22,0.80],[0.56,0.52],[0.76,0.20],[0.08,0.55],[0.44,0.85],[0.90,0.50],[0.60,0.90],[0.18,0.34]] as [number,number][]).map(([x,y],i) => (
        <Circle key={`p${i}`} cx={width*x} cy={height*y} r={1.0 + (i%3)*0.4} fill="white" opacity={isDark ? 0.12+(i%4)*0.04 : 0.18+(i%4)*0.06} />
      ))}
    </Svg>
  );
}

// 3 ─ Coral Reef ── vibrant, dense coral garden + anemone + fish shadows
function CoralReefBackground({ width, height, isDark, uid }: BgProps) {
  const gW = `crW_${uid}`, gSand = `crS_${uid}`;
  const sandY = height * 0.78;
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        <SvgGradient id={gW} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"   stopColor={isDark ? '#007A8A' : '#26C6DA'} stopOpacity="1" />
          <Stop offset="0.5" stopColor={isDark ? '#005060' : '#00ACC1'} stopOpacity="1" />
          <Stop offset="0.85" stopColor={isDark ? '#003040' : '#00838F'} stopOpacity="1" />
          <Stop offset="1"   stopColor={isDark ? '#001E28' : '#006064'} stopOpacity="1" />
        </SvgGradient>
        <SvgGradient id={gSand} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"   stopColor={isDark ? '#8A5200' : '#FFE082'} stopOpacity="1" />
          <Stop offset="0.5" stopColor={isDark ? '#5A3200' : '#FFCA28'} stopOpacity="1" />
          <Stop offset="1"   stopColor={isDark ? '#3D2000' : '#FF8F00'} stopOpacity="1" />
        </SvgGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${gW})`} />
      {/* Light shafts */}
      <Path d={`M ${width*0.15},0 L ${width*0.21},0 L ${width*0.32},${height*0.75} L ${width*0.25},${height*0.75} Z`} fill="white" opacity={isDark ? 0.05 : 0.11} />
      <Path d={`M ${width*0.54},0 L ${width*0.60},0 L ${width*0.70},${height*0.60} L ${width*0.63},${height*0.60} Z`} fill="white" opacity={isDark ? 0.04 : 0.08} />
      <Path d={`M ${width*0.78},0 L ${width*0.83},0 L ${width*0.90},${height*0.45} L ${width*0.85},${height*0.45} Z`} fill="white" opacity={isDark ? 0.03 : 0.06} />
      {/* Surface shimmer */}
      <Path d={`M 5,5 Q ${width*0.28},1 ${width*0.58},6 Q ${width*0.80},10 ${width-5},4`} stroke="rgba(255,255,255,0.85)" strokeWidth={2.5} fill="none" />
      <Path d={`M 14,14 Q ${width*0.42},9 ${width*0.72},14 Q ${width*0.88},18 ${width-14},12`} stroke="rgba(255,255,255,0.42)" strokeWidth={1.5} fill="none" />
      {/* Sandy floor */}
      <Path d={`M 0,${sandY} Q ${width*0.18},${sandY-8} ${width*0.40},${sandY+4} Q ${width*0.62},${sandY+10} ${width*0.80},${sandY-5} Q ${width*0.92},${sandY-2} ${width},${sandY+3} L ${width},${height} L 0,${height} Z`} fill={`url(#${gSand})`} />
      {/* Sand ripples */}
      <Path d={`M ${width*0.06},${sandY+10} Q ${width*0.16},${sandY+7} ${width*0.26},${sandY+13}`} stroke={isDark ? '#A07030' : '#FFD54F'} strokeWidth={1.2} fill="none" opacity={0.50} />
      <Path d={`M ${width*0.34},${sandY+14} Q ${width*0.44},${sandY+11} ${width*0.54},${sandY+17}`} stroke={isDark ? '#A07030' : '#FFD54F'} strokeWidth={1.0} fill="none" opacity={0.40} />
      <Path d={`M ${width*0.62},${sandY+10} Q ${width*0.72},${sandY+7} ${width*0.82},${sandY+14}`} stroke={isDark ? '#A07030' : '#FFD54F'} strokeWidth={1.0} fill="none" opacity={0.35} />
      {/* Branching coral LEFT (orange, fuller) */}
      <Path d={`M ${width*0.10},${sandY} L ${width*0.10},${sandY-60}`} stroke={isDark ? '#C04000' : '#FF6D00'} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <Path d={`M ${width*0.10},${sandY-25} L ${width*0.02},${sandY-48}`} stroke={isDark ? '#C04000' : '#FF6D00'} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d={`M ${width*0.10},${sandY-38} L ${width*0.20},${sandY-62}`} stroke={isDark ? '#D45000' : '#FF8A00'} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d={`M ${width*0.10},${sandY-50} L ${width*0.05},${sandY-68}`} stroke={isDark ? '#C04000' : '#FF6D00'} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Path d={`M ${width*0.10},${sandY-50} L ${width*0.16},${sandY-70}`} stroke={isDark ? '#D45000' : '#FF8A00'} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Path d={`M ${width*0.02},${sandY-48} L ${width*0.00},${sandY-60}`} stroke={isDark ? '#B03800' : '#FF5722'} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Path d={`M ${width*0.02},${sandY-48} L ${width*0.05},${sandY-62}`} stroke={isDark ? '#B03800' : '#FF5722'} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Circle cx={width*0.02} cy={sandY-48} r={3.5} fill={isDark ? '#A03000' : '#FF5722'} />
      <Circle cx={width*0.20} cy={sandY-62} r={3} fill={isDark ? '#C04000' : '#FF7043'} />
      <Circle cx={width*0.05} cy={sandY-68} r={2.5} fill={isDark ? '#A03000' : '#FF5722'} />
      <Circle cx={width*0.16} cy={sandY-70} r={2} fill={isDark ? '#C04000' : '#FF7043'} />
      <Circle cx={width*0.00} cy={sandY-60} r={2} fill={isDark ? '#A03000' : '#FF5722'} />
      <Circle cx={width*0.05} cy={sandY-62} r={1.5} fill={isDark ? '#A03000' : '#FF5722'} />
      {/* Brain coral CENTER */}
      <Ellipse cx={width*0.50} cy={sandY-14} rx={24} ry={20} fill={isDark ? '#6A0E0E' : '#C62828'} />
      <Ellipse cx={width*0.50} cy={sandY-14} rx={20} ry={16} fill={isDark ? '#8C2020' : '#E53935'} />
      <Ellipse cx={width*0.50} cy={sandY-14} rx={15} ry={11} fill={isDark ? '#9A2828' : '#EF5350'} />
      {([[-12,-4],[-6,-10],[0,-12],[6,-10],[12,-4],[16,2],[10,8],[0,10],[-10,8],[-16,2]] as [number,number][]).map(([dx,dy],i) => (
        <Path key={i} d={`M ${width*0.50+dx},${sandY-14+dy-7} Q ${width*0.50+dx+3},${sandY-14+dy} ${width*0.50+dx},${sandY-14+dy+5}`} stroke={isDark ? '#B03030' : '#EF9A9A'} strokeWidth={1.2} fill="none" />
      ))}
      {/* Tube coral cluster center-left */}
      {([[-18,0],[-12,-4],[-6,-6],[0,-8],[6,-4]] as [number,number][]).map(([dx,dh],i) => (
        <Path key={i} d={`M ${width*0.32+dx},${sandY} L ${width*0.32+dx},${sandY-22+dh}`} stroke={isDark ? '#E65100' : '#FF6D00'} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      ))}
      {([[-18,0],[-12,-4],[-6,-6],[0,-8],[6,-4]] as [number,number][]).map(([dx,dh],i) => (
        <Ellipse key={i} cx={width*0.32+dx} cy={sandY-22+dh} rx={3.5} ry={2} fill={isDark ? '#C04000' : '#FF8A65'} />
      ))}
      {/* Sea fan RIGHT (pink/magenta, denser) */}
      <Path d={`M ${width*0.86},${sandY} L ${width*0.86},${sandY-62}`} stroke={isDark ? '#8C1A5A' : '#C2185B'} strokeWidth={2.5} fill="none" />
      <Path d={`M ${width*0.86},${sandY-18} Q ${width*0.77},${sandY-38} ${width*0.73},${sandY-34}`} stroke={isDark ? '#8C1A5A' : '#C2185B'} strokeWidth={1.5} fill="none" />
      <Path d={`M ${width*0.86},${sandY-18} Q ${width*0.95},${sandY-38} ${width*0.99},${sandY-34}`} stroke={isDark ? '#A01A6A' : '#E91E8C'} strokeWidth={1.5} fill="none" />
      <Path d={`M ${width*0.86},${sandY-32} Q ${width*0.79},${sandY-50} ${width*0.76},${sandY-46}`} stroke={isDark ? '#8C1A5A' : '#C2185B'} strokeWidth={1.2} fill="none" />
      <Path d={`M ${width*0.86},${sandY-32} Q ${width*0.93},${sandY-50} ${width*0.96},${sandY-46}`} stroke={isDark ? '#A01A6A' : '#E91E8C'} strokeWidth={1.2} fill="none" />
      <Path d={`M ${width*0.86},${sandY-44} Q ${width*0.82},${sandY-58} ${width*0.80},${sandY-54}`} stroke={isDark ? '#8C1A5A' : '#C2185B'} strokeWidth={1} fill="none" />
      <Path d={`M ${width*0.86},${sandY-44} Q ${width*0.90},${sandY-58} ${width*0.92},${sandY-54}`} stroke={isDark ? '#A01A6A' : '#E91E8C'} strokeWidth={1} fill="none" />
      <Path d={`M ${width*0.86},${sandY-54} Q ${width*0.84},${sandY-64} ${width*0.83},${sandY-60}`} stroke={isDark ? '#8C1A5A' : '#C2185B'} strokeWidth={0.8} fill="none" />
      <Path d={`M ${width*0.86},${sandY-54} Q ${width*0.88},${sandY-64} ${width*0.89},${sandY-60}`} stroke={isDark ? '#A01A6A' : '#E91E8C'} strokeWidth={0.8} fill="none" />
      {/* Purple anemone cluster */}
      <Path d={`M ${width*0.64},${sandY} L ${width*0.64},${sandY-16}`} stroke={isDark ? '#4A0060' : '#7B1FA2'} strokeWidth={3.5} fill="none" />
      {([[-12,-14],[-7,-18],[-2,-20],[3,-18],[8,-14],[12,-10],[16,-6],[-16,-6]] as [number,number][]).map(([dx,dy],i) => (
        <Path key={i} d={`M ${width*0.64},${sandY-16} Q ${width*0.64+dx*0.5},${sandY-16+dy*0.5} ${width*0.64+dx},${sandY-16+dy}`} stroke={i%2===0 ? (isDark ? '#6A0090' : '#9C27B0') : (isDark ? '#8A00B0' : '#CE93D8')} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      ))}
      {/* Small green anemone far left */}
      <Path d={`M ${width*0.24},${sandY} L ${width*0.24},${sandY-12}`} stroke={isDark ? '#0A4A20' : '#2E7D32'} strokeWidth={2.5} fill="none" />
      {([[-8,-10],[-4,-13],[0,-14],[4,-13],[8,-10],[10,-6],[-10,-6]] as [number,number][]).map(([dx,dy],i) => (
        <Path key={i} d={`M ${width*0.24},${sandY-12} Q ${width*0.24+dx*0.5},${sandY-12+dy*0.5} ${width*0.24+dx},${sandY-12+dy}`} stroke={isDark ? '#1A6A30' : '#4CAF50'} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      ))}
      {/* Scattered pebbles + shells */}
      <Ellipse cx={width*0.40} cy={sandY+9}  rx={5} ry={3}   fill={isDark ? '#4A3A28' : '#8D6E63'} opacity={0.72} />
      <Ellipse cx={width*0.48} cy={sandY+13} rx={3} ry={2}   fill={isDark ? '#3E3028' : '#795548'} opacity={0.62} />
      <Ellipse cx={width*0.56} cy={sandY+8}  rx={4} ry={2.5} fill={isDark ? '#42320A' : '#A1887F'} opacity={0.68} />
      <Ellipse cx={width*0.74} cy={sandY+11} rx={3} ry={1.8} fill={isDark ? '#3A2810' : '#6D4C41'} opacity={0.58} />
    </Svg>
  );
}

// 4 ─ Sandy Bed ── thick sandy floor, dense seagrass, anchor, crabs, shells
function SandyBedBackground({ width, height, isDark, uid }: BgProps) {
  const gW = `sbW_${uid}`, gSand = `sbS_${uid}`;
  const floorY   = height * 0.55;
  const sandTopY = floorY + 4;
  const rust     = isDark ? '#8C3A00' : '#E65100';
  const ancX     = width * 0.74;
  const ancTop   = sandTopY - 44;
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        <SvgGradient id={gW} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"   stopColor={isDark ? '#1A5A48' : '#4DB6AC'} stopOpacity="1" />
          <Stop offset="0.4" stopColor={isDark ? '#0E3A2E' : '#26A69A'} stopOpacity="1" />
          <Stop offset="0.8" stopColor={isDark ? '#081E18' : '#00897B'} stopOpacity="1" />
          <Stop offset="1"   stopColor={isDark ? '#040E0C' : '#00695C'} stopOpacity="1" />
        </SvgGradient>
        <SvgGradient id={gSand} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"   stopColor={isDark ? '#9A6A00' : '#FFE082'} stopOpacity="1" />
          <Stop offset="0.35" stopColor={isDark ? '#7A4800' : '#FFCA28'} stopOpacity="1" />
          <Stop offset="0.7" stopColor={isDark ? '#5A3000' : '#FFB300'} stopOpacity="1" />
          <Stop offset="1"   stopColor={isDark ? '#3A1800' : '#E65100'} stopOpacity="1" />
        </SvgGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${gW})`} />
      {/* Light shaft */}
      <Path d={`M ${width*0.25},0 L ${width*0.32},0 L ${width*0.44},${floorY} L ${width*0.36},${floorY} Z`} fill="white" opacity={isDark ? 0.04 : 0.09} />
      {/* Surface shimmer */}
      <Path d={`M 5,5 Q ${width*0.30},1 ${width*0.62},6 Q ${width*0.82},10 ${width-5},4`} stroke="rgba(255,255,255,0.80)" strokeWidth={2.5} fill="none" />
      <Path d={`M 16,15 Q ${width*0.44},10 ${width*0.74},15 Q ${width*0.90},19 ${width-16},13`} stroke="rgba(255,255,255,0.38)" strokeWidth={1.5} fill="none" />
      {/* Sandy floor (thick — starts at 55%) */}
      <Path d={`M 0,${floorY} Q ${width*0.15},${floorY-10} ${width*0.38},${floorY+5} Q ${width*0.58},${floorY+12} ${width*0.78},${floorY-6} Q ${width*0.92},${floorY-3} ${width},${floorY+4} L ${width},${height} L 0,${height} Z`} fill={`url(#${gSand})`} />
      {/* Sand dune ripples */}
      <Path d={`M ${width*0.04},${sandTopY+10} Q ${width*0.15},${sandTopY+6} ${width*0.26},${sandTopY+13}`} stroke={isDark ? '#A07030' : '#FFD54F'} strokeWidth={1.5} fill="none" opacity={0.55} />
      <Path d={`M ${width*0.32},${sandTopY+15} Q ${width*0.44},${sandTopY+11} ${width*0.55},${sandTopY+18}`} stroke={isDark ? '#A07030' : '#FFD54F'} strokeWidth={1.5} fill="none" opacity={0.45} />
      <Path d={`M ${width*0.62},${sandTopY+10} Q ${width*0.74},${sandTopY+7} ${width*0.84},${sandTopY+14}`} stroke={isDark ? '#A07030' : '#FFD54F'} strokeWidth={1.2} fill="none" opacity={0.38} />
      {/* Dense seagrass meadow — 12 blades */}
      {([[0.08,0],[0.10,1],[0.12,-1],[0.14,0.5],[0.16,1],[0.18,-0.5],[0.20,0],[0.22,1],[0.24,-1],[0.26,0.5],[0.28,1],[0.30,0]] as [number,number][]).map(([rx,off],i) => (
        <Path key={i}
          d={`M ${width*rx},${floorY+3} C ${width*rx+off*4},${floorY-22} ${width*rx+off*5},${floorY-38} ${width*rx+off*2},${floorY-58} C ${width*rx-off*2},${floorY-38} ${width*rx-off*4},${floorY-22} ${width*rx},${floorY+3}`}
          fill={i%3===0 ? (isDark ? '#0A3A1A' : '#2E7D32') : i%3===1 ? (isDark ? '#155232' : '#388E3C') : (isDark ? '#0D4522' : '#1B5E20')}
        />
      ))}
      {/* Second smaller seagrass patch right side */}
      {([[0.52,0],[0.54,1],[0.56,-0.5],[0.58,0]] as [number,number][]).map(([rx,off],i) => (
        <Path key={i}
          d={`M ${width*rx},${floorY+3} C ${width*rx+off*3},${floorY-16} ${width*rx+off*4},${floorY-28} ${width*rx+off*2},${floorY-44} C ${width*rx-off*2},${floorY-28} ${width*rx-off*3},${floorY-16} ${width*rx},${floorY+3}`}
          fill={i%2===0 ? (isDark ? '#0A3A1A' : '#2E7D32') : (isDark ? '#155232' : '#388E3C')}
        />
      ))}
      {/* Rusty anchor */}
      <Circle cx={ancX} cy={ancTop+6} r={6} stroke={rust} strokeWidth={2.5} fill="none" />
      <Path d={`M ${ancX},${ancTop+12} L ${ancX},${ancTop+42}`} stroke={rust} strokeWidth={2.5} fill="none" />
      <Path d={`M ${ancX-14},${ancTop+16} L ${ancX+14},${ancTop+16}`} stroke={rust} strokeWidth={2} fill="none" />
      <Path d={`M ${ancX-18},${ancTop+38} L ${ancX+18},${ancTop+38}`} stroke={rust} strokeWidth={2} fill="none" />
      <Path d={`M ${ancX-18},${ancTop+38} Q ${ancX-20},${ancTop+48} ${ancX-14},${ancTop+50}`} stroke={rust} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d={`M ${ancX+18},${ancTop+38} Q ${ancX+20},${ancTop+48} ${ancX+14},${ancTop+50}`} stroke={rust} strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* Chain from anchor to floor */}
      <Path d={`M ${ancX},${ancTop+48} Q ${ancX-4},${sandTopY-12} ${ancX-6},${sandTopY}`} stroke={rust} strokeWidth={1.5} fill="none" strokeDasharray="4,3" opacity={0.6} />
      {/* Crab silhouette far right */}
      <Ellipse cx={width*0.90} cy={sandTopY+8} rx={10} ry={5} fill={isDark ? '#8C2A00' : '#FF7043'} opacity={0.75} />
      <Path d={`M ${width*0.88},${sandTopY+5} L ${width*0.84},${sandTopY-2} L ${width*0.80},${sandTopY+0}`} stroke={isDark ? '#8C2A00' : '#FF7043'} strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.75} />
      <Path d={`M ${width*0.92},${sandTopY+5} L ${width*0.96},${sandTopY-2} L ${width*1.00},${sandTopY+0}`} stroke={isDark ? '#8C2A00' : '#FF7043'} strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.75} />
      {/* Pebble cluster */}
      <Ellipse cx={width*0.44} cy={sandTopY+9}  rx={6} ry={3.5} fill={isDark ? '#3A2A18' : '#6D4C41'} opacity={0.72} />
      <Ellipse cx={width*0.50} cy={sandTopY+14} rx={4} ry={2.5} fill={isDark ? '#3A2A18' : '#795548'} opacity={0.62} />
      <Ellipse cx={width*0.38} cy={sandTopY+13} rx={5} ry={3}   fill={isDark ? '#2E2018' : '#5D4037'} opacity={0.66} />
      <Ellipse cx={width*0.62} cy={sandTopY+10} rx={3} ry={2}   fill={isDark ? '#3A2A18' : '#6D4C41'} opacity={0.58} />
      <Ellipse cx={width*0.68} cy={sandTopY+15} rx={4} ry={2.2} fill={isDark ? '#2E2018' : '#795548'} opacity={0.60} />
      {/* Seashell */}
      <Path d={`M ${width*0.84},${sandTopY+6} Q ${width*0.86},${sandTopY+2} ${width*0.88},${sandTopY+6} Q ${width*0.86},${sandTopY+13} ${width*0.84},${sandTopY+6} Z`} fill={isDark ? '#8A5A40' : '#FFCC80'} opacity={0.88} />
    </Svg>
  );
}

// 5 ─ Shipwreck ── dark murky, sunken hull + portholes + barnacles + mast + nets
function ShipwreckBackground({ width, height, isDark, uid }: BgProps) {
  const gW = `swW_${uid}`, gPlank = `swP_${uid}`, gMurk = `swM_${uid}`;
  const sandY   = height * 0.80;
  const hullX   = width  * 0.55;
  const hullTop = height * 0.08;
  const portCX  = hullX + 16;
  const portCY  = hullTop + 48;
  const port2CX = hullX + 10;
  const port2CY = hullTop + 96;
  const wood      = isDark ? '#2E1A0A' : '#4E342E';
  const woodLight = isDark ? '#3E2A18' : '#6D4C41';
  const metal     = isDark ? '#1A2530' : '#37474F';
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        <SvgGradient id={gW} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"   stopColor={isDark ? '#0C2A1A' : '#1B4020'} stopOpacity="1" />
          <Stop offset="0.45" stopColor={isDark ? '#071810' : '#103018'} stopOpacity="1" />
          <Stop offset="0.85" stopColor={isDark ? '#030C08' : '#061808'} stopOpacity="1" />
          <Stop offset="1"   stopColor={isDark ? '#010604' : '#030E04'} stopOpacity="1" />
        </SvgGradient>
        <SvgGradient id={gPlank} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={wood}      stopOpacity="1" />
          <Stop offset="1" stopColor={woodLight} stopOpacity="1" />
        </SvgGradient>
        <SvgGradient id={gMurk} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"   stopColor={isDark ? '#0A1E10' : '#1A3A20'} stopOpacity="0" />
          <Stop offset="1"   stopColor={isDark ? '#000802' : '#080E04'} stopOpacity="0.8" />
        </SvgGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${gW})`} />
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${gMurk})`} />
      {/* Murky suspended particles */}
      {([[0.08,0.25],[0.22,0.48],[0.40,0.18],[0.58,0.60],[0.16,0.72],[0.60,0.38],[0.78,0.20],[0.35,0.85],[0.70,0.75],[0.90,0.45]] as [number,number][]).map(([x,y],i) => (
        <Circle key={i} cx={width*x} cy={height*y} r={1 + (i%3)*0.5} fill="white" opacity={0.04+(i%3)*0.01} />
      ))}
      {/* Broken mast sticking up left */}
      <Path d={`M ${width*0.20},${sandY} L ${width*0.22},${height*0.08}`} stroke={wood} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.9} />
      <Path d={`M ${width*0.22},${height*0.16} L ${width*0.34},${height*0.20}`} stroke={wood} strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.8} />
      {/* Torn sail/net hanging from mast */}
      <Path d={`M ${width*0.22},${height*0.16} Q ${width*0.28},${height*0.32} ${width*0.26},${height*0.44}`} stroke={isDark ? '#3A3020' : '#5D4E30'} strokeWidth={1} fill="none" opacity={0.50} />
      <Path d={`M ${width*0.24},${height*0.18} Q ${width*0.30},${height*0.34} ${width*0.28},${height*0.46}`} stroke={isDark ? '#3A3020' : '#5D4E30'} strokeWidth={1} fill="none" opacity={0.45} />
      <Path d={`M ${width*0.22},${height*0.20} L ${width*0.26},${height*0.20}`} stroke={isDark ? '#3A3020' : '#5D4E30'} strokeWidth={0.8} fill="none" opacity={0.40} />
      <Path d={`M ${width*0.22},${height*0.26} L ${width*0.27},${height*0.27}`} stroke={isDark ? '#3A3020' : '#5D4E30'} strokeWidth={0.8} fill="none" opacity={0.38} />
      <Path d={`M ${width*0.22},${height*0.32} L ${width*0.27},${height*0.33}`} stroke={isDark ? '#3A3020' : '#5D4E30'} strokeWidth={0.8} fill="none" opacity={0.35} />
      {/* Ship hull (right side) */}
      <Path d={`M ${hullX},${hullTop} Q ${hullX+22},${hullTop+6} ${hullX+32},${height*0.48} Q ${hullX+30},${sandY-5} ${hullX+10},${sandY} L ${hullX},${sandY} Z`} fill={`url(#${gPlank})`} />
      {/* Hull planks */}
      {[18,34,50,68,86,106,128,148].map((dy,i) => (
        <Path key={i} d={`M ${hullX},${hullTop+dy} Q ${hullX+14},${hullTop+dy+4} ${hullX+30},${hullTop+dy+7+i*2}`} stroke={isDark ? '#1A0C04' : '#3E2723'} strokeWidth={1.5} fill="none" opacity={0.82} />
      ))}
      {/* Barnacles — more scattered */}
      {([[2,55],[7,70],[4,90],[12,108],[6,130],[10,148],[3,168],[14,80],[8,45],[16,120]] as [number,number][]).map(([dx,dy],i) => (
        <Ellipse key={i} cx={hullX+dx} cy={hullTop+dy} rx={3+(i%2)} ry={2+(i%2)*0.5} fill={metal} opacity={0.85} />
      ))}
      {/* Hull damage crack */}
      <Path d={`M ${hullX+8},${hullTop+115} L ${hullX+16},${hullTop+128} L ${hullX+10},${hullTop+142}`} stroke={isDark ? '#0A0804' : '#2A1A10'} strokeWidth={2} fill="none" opacity={0.9} />
      {/* Porthole 1 */}
      <Circle cx={portCX} cy={portCY} r={13} fill={metal} />
      <Circle cx={portCX} cy={portCY} r={10} fill={isDark ? '#0A1810' : '#1A3020'} />
      <Circle cx={portCX} cy={portCY} r={7}  fill={isDark ? '#0E2218' : '#204030'} opacity={0.75} />
      <Circle cx={portCX-2} cy={portCY-2} r={2.5} fill={isDark ? '#1A3828' : '#2E5040'} opacity={0.55} />
      {[0,90,180,270].map((deg,i) => {
        const rad = deg * Math.PI / 180;
        return <Circle key={i} cx={portCX+12.5*Math.cos(rad)} cy={portCY+12.5*Math.sin(rad)} r={1.5} fill={metal} />;
      })}
      {/* Porthole 2 (lower, smaller) */}
      <Circle cx={port2CX} cy={port2CY} r={9} fill={metal} />
      <Circle cx={port2CX} cy={port2CY} r={6.5} fill={isDark ? '#0A1810' : '#1A3020'} />
      <Circle cx={port2CX} cy={port2CY} r={4}  fill={isDark ? '#0E2218' : '#204030'} opacity={0.70} />
      {[0,90,180,270].map((deg,i) => {
        const rad = deg * Math.PI / 180;
        return <Circle key={i} cx={port2CX+8.5*Math.cos(rad)} cy={port2CY+8.5*Math.sin(rad)} r={1.2} fill={metal} />;
      })}
      {/* Anchor chain from porthole */}
      <Path d={`M ${portCX-8},${portCY+14} L ${portCX-13},${portCY+24} L ${portCX-6},${portCY+34} L ${portCX-12},${portCY+44} L ${portCX-5},${portCY+54} L ${portCX-9},${sandY-8}`} stroke={metal} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      {/* Rope on sandy floor */}
      <Path d={`M ${width*0.06},${sandY+5} Q ${width*0.18},${sandY-2} ${width*0.30},${sandY+7} Q ${width*0.40},${sandY+12} ${width*0.46},${sandY+9}`} stroke={isDark ? '#3A2A10' : '#795548'} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.82} />
      {/* Sandy floor */}
      <Path d={`M 0,${sandY} Q ${width*0.18},${sandY-7} ${width*0.45},${sandY+4} Q ${width*0.68},${sandY+9} ${width*0.88},${sandY-3} Q ${width*0.96},${sandY-1} ${width},${sandY+3} L ${width},${height} L 0,${height} Z`} fill={isDark ? '#3A2200' : '#6D4C41'} />
      {/* Sand ripples */}
      <Path d={`M ${width*0.08},${sandY+12} Q ${width*0.20},${sandY+8} ${width*0.32},${sandY+14}`} stroke={isDark ? '#5A3A10' : '#A1887F'} strokeWidth={1.2} fill="none" opacity={0.45} />
      {/* Seaweed from wreck base */}
      <Path d={`M ${hullX+4},${sandY} C ${hullX+2},${sandY-28} ${hullX+7},${sandY-46} ${hullX+5},${sandY-62} C ${hullX+3},${sandY-46} ${hullX},${sandY-28} ${hullX+4},${sandY}`} fill={isDark ? '#0A2E18' : '#1B5E20'} opacity={0.82} />
      <Path d={`M ${hullX+10},${sandY} C ${hullX+12},${sandY-20} ${hullX+8},${sandY-34} ${hullX+10},${sandY-50} C ${hullX+7},${sandY-34} ${hullX+6},${sandY-20} ${hullX+10},${sandY}`} fill={isDark ? '#0D3A1E' : '#2E7D32'} opacity={0.70} />
    </Svg>
  );
}

// 6 ─ Deep Reef ── dark rocky walls, cave entrance, coral formations, bioluminescence
function DeepReefBackground({ width, height, isDark, uid }: BgProps) {
  const gW = `drW_${uid}`, gGlow = `drG_${uid}`, gGlow2 = `drG2_${uid}`;
  const floorY = height * 0.78;
  const rock = isDark ? '#0C0A1A' : '#14103A';
  const rockMid = isDark ? '#100E20' : '#1C1648';
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        <SvgGradient id={gW} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"   stopColor={isDark ? '#0E0830' : '#1A0A5C'} stopOpacity="1" />
          <Stop offset="0.5" stopColor={isDark ? '#080522' : '#100640'} stopOpacity="1" />
          <Stop offset="0.85" stopColor={isDark ? '#050314' : '#0A0428'} stopOpacity="1" />
          <Stop offset="1"   stopColor={isDark ? '#030108' : '#060218'} stopOpacity="1" />
        </SvgGradient>
        <SvgGradient id={gGlow} x1="0.5" y1="1" x2="0.5" y2="0">
          <Stop offset="0" stopColor="#7C4DFF" stopOpacity="0.30" />
          <Stop offset="1" stopColor="#7C4DFF" stopOpacity="0"   />
        </SvgGradient>
        <SvgGradient id={gGlow2} x1="0.5" y1="1" x2="0.5" y2="0">
          <Stop offset="0" stopColor="#E040FB" stopOpacity="0.18" />
          <Stop offset="1" stopColor="#E040FB" stopOpacity="0"   />
        </SvgGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${gW})`} />
      {/* Phosphorescent glow from floor */}
      <Ellipse cx={width*0.50} cy={floorY} rx={width*0.75} ry={65} fill={`url(#${gGlow})`} />
      <Ellipse cx={width*0.28} cy={floorY} rx={width*0.30} ry={40} fill={`url(#${gGlow2})`} />
      {/* Left rocky wall — jagged */}
      <Path d={`M 0,0 L ${width*0.20},0 L ${width*0.24},${height*0.12} L ${width*0.17},${height*0.22} L ${width*0.22},${height*0.36} L ${width*0.14},${height*0.50} L ${width*0.20},${height*0.62} L ${width*0.15},${height*0.75} L ${width*0.20},${floorY} L 0,${floorY} Z`} fill={rock} />
      {/* Left wall rock texture ledges */}
      <Path d={`M ${width*0.20},${height*0.12} L ${width*0.26},${height*0.14}`} stroke={rockMid} strokeWidth={2} fill="none" opacity={0.7} />
      <Path d={`M ${width*0.17},${height*0.22} L ${width*0.12},${height*0.24}`} stroke={rockMid} strokeWidth={1.5} fill="none" opacity={0.6} />
      <Path d={`M ${width*0.22},${height*0.36} L ${width*0.28},${height*0.38}`} stroke={rockMid} strokeWidth={1.5} fill="none" opacity={0.6} />
      <Path d={`M ${width*0.14},${height*0.50} L ${width*0.08},${height*0.52}`} stroke={rockMid} strokeWidth={1.2} fill="none" opacity={0.5} />
      {/* Cave opening in left wall */}
      <Ellipse cx={width*0.14} cy={height*0.44} rx={20} ry={25} fill={isDark ? '#020108' : '#06030F'} />
      {/* Stalactites from cave ceiling */}
      <Path d={`M ${width*0.08},${height*0.30} L ${width*0.10},${height*0.30} L ${width*0.09},${height*0.40} Z`} fill={rock} />
      <Path d={`M ${width*0.12},${height*0.26} L ${width*0.14},${height*0.26} L ${width*0.13},${height*0.36} Z`} fill={rockMid} />
      <Path d={`M ${width*0.16},${height*0.28} L ${width*0.18},${height*0.28} L ${width*0.17},${height*0.37} Z`} fill={rock} />
      {/* Right rocky wall — jagged */}
      <Path d={`M ${width},0 L ${width*0.80},0 L ${width*0.76},${height*0.16} L ${width*0.83},${height*0.30} L ${width*0.77},${height*0.46} L ${width*0.84},${height*0.60} L ${width*0.79},${height*0.74} L ${width*0.82},${floorY} L ${width},${floorY} Z`} fill={rock} />
      {/* Right wall ledges */}
      <Path d={`M ${width*0.80},${height*0.16} L ${width*0.76},${height*0.18}`} stroke={rockMid} strokeWidth={2} fill="none" opacity={0.7} />
      <Path d={`M ${width*0.83},${height*0.30} L ${width*0.88},${height*0.32}`} stroke={rockMid} strokeWidth={1.5} fill="none" opacity={0.6} />
      <Path d={`M ${width*0.77},${height*0.46} L ${width*0.72},${height*0.48}`} stroke={rockMid} strokeWidth={1.5} fill="none" opacity={0.6} />
      <Path d={`M ${width*0.84},${height*0.60} L ${width*0.90},${height*0.62}`} stroke={rockMid} strokeWidth={1.2} fill="none" opacity={0.5} />
      {/* Giant center anemone */}
      <Path d={`M ${width*0.50},${floorY} L ${width*0.50},${floorY-26}`} stroke={isDark ? '#4A0070' : '#7B00A0'} strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <Ellipse cx={width*0.50} cy={floorY-26} rx={8} ry={6} fill={isDark ? '#5A0090' : '#8E24AA'} />
      {([[-22,-16],[-16,-24],[-8,-28],[0,-30],[8,-28],[16,-24],[22,-16],[26,-8],[18,0],[0,2],[-18,0],[-26,-8]] as [number,number][]).map(([dx,dy],i) => (
        <Path key={i} d={`M ${width*0.50},${floorY-26} Q ${width*0.50+dx*0.55},${floorY-26+dy*0.5} ${width*0.50+dx},${floorY-26+dy}`} stroke={i%3===0 ? (isDark ? '#6A0090' : '#9C27B0') : i%3===1 ? (isDark ? '#8A00B0' : '#BA68C8') : (isDark ? '#9A10C0' : '#CE93D8')} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      ))}
      {/* Left anemone (smaller, teal) */}
      <Path d={`M ${width*0.30},${floorY} L ${width*0.30},${floorY-16}`} stroke={isDark ? '#006060' : '#00838F'} strokeWidth={3} fill="none" strokeLinecap="round" />
      {([[-10,-12],[-5,-16],[0,-18],[5,-16],[10,-12],[12,-6],[-12,-6]] as [number,number][]).map(([dx,dy],i) => (
        <Path key={i} d={`M ${width*0.30},${floorY-16} Q ${width*0.30+dx*0.5},${floorY-16+dy*0.5} ${width*0.30+dx},${floorY-16+dy}`} stroke={isDark ? '#008080' : '#00ACC1'} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      ))}
      {/* Soft purple coral branches right */}
      <Path d={`M ${width*0.70},${floorY} L ${width*0.70},${floorY-48}`} stroke={isDark ? '#8A7ACA' : '#B0A0F0'} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d={`M ${width*0.70},${floorY-18} L ${width*0.63},${floorY-36}`} stroke={isDark ? '#8A7ACA' : '#B0A0F0'} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d={`M ${width*0.70},${floorY-28} L ${width*0.77},${floorY-46}`} stroke={isDark ? '#9A8ADA' : '#C5B8F8'} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d={`M ${width*0.70},${floorY-38} L ${width*0.66},${floorY-54}`} stroke={isDark ? '#8A7ACA' : '#B0A0F0'} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Path d={`M ${width*0.70},${floorY-38} L ${width*0.74},${floorY-56}`} stroke={isDark ? '#9A8ADA' : '#C5B8F8'} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Circle cx={width*0.63} cy={floorY-36} r={3}   fill={isDark ? '#9A8ACA' : '#C5B8F0'} opacity={0.85} />
      <Circle cx={width*0.77} cy={floorY-46} r={3}   fill={isDark ? '#9A8ACA' : '#C5B8F0'} opacity={0.85} />
      <Circle cx={width*0.66} cy={floorY-54} r={2.5} fill={isDark ? '#9A8ACA' : '#C5B8F0'} opacity={0.80} />
      <Circle cx={width*0.74} cy={floorY-56} r={2.5} fill={isDark ? '#9A8ACA' : '#C5B8F0'} opacity={0.80} />
      <Circle cx={width*0.70} cy={floorY-48} r={2}   fill={isDark ? '#9A8ACA' : '#C5B8F0'} opacity={0.75} />
      {/* Rocky floor */}
      <Path d={`M 0,${floorY} Q ${width*0.20},${floorY-5} ${width*0.45},${floorY+3} Q ${width*0.68},${floorY+6} ${width*0.85},${floorY-3} Q ${width*0.95},${floorY-1} ${width},${floorY+2} L ${width},${height} L 0,${height} Z`} fill={rock} />
      {/* Floor pebble textures */}
      <Ellipse cx={width*0.38} cy={floorY+8} rx={8} ry={4}   fill={rockMid} opacity={0.8} />
      <Ellipse cx={width*0.58} cy={floorY+10} rx={6} ry={3}  fill={rock}    opacity={0.9} />
      <Ellipse cx={width*0.72} cy={floorY+7}  rx={5} ry={2.5} fill={rockMid} opacity={0.7} />
      {/* Bioluminescent dots scattered */}
      {([[0.22,0.30],[0.38,0.52],[0.54,0.24],[0.72,0.56],[0.30,0.68],[0.60,0.42],[0.46,0.70],[0.16,0.50],[0.84,0.38]] as [number,number][]).map(([x,y],i) => (
        <Circle key={i} cx={width*x} cy={height*y} r={1.2+(i%3)*0.5} fill={i%2===0 ? '#7C4DFF' : '#E040FB'} opacity={0.30+i*0.04} />
      ))}
    </Svg>
  );
}

// 7 ─ Midnight Abyss ── near-black, whale, many stalactites, vents, anglerfish glow
function AbyssBackground({ width, height, isDark, uid }: BgProps) {
  const rockColor = isDark ? '#0A1620' : '#162030';
  const rockMid   = isDark ? '#0F1E2A' : '#1E2E3C';
  const rockDark  = isDark ? '#060E16' : '#0E1824';
  const gW = `abW_${uid}`, gG1 = `abG1_${uid}`, gG2 = `abG2_${uid}`, gVent = `abV_${uid}`, gVent2 = `abV2_${uid}`;
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        <SvgGradient id={gW} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"   stopColor={isDark ? '#030F1E' : '#060E1C'} stopOpacity="1" />
          <Stop offset="0.4" stopColor={isDark ? '#020A14' : '#04080E'} stopOpacity="1" />
          <Stop offset="0.8" stopColor={isDark ? '#01060A' : '#02040A'} stopOpacity="1" />
          <Stop offset="1"   stopColor={isDark ? '#000204' : '#010308'} stopOpacity="1" />
        </SvgGradient>
        <SvgGradient id={gG1} x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor="#00E5FF" stopOpacity="0.28" />
          <Stop offset="1" stopColor="#00E5FF" stopOpacity="0"   />
        </SvgGradient>
        <SvgGradient id={gG2} x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor="#7C4DFF" stopOpacity="0.22" />
          <Stop offset="1" stopColor="#7C4DFF" stopOpacity="0"   />
        </SvgGradient>
        <SvgGradient id={gVent} x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor="#FF6D00" stopOpacity="0.45" />
          <Stop offset="1" stopColor="#FF6D00" stopOpacity="0"   />
        </SvgGradient>
        <SvgGradient id={gVent2} x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor="#FF3D00" stopOpacity="0.30" />
          <Stop offset="1" stopColor="#FF3D00" stopOpacity="0"   />
        </SvgGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${gW})`} />
      {/* Left rocky wall with cracks */}
      <Path d={`M 0,0 L ${width*0.12},0 L ${width*0.10},${height*0.22} L ${width*0.14},${height*0.44} L ${width*0.09},${height*0.66} L ${width*0.13},${height*0.84} L ${width*0.07},${height} L 0,${height} Z`} fill={rockColor} />
      <Path d={`M ${width*0.10},${height*0.22} L ${width*0.05},${height*0.30} L ${width*0.08},${height*0.36}`} stroke={rockMid} strokeWidth={1} fill="none" opacity={0.65} />
      <Path d={`M ${width*0.14},${height*0.44} L ${width*0.18},${height*0.52} L ${width*0.15},${height*0.58}`} stroke={rockMid} strokeWidth={1} fill="none" opacity={0.60} />
      <Path d={`M ${width*0.09},${height*0.66} L ${width*0.04},${height*0.72}`} stroke={rockMid} strokeWidth={0.8} fill="none" opacity={0.55} />
      {/* Right rocky wall with cracks */}
      <Path d={`M ${width},0 L ${width*0.88},0 L ${width*0.90},${height*0.20} L ${width*0.86},${height*0.42} L ${width*0.91},${height*0.62} L ${width*0.86},${height*0.80} L ${width*0.93},${height} L ${width},${height} Z`} fill={rockColor} />
      <Path d={`M ${width*0.90},${height*0.20} L ${width*0.95},${height*0.28} L ${width*0.92},${height*0.35}`} stroke={rockMid} strokeWidth={1} fill="none" opacity={0.65} />
      <Path d={`M ${width*0.86},${height*0.42} L ${width*0.82},${height*0.50} L ${width*0.85},${height*0.56}`} stroke={rockMid} strokeWidth={1} fill="none" opacity={0.60} />
      <Path d={`M ${width*0.91},${height*0.62} L ${width*0.96},${height*0.68}`} stroke={rockMid} strokeWidth={0.8} fill="none" opacity={0.55} />
      {/* Stalactites from ceiling — 8 of them */}
      <Path d={`M ${width*0.06},0 L ${width*0.12},0 L ${width*0.10},36 L ${width*0.08},26 Z`} fill={rockColor} />
      <Path d={`M ${width*0.20},0 L ${width*0.26},0 L ${width*0.23},24 Z`} fill={rockMid} />
      <Path d={`M ${width*0.34},0 L ${width*0.40},0 L ${width*0.38},42 L ${width*0.36},30 Z`} fill={rockDark} />
      <Path d={`M ${width*0.48},0 L ${width*0.53},0 L ${width*0.51},28 Z`} fill={rockColor} />
      <Path d={`M ${width*0.60},0 L ${width*0.67},0 L ${width*0.65},46 L ${width*0.62},34 Z`} fill={rockMid} />
      <Path d={`M ${width*0.72},0 L ${width*0.78},0 L ${width*0.75},32 Z`} fill={rockDark} />
      <Path d={`M ${width*0.82},0 L ${width*0.88},0 L ${width*0.86},38 L ${width*0.84},26 Z`} fill={rockColor} />
      {/* Whale silhouette — larger, more detailed */}
      <Path d={`M ${width*0.08},${height*0.36} Q ${width*0.28},${height*0.24} ${width*0.52},${height*0.30} Q ${width*0.66},${height*0.34} ${width*0.70},${height*0.28} L ${width*0.76},${height*0.38} Q ${width*0.70},${height*0.45} ${width*0.52},${height*0.42} Q ${width*0.28},${height*0.48} ${width*0.08},${height*0.36} Z`} fill="rgba(0,0,0,0.28)" />
      {/* Whale tail */}
      <Path d={`M ${width*0.70},${height*0.28} Q ${width*0.78},${height*0.20} ${width*0.82},${height*0.24} Q ${width*0.78},${height*0.32} ${width*0.76},${height*0.38} Z`} fill="rgba(0,0,0,0.26)" />
      {/* Whale eye */}
      <Circle cx={width*0.14} cy={height*0.36} r={1.5} fill="rgba(255,255,255,0.10)" />
      {/* Whale belly lighter */}
      <Path d={`M ${width*0.12},${height*0.40} Q ${width*0.30},${height*0.44} ${width*0.50},${height*0.42} Q ${width*0.62},${height*0.41} ${width*0.68},${height*0.42}`} stroke="rgba(255,255,255,0.05)" strokeWidth={2} fill="none" />
      {/* Bioluminescent area glows (mid-water) */}
      <Ellipse cx={width*0.22} cy={height*0.55} rx={44} ry={30} fill={`url(#${gG1})`} />
      <Ellipse cx={width*0.75} cy={height*0.42} rx={38} ry={24} fill={`url(#${gG2})`} />
      <Ellipse cx={width*0.58} cy={height*0.18} rx={20} ry={14} fill={`url(#${gG2})`} opacity={0.50} />
      {/* Anglerfish glow — faint lure light */}
      <Circle cx={width*0.72} cy={height*0.55} r={8} fill="#69F0AE" opacity={0.14} />
      <Circle cx={width*0.72} cy={height*0.55} r={4} fill="#69F0AE" opacity={0.22} />
      <Circle cx={width*0.72} cy={height*0.53} r={2} fill="#A5F3C8" opacity={0.50} />
      {/* ── ABYSS FLOOR (at height - 55) ── */}
      {(() => {
        const fy = height - Math.round(height / 8);
        return (<>
          {/* Floor glow from thermal heat */}
          <Ellipse cx={width*0.50} cy={fy+10} rx={width*0.55} ry={32} fill={`url(#${gVent})`} opacity={0.45} />
          {/* Jagged rocky floor */}
          <Path d={`M 0,${fy+8} Q ${width*0.08},${fy-4} ${width*0.16},${fy+6} Q ${width*0.24},${fy+14} ${width*0.32},${fy+2} Q ${width*0.40},${fy-8} ${width*0.50},${fy+4} Q ${width*0.60},${fy+12} ${width*0.68},${fy-2} Q ${width*0.76},${fy-10} ${width*0.84},${fy+6} Q ${width*0.92},${fy+14} ${width},${fy+2} L ${width},${height} L 0,${height} Z`} fill={rockColor} />
          {/* Floor mid layer for depth */}
          <Path d={`M 0,${fy+18} Q ${width*0.15},${fy+12} ${width*0.30},${fy+20} Q ${width*0.50},${fy+28} ${width*0.70},${fy+18} Q ${width*0.85},${fy+10} ${width},${fy+22} L ${width},${height} L 0,${height} Z`} fill={rockDark} opacity={0.85} />
          {/* Rock formations sitting on floor */}
          <Path d={`M ${width*0.18},${fy+6} Q ${width*0.22},${fy-18} ${width*0.26},${fy+4} Z`} fill={rockMid} />
          <Path d={`M ${width*0.60},${fy+4} Q ${width*0.64},${fy-22} ${width*0.70},${fy+2} Z`} fill={rockColor} />
          <Path d={`M ${width*0.78},${fy+6} Q ${width*0.80},${fy-12} ${width*0.84},${fy+4} Z`} fill={rockMid} />
          {/* Floor cracks */}
          <Path d={`M ${width*0.38},${fy+10} L ${width*0.42},${fy+20} L ${width*0.40},${fy+30}`} stroke={isDark ? '#1A2E3E' : '#243848'} strokeWidth={1} fill="none" opacity={0.6} />
          <Path d={`M ${width*0.55},${fy+14} L ${width*0.58},${fy+24}`} stroke={isDark ? '#1A2E3E' : '#243848'} strokeWidth={0.8} fill="none" opacity={0.5} />
          {/* Primary thermal vent on floor */}
          <Path d={`M ${width*0.44},${fy+8} L ${width*0.46},${fy-28} L ${width*0.48},${fy+6} Z`} fill={isDark ? '#2A1200' : '#3A1A00'} />
          <Path d={`M ${width*0.52},${fy+6} L ${width*0.54},${fy-24} L ${width*0.56},${fy+8} Z`} fill={isDark ? '#2A1200' : '#3A1A00'} />
          <Ellipse cx={width*0.50} cy={fy-20} rx={22} ry={14} fill={`url(#${gVent})`} />
          <Circle  cx={width*0.46} cy={fy-22} r={4} fill="#FF6D00" opacity={0.30} />
          <Circle  cx={width*0.54} cy={fy-20} r={3} fill="#FF8C00" opacity={0.24} />
          {/* Secondary vent left on floor */}
          <Path d={`M ${width*0.20},${fy+10} L ${width*0.22},${fy-14} L ${width*0.24},${fy+8} Z`} fill={isDark ? '#2A1200' : '#3A1A00'} />
          <Ellipse cx={width*0.22} cy={fy-10} rx={13} ry={8} fill={`url(#${gVent2})`} />
          <Circle  cx={width*0.22} cy={fy-10} r={2.5} fill="#FF6D00" opacity={0.22} />
          {/* Floor glow dots */}
          <Circle cx={width*0.30} cy={fy+4}  r={2.5} fill="#00E5FF" opacity={0.40} />
          <Circle cx={width*0.48} cy={fy+8}  r={2.0} fill="#69F0AE" opacity={0.38} />
          <Circle cx={width*0.65} cy={fy+4}  r={2.5} fill="#00E5FF" opacity={0.36} />
          <Circle cx={width*0.82} cy={fy+6}  r={1.8} fill="#7C4DFF" opacity={0.42} />
        </>);
      })()}
      {/* Bioluminescent dots — mid-water only (above floor) */}
      {([[0.14,0.35,2.5,'#00E5FF',0.55],[0.36,0.50,2.0,'#7C4DFF',0.50],[0.60,0.25,3.0,'#00E5FF',0.42],[0.80,0.60,2.0,'#69F0AE',0.52],
         [0.44,0.14,1.5,'#7C4DFF',0.48],[0.27,0.46,1.5,'#69F0AE',0.40],[0.86,0.22,2.0,'#7C4DFF',0.38],
         [0.50,0.44,1.8,'#00E5FF',0.35],[0.42,0.62,1.5,'#69F0AE',0.45],[0.78,0.38,1.8,'#7C4DFF',0.38],[0.18,0.58,1.5,'#00E5FF',0.42],
      ] as [number,number,number,string,number][]).map(([x,y,r,fill,op],i) => (
        <Circle key={i} cx={width*x} cy={height*y} r={r} fill={fill} opacity={op} />
      ))}
    </Svg>
  );
}

// ─── Animated seaweed ─────────────────────────────────

function Seaweed({ x, floorY, tankWidth, color1, color2, delay }: {
  x: number; floorY: number; tankWidth: number;
  color1: string; color2: string; delay: number;
}) {
  const sway = useRef(new Animated.Value(0)).current;
  const PLANT_H = 72;
  const PLANT_W = 18;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 2200 + delay * 0.3, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(sway, { toValue: -1, duration: 2200 + delay * 0.3, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);

  // Skew simulates sway from base
  const skewX = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - PLANT_W / 2,
        top: floorY - PLANT_H + 14,
        width: PLANT_W,
        height: PLANT_H,
        transform: [{ skewX }],
      }}
      pointerEvents="none"
    >
      <Svg viewBox="0 0 18 72" width={PLANT_W} height={PLANT_H}>
        {/* Stem */}
        <Path d="M 9,72 Q 7,54 9,36 Q 11,18 9,0" stroke={color1} strokeWidth={3} fill="none" strokeLinecap="round" />
        {/* Leaves */}
        <Path d="M 9,54 Q 0,46 4,36 Q 10,46 9,54" fill={color2} />
        <Path d="M 9,40 Q 18,32 14,22 Q 8,32 9,40" fill={color1} />
        <Path d="M 9,26 Q 0,18 4,8  Q 10,18 9,26" fill={color2} opacity={0.9} />
      </Svg>
    </Animated.View>
  );
}

// ─── Bubble ───────────────────────────────────────────

function Bubble({ tankWidth, delay, startY, color }: {
  tankWidth: number; delay: number; startY: number; color?: string;
}) {
  const posY    = useRef(new Animated.Value(startY)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const x        = useRef(16 + Math.random() * (tankWidth - 32)).current;
  const r        = useRef(2 + Math.random() * 4).current;
  const duration = useRef(3200 + Math.random() * 2400).current;

  useEffect(() => {
    const run = () => {
      posY.setValue(startY);
      opacity.setValue(0.65);
      Animated.parallel([
        Animated.timing(posY,    { toValue: 0, duration, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(opacity, { toValue: 0, duration, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setTimeout(run, 800 + Math.random() * 2000);
      });
    };
    const t = setTimeout(run, delay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - r,
        width: r * 2, height: r * 2, borderRadius: r,
        borderWidth: 1, borderColor: color ?? 'rgba(255,255,255,0.9)',
        backgroundColor: color ? color + '22' : 'rgba(255,255,255,0.12)',
        opacity, transform: [{ translateY: posY }],
      }}
      pointerEvents="none"
    />
  );
}

// ─── Movement styles ──────────────────────────────────

type MovementStyle = 'swim' | 'crawl' | 'drift' | 'glide' | 'hover' | 'sink' | 'undulate' | 'vertical';

// Per-species movement override (default = 'swim')
const SPECIES_MOVEMENT: Record<string, MovementStyle> = {
  // Trash — rest on the floor
  worm:                  'crawl',
  apple_core:            'sink',
  bottle:                'sink',
  lure:                  'sink',
  rusty_can:             'sink',
  seaweed:               'sink',
  // Ground crawlers — linear horizontal, no bob
  mussel:                'crawl',
  goby:                  'crawl',
  starfish:              'sink',
  flounder:              'crawl',
  crab_dungeness:        'crawl',
  crab_blue:             'crawl',
  crab_king:             'crawl',
  // Stationary floor items — gentle sway in place
  coral:                 'sink',
  seashell:              'sink',
  sand_dollar:           'sink',
  upside_down_jellyfish: 'sink',
  pearl:                 'sink',
  // Hoverers — drift over small range with relaxed bob
  seahorse:              'hover',
  jellyfish:             'hover',
  anglerfish:            'hover',
  pufferfish:            'hover',
  // Fast sleek gliders — minimal bob, high speed
  tuna:                  'glide',
  great_white_shark:     'glide',
  stingray:              'glide',
  // Undulators — rapid vertical oscillation while moving
  moray_eel:             'undulate',
  ribbon_eel:            'undulate',
  // Otter — bobs up and down at the surface
  otter:                 'vertical',
};

// ─── Swimming fish ────────────────────────────────────

function SwimmingFish({ speciesId, tankWidth, yPosition, speed, fishHeight, movement }: {
  speciesId: string;
  tankWidth: number;
  yPosition: number;
  speed: number;
  fishHeight: number;
  movement: MovementStyle;
}) {
  const vis     = SPECIES_VISUALS[speciesId];
  const variant = vis?.variant ?? 'oval';
  const { width: fishW } = getFishDimensions(variant, fishHeight);

  const maxX       = Math.max(0, tankWidth - fishW - 10);
  const startX     = useRef(Math.random() * maxX).current;
  const startRight = useRef(startX < maxX / 2).current;

  const posX   = useRef(new Animated.Value(startX)).current;
  const posY   = useRef(new Animated.Value(0)).current;
  // Use Animated.Value for scaleX so the flip is instant on the native thread —
  // no React re-render lag that would cause a single frame of backward swimming.
  const scaleX = useRef(new Animated.Value(startRight ? 1 : -1)).current;

  useEffect(() => {
    if (movement !== 'vertical' && maxX <= 0) return;

    // ── Vertical bob — amplitude and period per movement style ──
    type BobCfg = { amp: number; period: number };
    const bobCfg: BobCfg =
      movement === 'swim'     ? { amp: 5,  period: 1600 } :
      movement === 'glide'    ? { amp: 2,  period: 1200 } :
      movement === 'drift'    ? { amp: 3,  period: 2800 } :
      movement === 'sink'     ? { amp: 2,  period: 3600 } :
      movement === 'hover'    ? { amp: 6,  period: 1300 } :
      movement === 'undulate' ? { amp: 10, period: 420  } :
      movement === 'vertical' ? { amp: 0,  period: 0    } :
      /* crawl */               { amp: 0,  period: 0    };

    const bob = bobCfg.amp > 0
      ? Animated.loop(Animated.sequence([
          Animated.timing(posY, { toValue:  bobCfg.amp, duration: bobCfg.period, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(posY, { toValue: -bobCfg.amp, duration: bobCfg.period, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ]))
      : null;
    bob?.start();

    // ── Horizontal movement ──
    if (movement === 'sink') {
      return () => { bob?.stop(); };
    }

    if (movement === 'vertical') {
      const topY    = 12 - yPosition;
      const bottomY = Math.max(topY + 20, (140 - fishHeight) - yPosition);
      let goingDown = true;
      const moveVert = () => {
        Animated.timing(posY, {
          toValue: goingDown ? bottomY : topY,
          duration: 2800 + Math.random() * 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }).start(({ finished }) => {
          if (finished) { goingDown = !goingDown; moveVert(); }
        });
      };
      moveVert();
      return () => { posY.stopAnimation(); };
    }

    if (movement === 'hover') {
      const range = 38;
      const lo = Math.max(0, startX - range);
      const hi = Math.min(maxX, startX + range);
      let going = startRight;
      const drift = () => {
        Animated.timing(posX, {
          toValue: going ? hi : lo,
          duration: 2600 + Math.random() * 1800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }).start(({ finished }) => {
          if (finished) { going = !going; scaleX.setValue(going ? 1 : -1); drift(); }
        });
      };
      drift();
      return () => { bob?.stop(); posX.stopAnimation(); };
    }

    const swimSpeed =
      movement === 'glide'    ? speed * 0.5  :
      movement === 'drift'    ? speed * 2.4  :
      movement === 'crawl'    ? speed * 1.7  :
      movement === 'undulate' ? speed * 0.85 :
      speed;

    let going = startRight;
    const swim = () => {
      Animated.timing(posX, {
        toValue: going ? maxX : 0,
        duration: swimSpeed,
        useNativeDriver: true,
        easing: Easing.linear,
      }).start(({ finished }) => {
        if (finished) { going = !going; scaleX.setValue(going ? 1 : -1); swim(); }
      });
    };
    swim();

    return () => { bob?.stop(); posX.stopAnimation(); posY.stopAnimation(); };
  }, [maxX]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: yPosition,
        transform: [
          { translateX: posX },
          { translateY: posY },
          { scaleX },
        ],
      }}
      pointerEvents="none"
    >
      <FishSVG speciesId={speciesId} size={fishHeight} />
    </Animated.View>
  );
}

// ─── Bioluminescent orb (depths decoration) ───────────

function GlowOrb({ x, y, color, delay }: { x: number; y: number; color: string; delay: number }) {
  const glow = useRef(new Animated.Value(0.3)).current;
  const r = useRef(3 + Math.random() * 4).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 1,   duration: 1400 + Math.random() * 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(glow, { toValue: 0.2, duration: 1400 + Math.random() * 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', left: x - r * 3, top: y - r * 3,
        width: r * 6, height: r * 6, borderRadius: r * 3,
        backgroundColor: color + '55',
        shadowColor: color, shadowOpacity: 0.9, shadowRadius: r * 2.5,
        opacity: glow,
      }}
    />
  );
}

// ─── Biome tank ───────────────────────────────────────

const BIOME_FISH_LAYER: Record<FishHabitat, { yMin: number; yMax: number; size: number }> = {
  surface: { yMin: 12,  yMax: 140, size: 36 },
  floor:   { yMin: 30,  yMax: 130, size: 36 },
  depths:  { yMin: 15,  yMax: 160, size: 32 },
};

type BiomeCfg = {
  id: BiomeKey; name: string; habitat: FishHabitat;
  unlockHint: string; speciesIds: readonly string[]; dotColor: string;
};

const BIOME_CONFIGS: BiomeCfg[] = [
  { id: 'shallows',   name: 'Sunlit Shallows', habitat: 'surface', unlockHint: '',                               dotColor: '#4DD0E1',
    speciesIds: ['worm','apple_core','bottle','lure','goldfish','guppy','bluegill','otter'] },
  { id: 'open_water', name: 'Open Water',      habitat: 'surface', unlockHint: 'Collect 2 unique surface fish',   dotColor: '#29B6F6',
    speciesIds: ['silverjaw_minnow','tadpole','anchovy','bass','yellow_perch','neon_tetra','surgeonfish'] },
  { id: 'coral_reef', name: 'Coral Reef',      habitat: 'surface', unlockHint: 'Collect 4 unique surface fish',   dotColor: '#FF7043',
    speciesIds: ['jellyfish','carp','rainbow_trout','salmon','angelfish','tuna','arowana'] },
  { id: 'sandy_bed',  name: 'Sandy Bed',       habitat: 'floor',   unlockHint: 'Collect 6 unique surface fish',   dotColor: '#FFB74D',
    speciesIds: ['rusty_can','seaweed','mussel','goby','shrimp','starfish','catfish'] },
  { id: 'shipwreck',  name: 'Shipwreck',       habitat: 'floor',   unlockHint: 'Collect 14 unique fish total',    dotColor: '#8D6E63',
    speciesIds: ['clownfish','yellow_tang','flounder','crab_dungeness','coral','seashell','sand_dollar'] },
  { id: 'deep_reef',  name: 'Deep Reef',       habitat: 'floor',   unlockHint: 'Collect 16 unique fish total',    dotColor: '#9C27B0',
    speciesIds: ['seahorse','pufferfish','blue_groper','napoleon_wrasse','purple_tang','blue_angelfish','crab_blue'] },
  { id: 'abyss',      name: 'Midnight Abyss',  habitat: 'depths',  unlockHint: 'Collect 10 unique floor fish',    dotColor: '#7C4DFF',
    speciesIds: ['ribbon_eel','anglerfish','pearl','crab_king','great_white_shark','moray_eel','stingray','upside_down_jellyfish'] },
];

const DARK_BIOMES      = new Set<BiomeKey>(['deep_reef', 'abyss']);
const GROUNDED_BIOMES  = new Set<BiomeKey>(['shallows', 'coral_reef', 'sandy_bed', 'shipwreck']);

function BiomeTank({ biome, fish, isDark, locked, uid, tankH = BIOME_HEIGHT }: {
  biome: BiomeCfg; fish: OwnedFish[]; isDark: boolean;
  locked?: boolean; uid: string; tankH?: number;
}) {
  const [tankWidth, setTankWidth] = useState(0);

  const layer = BIOME_FISH_LAYER[biome.habitat];
  const fishConfigs = useMemo(() => fish.map((f) => {
    const movement: MovementStyle = SPECIES_MOVEMENT[f.speciesId] ?? 'swim';
    const floorSeatY = tankH - Math.round(tankH / 8) - layer.size;
    let yPosition: number;
    if (movement === 'crawl' || movement === 'sink') {
      yPosition = floorSeatY;
    } else if (movement === 'drift' && biome.habitat === 'surface') {
      yPosition = 6 + Math.random() * 18;
    } else {
      yPosition = layer.yMin + Math.random() * (layer.yMax - layer.yMin);
    }
    return { id: f.id, speciesId: f.speciesId, yPosition, speed: 6000 + Math.random() * 6000, fishHeight: layer.size, movement };
  }), [fish.map((f) => f.id).join(',')]);

  const floorY      = tankH - BIOME_FLOOR;
  const plantColor1 = isDark ? '#0A3020' : '#1B5E20';
  const plantColor2 = isDark ? '#155232' : '#2E7D32';
  const isDarkBiome     = DARK_BIOMES.has(biome.id);
  const isGrounded      = GROUNDED_BIOMES.has(biome.id);
  const bubbleStart = biome.habitat === 'floor' ? floorY - 20 : tankH - 20;

  const BgMap = {
    shallows:   ShallowsBackground,
    open_water: OpenWaterBackground,
    coral_reef: CoralReefBackground,
    sandy_bed:  SandyBedBackground,
    shipwreck:  ShipwreckBackground,
    deep_reef:  DeepReefBackground,
    abyss:      AbyssBackground,
  } as const;
  const Bg = BgMap[biome.id];

  return (
    <View>
      {/* Biome label */}
      <View style={styles.biomeLabelRow}>
        <View style={[styles.biomeDot, { backgroundColor: biome.dotColor }]} />
        <Text style={[styles.biomeLabel, { color: isDark ? '#AAC8E0' : '#2A5F80' }]}>{biome.name}</Text>
        {locked && (
          <View style={[styles.lockBadge, { backgroundColor: isDark ? '#1A2530' : '#E8F4F8' }]}>
            <Ionicons name="lock-closed" size={10} color={isDark ? '#607D8B' : '#90A4AE'} />
            <Text style={[styles.lockBadgeText, { color: isDark ? '#607D8B' : '#90A4AE' }]}>
              {biome.unlockHint}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.biome, { height: tankH }]} onLayout={(e) => setTankWidth(e.nativeEvent.layout.width)}>
        {tankWidth > 0 && <Bg width={tankWidth} height={tankH} isDark={isDark} uid={uid} />}

        {!locked && (
          <>
            {/* Seaweed (grounded biomes with sandy/earthy floor only) */}
            {tankWidth > 0 && isGrounded && [
              { x: tankWidth * 0.07, delay: 0 },
              { x: tankWidth * 0.16, delay: 280 },
              { x: tankWidth * 0.44, delay: 550 },
              { x: tankWidth * 0.55, delay: 180 },
              { x: tankWidth * 0.81, delay: 420 },
              { x: tankWidth * 0.91, delay: 130 },
            ].map((p, i) => (
              <Seaweed key={i} x={p.x} floorY={floorY} tankWidth={tankWidth}
                color1={plantColor1} color2={plantColor2} delay={p.delay} />
            ))}

            {/* Glow orbs (dark biomes) */}
            {tankWidth > 0 && isDarkBiome && [
              { x: tankWidth * 0.12, y: tankH * 0.35, color: '#00E5FF', delay: 0 },
              { x: tankWidth * 0.35, y: tankH * 0.65, color: '#7C4DFF', delay: 600 },
              { x: tankWidth * 0.58, y: tankH * 0.28, color: '#69F0AE', delay: 1100 },
              { x: tankWidth * 0.78, y: tankH * 0.72, color: '#00E5FF', delay: 400 },
              { x: tankWidth * 0.48, y: tankH * 0.50, color: '#7C4DFF', delay: 900 },
              { x: tankWidth * 0.88, y: tankH * 0.42, color: '#69F0AE', delay: 200 },
            ].map((orb, i) => <GlowOrb key={i} {...orb} />)}

            {/* Bubbles */}
            {tankWidth > 0 && [0, 900, 2100, 3800].map((delay, i) => (
              <Bubble key={i} tankWidth={tankWidth} delay={delay} startY={bubbleStart}
                color={isDarkBiome ? '#00E5FF' : undefined} />
            ))}

            {/* Fish */}
            {tankWidth > 0 && fishConfigs.map((cfg) => (
              <SwimmingFish key={cfg.id} speciesId={cfg.speciesId} tankWidth={tankWidth}
                yPosition={cfg.yPosition} speed={cfg.speed} fishHeight={cfg.fishHeight}
                movement={cfg.movement} />
            ))}

            {/* Empty state */}
            {fish.length === 0 && (
              <View style={styles.biomeEmpty}>
                <Text style={styles.biomeEmptyText}>No {biome.name.toLowerCase()} creatures yet</Text>
              </View>
            )}
          </>
        )}

        {/* Lock overlay */}
        {locked && (
          <View style={styles.lockedOverlay}>
            <View style={styles.lockedIconBg}>
              <Ionicons name="lock-closed" size={26} color="rgba(255,255,255,0.80)" />
            </View>
            <Text style={styles.lockedTitle}>Locked Biome</Text>
            <Text style={styles.lockedSub}>
              {biome.unlockHint}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Hatch animation modal ────────────────────────────

const TAP_HINTS = ['Tap the egg!', 'Keep tapping!', 'One more!'];
const CRACK_COLORS = ['rgba(255,255,255,0.55)', 'rgba(255,240,180,0.75)', 'rgba(255,200,80,0.90)'];

function HatchingModal({ egg, uid, discoveredIds, onComplete }: {
  egg: FishEgg;
  uid: string;
  discoveredIds: Set<string>;
  onComplete: (species: FishSpecies, isNew: boolean) => void;
}) {
  const [tapCount, setTapCount]   = useState(0);
  const [phase, setPhase]         = useState<'tapping' | 'bursting' | 'revealed'>('tapping');
  const [result, setResult]       = useState<{ species: FishSpecies; isNew: boolean } | null>(null);
  const tapping = useRef(false);

  const bgOp      = useRef(new Animated.Value(0)).current;
  const shakeX    = useRef(new Animated.Value(0)).current;
  const eggScale  = useRef(new Animated.Value(1)).current;
  const crack1Op  = useRef(new Animated.Value(0)).current;
  const crack2Op  = useRef(new Animated.Value(0)).current;
  const crack3Op  = useRef(new Animated.Value(0)).current;
  const flashOp   = useRef(new Animated.Value(0)).current;
  const fishScale = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0)).current;
  const infoOp    = useRef(new Animated.Value(0)).current;
  const hintOp    = useRef(new Animated.Value(1)).current;
  const eggBounce = useRef(new Animated.Value(1)).current;

  // Background fade in
  useEffect(() => {
    Animated.timing(bgOp, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, []);

  const runBurst = async () => {
    setPhase('bursting');

    // Final big shake
    await new Promise<void>((resolve) => {
      Animated.sequence([
        Animated.timing(shakeX, { toValue: -18, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  18, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -14, duration: 35, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  14, duration: 35, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:   0, duration: 30, useNativeDriver: true }),
      ]).start(() => resolve());
    });

    // Flash + egg vanish
    await new Promise<void>((resolve) => {
      Animated.sequence([
        Animated.timing(flashOp,  { toValue: 1, duration: 80,  useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(flashOp,  { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(eggScale, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(crack1Op, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(crack2Op, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(crack3Op, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]),
      ]).start(() => resolve());
    });

    // Fish spring in
    setPhase('revealed');
    Animated.parallel([
      Animated.spring(fishScale, { toValue: 1, tension: 85, friction: 6, useNativeDriver: true }),
      Animated.spring(glowScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    await new Promise((r) => setTimeout(r, 400));
    Animated.timing(infoOp, { toValue: 1, duration: 360, useNativeDriver: true }).start();
  };

  const handleTap = () => {
    if (phase !== 'tapping' || tapping.current) return;
    tapping.current = true;

    const next = tapCount + 1;
    setTapCount(next);

    // Pick crack opacity ref
    const crackRef = next === 1 ? crack1Op : next === 2 ? crack2Op : crack3Op;

    // Intensity grows with each tap
    const shakeAmt = 8 + next * 4;
    const bounceS  = 1 + next * 0.06;

    // Hint flash out/in
    Animated.sequence([
      Animated.timing(hintOp, { toValue: 0, duration: 80, useNativeDriver: true }),
      Animated.timing(hintOp, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      // Shake
      Animated.sequence([
        Animated.timing(shakeX,    { toValue: -shakeAmt, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeX,    { toValue:  shakeAmt, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeX,    { toValue: -shakeAmt * 0.6, duration: 35, useNativeDriver: true }),
        Animated.timing(shakeX,    { toValue:  0,        duration: 35, useNativeDriver: true }),
      ]),
      // Bounce scale
      Animated.sequence([
        Animated.timing(eggBounce, { toValue: bounceS,  duration: 80,  useNativeDriver: true }),
        Animated.spring(eggBounce, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
      ]),
      // Crack fades in
      Animated.timing(crackRef,    { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      tapping.current = false;
      if (next === 3) {
        // Fetch the result (fire & forget; we don't need to await it before the burst)
        hatchEgg(uid, egg.id).then(({ species }) => {
          const isNew = !discoveredIds.has(species.id);
          setResult({ species, isNew });
        });
        runBurst();
      }
    });
  };

  const rarityColor = result ? RARITY_COLORS[result.species.rarity] : '#29B6F6';
  const hintText = phase === 'tapping' ? TAP_HINTS[tapCount] ?? '' : '';

  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.hatchOverlay, { opacity: bgOp }]}>
        <View style={styles.hatchCard}>

          {/* Title */}
          <Text style={[styles.hatchTitle, { color: phase === 'revealed' && result ? rarityColor : '#C8E6FF' }]}>
            {phase === 'revealed' && result
              ? (result.isNew ? '✨ New Discovery!' : 'Fish Hatched!')
              : phase === 'bursting' ? 'Hatching...' : 'Hatch your Egg'}
          </Text>

          {/* Tap hint dots */}
          {phase === 'tapping' && (
            <View style={styles.hatchDotsRow}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.hatchDot, { backgroundColor: i < tapCount ? '#FFD54F' : '#1A3050' }]} />
              ))}
            </View>
          )}

          {/* Main display area */}
          <TouchableOpacity
            activeOpacity={phase === 'tapping' ? 0.9 : 1}
            onPress={handleTap}
            disabled={phase !== 'tapping'}
            style={styles.hatchCenter}
          >
            {phase !== 'revealed' ? (
              // Emoji egg + crack SVG layers stacked in a fixed-size box
              <Animated.View style={{ width: 100, height: 100, alignItems: 'center', justifyContent: 'center', transform: [{ translateX: shakeX }, { scale: eggBounce }] }}>
                <Text style={{ fontSize: 80, lineHeight: 100, textAlign: 'center' }}>🥚</Text>

                {/* Tap 1 — hairline at top-center */}
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: crack1Op }]} pointerEvents="none">
                  <Svg width={100} height={100}>
                    <Path d="M 50,10 L 46,28 L 53,38 L 47,50" stroke={CRACK_COLORS[0]} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M 46,28 L 38,20"                  stroke={CRACK_COLORS[0]} strokeWidth={1.3} fill="none" strokeLinecap="round" opacity={0.70} />
                  </Svg>
                </Animated.View>

                {/* Tap 2 — branches left and right */}
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: crack2Op }]} pointerEvents="none">
                  <Svg width={100} height={100}>
                    <Path d="M 47,50 L 54,62 L 45,72"  stroke={CRACK_COLORS[1]} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M 53,38 L 65,50 L 74,57"  stroke={CRACK_COLORS[1]} strokeWidth={2.0} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M 47,50 L 33,56 L 24,64"  stroke={CRACK_COLORS[1]} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
                    <Path d="M 65,50 L 70,41"           stroke={CRACK_COLORS[1]} strokeWidth={1.2} fill="none" strokeLinecap="round" opacity={0.60} />
                  </Svg>
                </Animated.View>

                {/* Tap 3 — full spider reaching edges */}
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: crack3Op }]} pointerEvents="none">
                  <Svg width={100} height={100}>
                    <Path d="M 45,72 L 49,84 L 43,94"  stroke={CRACK_COLORS[2]} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M 74,57 L 83,67 L 81,79"  stroke={CRACK_COLORS[2]} strokeWidth={2.1} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M 24,64 L 16,74 L 18,85"  stroke={CRACK_COLORS[2]} strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.90} />
                    <Path d="M 45,72 L 34,80 L 37,92"  stroke={CRACK_COLORS[2]} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
                    <Path d="M 54,62 L 66,73 L 63,87"  stroke={CRACK_COLORS[2]} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.80} />
                  </Svg>
                </Animated.View>
              </Animated.View>
            ) : result ? (
              <>
                <Animated.View style={[styles.hatchGlow, { backgroundColor: rarityColor + '44', transform: [{ scale: glowScale }] }]} />
                <Animated.View style={{ transform: [{ scale: fishScale }] }}>
                  <FishSVG speciesId={result.species.id} size={90} />
                </Animated.View>
              </>
            ) : null}
          </TouchableOpacity>

          {/* Tap hint text */}
          {phase === 'tapping' && (
            <Animated.Text style={[styles.hatchHint, { opacity: hintOp }]}>{hintText}</Animated.Text>
          )}

          {/* White flash overlay */}
          <Animated.View style={[StyleSheet.absoluteFill, styles.hatchFlash, { opacity: flashOp }]} pointerEvents="none" />

          {/* Info card after reveal */}
          {phase === 'revealed' && result && (
            <Animated.View style={[styles.hatchInfo, { opacity: infoOp }]}>
              <View style={[styles.hatchRarityBadge, { backgroundColor: rarityColor + '22', borderColor: rarityColor + '77' }]}>
                <Text style={[styles.hatchRarityText, { color: rarityColor }]}>
                  {RARITY_LABELS[result.species.rarity]}
                </Text>
              </View>
              <Text style={styles.hatchFishName}>{result.species.name}</Text>
              {result.isNew && <Text style={styles.hatchNewText}>Added to your Bestiary!</Text>}
              <TouchableOpacity
                style={[styles.hatchBtn, { backgroundColor: rarityColor }]}
                onPress={() => onComplete(result.species, result.isNew)}
                activeOpacity={0.82}
              >
                <Text style={styles.hatchBtnText}>Wonderful!</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Live clock (updates every 30 s) ──────────────────

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return '0m';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) { const d = Math.floor(h / 24); return `${d}d ${h % 24}h`; }
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── Egg card ─────────────────────────────────────────

function EggCard({ egg, onHatch, onSkip, theme }: {
  egg: FishEgg; onHatch: () => void; onSkip: () => void; theme: ReturnType<typeof getTheme>;
}) {
  const now       = useNow();
  const readyAt   = new Date(egg.readyAt).getTime();
  const expiresAt = new Date(egg.expiresAt).getTime();
  const earnedAt  = new Date(egg.earnedAt).getTime();

  const isReady      = now >= readyAt;
  const msUntilReady = Math.max(0, readyAt - now);
  const msUntilExp   = Math.max(0, expiresAt - now);
  const isUrgent     = isReady && msUntilExp < 12 * 3_600_000; // < 12 h left

  const progress = isReady ? 1 : Math.min(1, (now - earnedAt) / (readyAt - earnedAt));
  const isOtter  = egg.speciesHint === 'otter';

  const pulse = useRef(new Animated.Value(1)).current;
  const glow  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isReady) return;
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.08, duration: 850, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      Animated.timing(pulse, { toValue: 1,    duration: 850, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 1100, useNativeDriver: true }),
    ])).start();
    return () => { pulse.stopAnimation(); glow.stopAnimation(); };
  }, [isReady]);

  const glowOpacity  = glow.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.42] });
  const glowColor    = isOtter ? '#A0785A' : isUrgent ? '#FF5252' : '#FFD700';

  return (
    <TouchableOpacity
      style={[styles.eggCard, { backgroundColor: theme.surface }, isOtter && styles.eggCardOtter]}
      onPress={isReady ? onHatch : undefined}
      activeOpacity={isReady ? 0.75 : 1}
    >
      {/* Glow — only when ready */}
      {isReady && (
        <Animated.View style={[styles.eggGlow, { backgroundColor: glowColor, opacity: glowOpacity }]} />
      )}

      {/* Otter badge */}
      {isOtter && (
        <View style={styles.eggOtterBadge}>
          <Text style={{ fontSize: 12 }}>🦦</Text>
        </View>
      )}

      {/* Egg */}
      <Animated.Text style={[
        styles.eggEmoji,
        !isReady && { opacity: 0.45 },
        isReady && { transform: [{ scale: pulse }] },
      ]}>
        🥚
      </Animated.Text>

      {/* Status label */}
      <Text style={[styles.eggLabel, { color: isReady ? theme.text : theme.textSecondary }]}>
        {isReady ? (isOtter ? '🦦 Tap to hatch!' : 'Tap to hatch!') : (isOtter ? '🦦 Starter egg' : 'Incubating...')}
      </Text>

      {/* Timer */}
      {isReady ? (
        <Text style={[styles.eggTimer, { color: isUrgent ? '#FF5252' : '#FF9800' }]}>
          {isUrgent ? '⚠ ' : '⏳ '}{fmtCountdown(msUntilExp)} left
        </Text>
      ) : (
        <>
          {/* Progress bar */}
          <View style={[styles.eggProgressBg, { backgroundColor: theme.background }]}>
            <View style={[styles.eggProgressFill, { width: `${Math.round(progress * 100)}%` as any, backgroundColor: isOtter ? '#8D6E63' : '#42A5F5' }]} />
          </View>
          <Text style={[styles.eggTimer, { color: theme.textSecondary }]}>
            Ready in {fmtCountdown(msUntilReady)}
          </Text>
          <TouchableOpacity style={styles.eggSkipBtn} onPress={onSkip}>
            <Ionicons name="play-skip-forward-outline" size={11} color="#7AAFC8" />
            <Text style={styles.eggSkipText}>Skip</Text>
          </TouchableOpacity>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Fish card (roster) ───────────────────────────────

function FishCard({ fish, isDark, theme }: {
  fish: OwnedFish; isDark: boolean; theme: ReturnType<typeof getTheme>;
}) {
  const species = FISH_SPECIES.find((s) => s.id === fish.speciesId);
  if (!species) return null;
  const rc        = RARITY_COLORS[species.rarity];
  const isSpecial = ['rare', 'epic', 'legendary'].includes(species.rarity);
  const vis       = SPECIES_VISUALS[species.id];
  const variant   = vis?.variant ?? 'oval';

  return (
    <View style={[
      styles.fishCard,
      { backgroundColor: isDark ? '#0E1E2E' : '#F4FBFF', borderColor: rc + (isSpecial ? 'AA' : '40') },
      isSpecial && { shadowColor: rc, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 6 },
    ]}>
      <View style={[styles.fishCardPreview, { backgroundColor: (vis?.body ?? rc) + '18' }]}>
        <FishSVG speciesId={species.id} size={variant === 'tall' ? 44 : variant === 'marine' ? 28 : 38} />
      </View>
      <Text style={[styles.fishCardName, { color: isDark ? '#D6EEFF' : '#0D3256' }]} numberOfLines={1}>
        {species.name}
      </Text>
      <View style={[styles.rarityBadge, { backgroundColor: rc + '22' }]}>
        <View style={[styles.rarityDot, { backgroundColor: rc }]} />
        <Text style={[styles.rarityBadgeText, { color: rc }]}>{RARITY_LABELS[species.rarity]}</Text>
      </View>
    </View>
  );
}

// ─── Stat card ────────────────────────────────────────

function StatCard({ label, value, icon, color, theme }: {
  label: string; value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string; theme: ReturnType<typeof getTheme>;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
      <View style={[styles.statIconBg, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ─── Filter chip ──────────────────────────────────────

function FilterChip({ label, active, color, onPress }: {
  label: string; active: boolean; color?: string; onPress: () => void;
}) {
  const accent = color ?? '#29B6F6';
  return (
    <TouchableOpacity
      style={[
        styles.filterChip,
        active
          ? { backgroundColor: accent + '22', borderColor: accent }
          : { backgroundColor: '#88888814', borderColor: 'transparent' },
      ]}
      onPress={onPress}
    >
      {color && <View style={[styles.filterDot, { backgroundColor: color }]} />}
      <Text style={[styles.filterText, { color: active ? accent : '#888' }, active && { fontWeight: '700' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Bestiary row ─────────────────────────────────────

function BestiaryRow({ species, owned, count, theme }: {
  species: FishSpecies; owned: boolean; count: number; theme: ReturnType<typeof getTheme>;
}) {
  const rc  = RARITY_COLORS[species.rarity];
  const vis = SPECIES_VISUALS[species.id];
  return (
    <View style={[styles.bestiaryRow, { backgroundColor: theme.surface }]}>
      <View style={[styles.rarityBar, { backgroundColor: owned ? rc : rc + '40' }]} />
      <View style={[styles.bestiaryPreview, { backgroundColor: owned ? rc + '18' : theme.background }]}>
        {owned ? (
          <FishSVG speciesId={species.id} size={34} />
        ) : (
          <Text style={{ fontSize: 28, opacity: 0.2 }}>?</Text>
        )}
      </View>
      <View style={{ flex: 1, opacity: owned ? 1 : 0.45 }}>
        <Text style={[styles.bestiaryName, { color: theme.text }]}>{owned ? species.name : '???'}</Text>
        <Text style={[styles.bestiaryDesc, { color: theme.textSecondary }]} numberOfLines={2}>
          {owned ? species.description : 'Not yet discovered'}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4, paddingRight: 14 }}>
        <View style={[styles.rarityBadge, { backgroundColor: rc + '22' }]}>
          <Text style={[styles.rarityBadgeText, { color: rc, fontWeight: '700' }]}>
            {RARITY_LABELS[species.rarity]}
          </Text>
        </View>
        {owned && count > 1 && (
          <Text style={{ fontSize: 11, color: theme.textSecondary }}>x{count}</Text>
        )}
        {owned && <Ionicons name="checkmark-circle" size={16} color={rc} />}
      </View>
    </View>
  );
}

// ─── Main page ────────────────────────────────────────

export default function AquariumPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const [tab, setTab]           = useState<Tab>('tank');
  const [eggs, setEggs]         = useState<FishEgg[]>([]);
  const [ownedFish, setOwned]   = useState<OwnedFish[]>([]);
  const [bFilter, setBFilter]   = useState<FishRarity | null>(null);
  const [selectedBiome, setSelectedBiome] = useState<BiomeKey | null>(null);
  const [hatchingEgg, setHatchingEgg] = useState<FishEgg | null>(null);
  const [justUnlockedBiomes, setJustUnlockedBiomes] = useState<BiomeCfg[]>([]);

  const load = useCallback(async () => {
    const validIds = new Set(FISH_SPECIES.map((s) => s.id));
    const [e, f] = await Promise.all([getEggs(uid), getOwnedFish(uid)]);
    setEggs(e);
    setOwned(f.filter((fish) => validIds.has(fish.speciesId)));
  }, [uid]);

  // Claim starter otter egg on first open, then load
  useEffect(() => { if (uid) claimStarterEgg(uid).then(() => load()); }, [uid, load]);

  const discoveredIds = new Set(ownedFish.map((f) => f.speciesId));
  const uniqueOwned   = discoveredIds.size;


  const filteredBestiary = bFilter
    ? FISH_SPECIES.filter((s) => s.rarity === bFilter)
    : FISH_SPECIES;

  const ICONS: Record<Tab, keyof typeof Ionicons.glyphMap> = {
    tank:     'water-outline',
    eggs:     'ellipse-outline',
    bestiary: 'book-outline',
  };
  const LABELS: Record<Tab, string> = {
    tank:     'Tank',
    eggs:     eggs.length > 0 ? `Eggs (${eggs.length})` : 'Eggs',
    bestiary: 'Bestiary',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Pill tab bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface }]}>
        {(['tank', 'eggs', 'bestiary'] as Tab[]).map((t) => {
          const active = tab === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, active && { backgroundColor: '#3DBDAA22' }]}
              onPress={() => setTab(t)}
            >
              <Ionicons name={ICONS[t]} size={15} color={active ? '#29B6F6' : theme.textSecondary} />
              <Text style={[styles.tabLabel, { color: active ? '#29B6F6' : theme.textSecondary },
                active && { fontWeight: '700' }]}>
                {LABELS[t]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ══ TANK ══ */}
        {tab === 'tank' && (() => {
          // Pre-compute per-biome data
          const unlockedBiomes = computeUnlockedBiomes(ownedFish);
          const biomeData = BIOME_CONFIGS.map((biome) => {
            const biomeSpeciesSet = new Set(biome.speciesIds);
            const seenSpecies = new Set<string>();
            const biomeFish = ownedFish
              .filter((f) => biomeSpeciesSet.has(f.speciesId))
              .filter((f) => { if (seenSpecies.has(f.speciesId)) return false; seenSpecies.add(f.speciesId); return true; })
              .slice(0, MAX_BIOME_FISH);
            const locked = !unlockedBiomes.has(biome.id);
            return { biome, biomeFish, locked };
          });

          // ── Single tank view ──
          if (selectedBiome) {
            const entry = biomeData.find((d) => d.biome.id === selectedBiome)!;
            return (
              <View style={{ gap: 12 }}>
                {/* Back header */}
                <View style={styles.tankHeader}>
                  <TouchableOpacity style={styles.tankBackBtn} onPress={() => setSelectedBiome(null)}>
                    <Ionicons name="chevron-back" size={18} color={isDark ? '#AAC8E0' : '#2A5F80'} />
                    <Text style={[styles.tankBackLabel, { color: isDark ? '#AAC8E0' : '#2A5F80' }]}>Map</Text>
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.biomeDot, { backgroundColor: entry.biome.dotColor }]} />
                    <Text style={[styles.tankHeaderName, { color: isDark ? '#E8F4FF' : '#1A3A55' }]}>
                      {entry.biome.name}
                    </Text>
                  </View>
                  <Text style={[styles.tankHeaderCount, { color: isDark ? '#607D8B' : '#90A4AE' }]}>
                    {entry.biomeFish.length}/{entry.biome.speciesIds.length}
                  </Text>
                </View>
                <BiomeTank
                  biome={entry.biome}
                  fish={entry.biomeFish}
                  isDark={isDark}
                  locked={entry.locked}
                  uid={entry.biome.id}
                  tankH={340}
                />
                {entry.locked && (
                  <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>Biome Locked</Text>
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                      {entry.biome.unlockHint} to unlock this biome.
                    </Text>
                  </View>
                )}
              </View>
            );
          }

          // ── Ocean map view ──
          const zones: { label: string; habitat: FishHabitat; emoji: string }[] = [
            { label: 'SURFACE WATERS', habitat: 'surface', emoji: '🌊' },
            { label: 'OCEAN FLOOR',    habitat: 'floor',   emoji: '⚓' },
            { label: 'THE DEPTHS',     habitat: 'depths',  emoji: '🌑' },
          ];
          return (
            <View style={[styles.oceanMap, { backgroundColor: isDark ? '#030D18' : '#062040' }]}>
              {/* Map title */}
              <View style={styles.mapTitleRow}>
                <Text style={styles.mapTitle}>🗺  Ocean Map</Text>
                <Text style={[styles.mapSubtitle, { color: isDark ? '#4A7A9B' : '#6BA3C2' }]}>
                  {uniqueOwned}/{FISH_SPECIES.length} species found
                </Text>
              </View>

              {zones.map(({ label, habitat, emoji }) => {
                const zoneBiomes = biomeData.filter((d) => d.biome.habitat === habitat);
                const zoneColor =
                  habitat === 'surface' ? '#1565C0' :
                  habitat === 'floor'   ? '#1A3A5C' : '#0A1830';
                return (
                  <View key={habitat} style={[styles.mapZone, { backgroundColor: isDark ? zoneColor + '55' : zoneColor + '33' }]}>
                    <Text style={[styles.mapZoneLabel, { color: isDark ? '#4A8AB0' : '#6BAAD0' }]}>
                      {emoji}  {label}
                    </Text>
                    <View style={styles.mapNodesRow}>
                      {zoneBiomes.map(({ biome, biomeFish, locked }) => (
                        <TouchableOpacity
                          key={biome.id}
                          style={[
                            styles.mapNode,
                            { backgroundColor: isDark ? '#0A1E30' : '#0D2A42',
                              borderColor: locked ? (isDark ? '#1A2E3E' : '#1A3050') : biome.dotColor + '88',
                              opacity: locked ? 0.6 : 1 },
                          ]}
                          onPress={() => setSelectedBiome(biome.id)}
                          activeOpacity={0.75}
                        >
                          {/* Color accent bar */}
                          <View style={[styles.mapNodeBar, { backgroundColor: locked ? '#334455' : biome.dotColor }]} />
                          <Text style={styles.mapNodeName} numberOfLines={1}>{biome.name}</Text>
                          <Text style={[styles.mapNodeCount, { color: isDark ? '#5A8FAA' : '#7AAFC8' }]}>
                            {biomeFish.length}/{biome.speciesIds.length} species
                          </Text>
                          {locked ? (
                            <View style={styles.mapNodeLockRow}>
                              <Ionicons name="lock-closed" size={10} color="#607D8B" />
                              <Text style={styles.mapNodeLockText}>Locked</Text>
                            </View>
                          ) : (
                            <View style={styles.mapNodeEnterRow}>
                              <Text style={[styles.mapNodeEnter, { color: biome.dotColor }]}>Dive in →</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })()}

        {/* ══ EGGS ══ */}
        {tab === 'eggs' && (
          <View style={{ gap: 16 }}>
            <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.infoIconBg, { backgroundColor: '#29B6F620' }]}>
                <Ionicons name="sparkles-outline" size={20} color="#29B6F6" />
              </View>
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                Earn eggs by completing focus sessions. Tap any egg to hatch a mystery fish!
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.testEggBtn, { backgroundColor: theme.surface }]}
                onPress={async () => { await awardEgg(uid); await load(); }}
              >
                <Ionicons name="flask-outline" size={15} color={theme.textSecondary} />
                <Text style={[styles.testEggText, { color: theme.textSecondary }]}>Add Test Egg</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.testEggBtn, { backgroundColor: theme.surface }]}
                onPress={() => Alert.alert(
                  'Load Sample Pack',
                  'Add one of each fish from the Pixel Gnome Fish Pack to your collection?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Load', onPress: async () => { await loadSamplePack(uid); await load(); } },
                  ],
                )}
              >
                <Ionicons name="fish-outline" size={15} color="#29B6F6" />
                <Text style={[styles.testEggText, { color: '#29B6F6' }]}>Sample Pack</Text>
              </TouchableOpacity>
            </View>

            {eggs.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No eggs yet</Text>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Finish a focus session to earn your first egg.
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  {eggs.length} EGG{eggs.length !== 1 ? 'S' : ''} WAITING
                </Text>
                <View style={styles.eggGrid}>
                  {eggs.map((egg) => (
                    <EggCard
                      key={egg.id}
                      egg={egg}
                      onHatch={() => setHatchingEgg(egg)}
                      onSkip={() => skipEggTimer(uid, egg.id).then(load)}
                      theme={theme}
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* ══ BESTIARY ══ */}
        {tab === 'bestiary' && (
          <View style={{ gap: 12 }}>
            <View style={[styles.bestiaryHeader, { backgroundColor: theme.surface }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={[styles.bestiaryBigNum, { color: theme.text }]}>{uniqueOwned}</Text>
                  <Text style={[styles.bestiaryTotal, { color: theme.textSecondary }]}>
                    / {FISH_SPECIES.length} discovered
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => Alert.alert(
                    'Clear Bestiary',
                    'This will remove all your fish. Your eggs will remain. Are you sure?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Clear', style: 'destructive', onPress: () => clearOwnedFish(uid).then(load) },
                    ],
                  )}
                  style={[styles.clearBestiaryBtn, { backgroundColor: '#E76F5122' }]}
                >
                  <Ionicons name="trash-outline" size={14} color="#E76F51" />
                  <Text style={{ fontSize: 12, color: '#E76F51', fontWeight: '600' }}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.progressBg, { backgroundColor: theme.background }]}>
                <View style={[styles.progressFill, {
                  width: `${(uniqueOwned / FISH_SPECIES.length) * 100}%` as any,
                }]} />
              </View>
              <View style={styles.rarityDotsRow}>
                {RARITY_ORDER.map((r) => {
                  const got = FISH_SPECIES.filter((s) => s.rarity === r && discoveredIds.has(s.id)).length;
                  const tot = FISH_SPECIES.filter((s) => s.rarity === r).length;
                  return (
                    <View key={r} style={{ alignItems: 'center', gap: 5 }}>
                      <View style={[styles.rarityCircle, { backgroundColor: RARITY_COLORS[r], opacity: got > 0 ? 1 : 0.2 }]} />
                      <Text style={{ fontSize: 10, color: RARITY_COLORS[r], fontWeight: '600' }}>{got}/{tot}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                <FilterChip label="All" active={bFilter === null} onPress={() => setBFilter(null)} />
                {RARITY_ORDER.map((r) => (
                  <FilterChip
                    key={r}
                    label={RARITY_LABELS[r]}
                    active={bFilter === r}
                    color={RARITY_COLORS[r]}
                    onPress={() => setBFilter(bFilter === r ? null : r)}
                  />
                ))}
              </View>
            </ScrollView>

            {HABITAT_ORDER.map((habitat) => {
              const group = filteredBestiary.filter((s) => s.habitat === habitat);
              if (group.length === 0) return null;
              return (
                <View key={habitat}>
                  <View style={[styles.habitatHeader, { borderColor: theme.surface }]}>
                    <Text style={[styles.habitatLabel, { color: theme.textSecondary }]}>
                      {HABITAT_LABELS[habitat].toUpperCase()}
                    </Text>
                  </View>
                  {group.map((species) => {
                    const owned = discoveredIds.has(species.id);
                    const count = ownedFish.filter((f) => f.speciesId === species.id).length;
                    return (
                      <BestiaryRow key={species.id} species={species} owned={owned} count={count} theme={theme} />
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>
      {/* Biome unlock celebration modal */}
      {justUnlockedBiomes.length > 0 && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.biomeUnlockOverlay}>
            <View style={[styles.biomeUnlockCard, { backgroundColor: isDark ? '#152234' : '#FFFFFF' }]}>
              <Text style={styles.biomeUnlockEmoji}>🔓</Text>
              <Text style={[styles.biomeUnlockTitle, { color: isDark ? '#E8F4FD' : '#142030' }]}>
                {justUnlockedBiomes.length === 1 ? 'New Biome Unlocked!' : `${justUnlockedBiomes.length} Biomes Unlocked!`}
              </Text>
              {justUnlockedBiomes.map((b) => (
                <View key={b.id} style={[styles.biomeUnlockRow, { borderColor: b.dotColor + '55' }]}>
                  <View style={[styles.biomeDot, { backgroundColor: b.dotColor }]} />
                  <Text style={[styles.biomeUnlockName, { color: isDark ? '#E8F4FD' : '#142030' }]}>{b.name}</Text>
                </View>
              ))}
              <Text style={[styles.biomeUnlockSub, { color: isDark ? '#7AAFC8' : '#5A7E9B' }]}>
                New fish await in the deep!
              </Text>
              <TouchableOpacity
                style={[styles.biomeUnlockBtn, { backgroundColor: '#3DBDAA' }]}
                onPress={() => setJustUnlockedBiomes([])}
              >
                <Text style={{ color: '#0D1B2A', fontWeight: '700', fontSize: 15 }}>Explore</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {hatchingEgg && (
        <HatchingModal
          egg={hatchingEgg}
          uid={uid}
          discoveredIds={discoveredIds}
          onComplete={async () => {
            const oldUnlocked = computeUnlockedBiomes(ownedFish);
            setHatchingEgg(null);
            // Load fresh data directly so we can diff biomes in the same call
            const validIds = new Set(FISH_SPECIES.map((s) => s.id));
            const [e, f] = await Promise.all([getEggs(uid), getOwnedFish(uid)]);
            const newFish = f.filter((fish) => validIds.has(fish.speciesId));
            setEggs(e);
            setOwned(newFish);
            const newUnlocked = computeUnlockedBiomes(newFish);
            const justUnlocked = BIOME_CONFIGS.filter(
              (b) => !oldUnlocked.has(b.id) && newUnlocked.has(b.id),
            );
            if (justUnlocked.length > 0) setJustUnlockedBiomes(justUnlocked);
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 52 },

  habitatHeader: {
    borderTopWidth: 1, marginTop: 8, marginBottom: 6, paddingTop: 10,
  },
  habitatLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
  },

  tabBar: {
    flexDirection: 'row', margin: 12, marginBottom: 4,
    borderRadius: 18, padding: 5, gap: 4,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 13,
  },
  tabLabel: { fontSize: 13 },

  // Biome tanks
  biomeLabelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 4, paddingTop: 12, paddingBottom: 5,
  },
  biomeDot: { width: 8, height: 8, borderRadius: 4 },
  biomeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },
  biome: {
    width: '100%', height: BIOME_HEIGHT,
    borderRadius: 22, overflow: 'hidden',
  },
  biomeEmpty: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  biomeEmptyText: {
    color: 'rgba(255,255,255,0.3)', fontSize: 12, fontStyle: 'italic',
  },
  lockedOverlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  lockedIconBg: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 2,
  },
  lockedTitle: {
    color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '700',
  },
  lockedSub: {
    color: 'rgba(255,255,255,0.50)', fontSize: 11, textAlign: 'center', paddingHorizontal: 24,
  },
  lockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 6,
  },
  lockBadgeText: { fontSize: 10, fontWeight: '500' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', borderRadius: 20, padding: 14, gap: 6 },
  statIconBg: { width: 38, height: 38, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11 },

  // Fish grid
  fishGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fishCard: { width: '47%', alignItems: 'center', padding: 14, borderRadius: 22, gap: 8, borderWidth: 1.5 },
  fishCardPreview: {
    width: 84, height: 64, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  fishCardName: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  rarityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  rarityDot:       { width: 5, height: 5, borderRadius: 3 },
  rarityBadgeText: { fontSize: 11, fontWeight: '600' },

  // Eggs
  eggGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  eggCard:        { width: '47%', alignItems: 'center', padding: 18, borderRadius: 22, gap: 6, overflow: 'hidden' },
  eggCardOtter:   { borderWidth: 1.5, borderColor: '#8D6E6355' },
  eggGlow:        { position: 'absolute', width: 100, height: 100, borderRadius: 50, top: 6 },
  eggOtterBadge:  { position: 'absolute', top: 10, right: 10, backgroundColor: '#8D6E6322', borderRadius: 8, padding: 3 },
  eggEmoji:       { fontSize: 42 },
  eggLabel:       { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  eggTimer:       { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  eggProgressBg:  { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden' },
  eggProgressFill:{ height: 4, borderRadius: 2 },
  eggSkipBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 4 },
  eggSkipText:    { fontSize: 11, color: '#7AAFC8', fontWeight: '600' },

  testEggBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, alignSelf: 'flex-start' },
  testEggText: { fontSize: 13, fontWeight: '500' },

  infoCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18 },
  infoIconBg: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  infoText:   { flex: 1, fontSize: 13, lineHeight: 20 },

  // Bestiary
  bestiaryHeader:  { padding: 20, borderRadius: 22, gap: 12 },
  clearBestiaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  bestiaryBigNum:  { fontSize: 46, fontWeight: '900', letterSpacing: -1 },
  bestiaryTotal:   { fontSize: 16, fontWeight: '500' },
  progressBg:      { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill:    { height: 8, borderRadius: 4, backgroundColor: '#29B6F6' },
  rarityDotsRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  rarityCircle:    { width: 11, height: 11, borderRadius: 6 },
  filterRow:       { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterDot:       { width: 6, height: 6, borderRadius: 3 },
  filterText:      { fontSize: 13, fontWeight: '500' },
  bestiaryRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, overflow: 'hidden' },
  rarityBar:       { width: 4, alignSelf: 'stretch' },
  bestiaryPreview: { width: 72, height: 60, marginVertical: 10, borderRadius: 14, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  bestiaryName:    { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  bestiaryDesc:    { fontSize: 12, lineHeight: 17 },

  // Empty / section
  emptyCard:    { alignItems: 'center', padding: 36, borderRadius: 24, gap: 10 },
  emptyTitle:   { fontSize: 18, fontWeight: '700' },
  emptyText:    { fontSize: 13, textAlign: 'center', maxWidth: 260, lineHeight: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1 },

  // ── Tank single view header ──
  tankHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tankBackBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingRight: 8 },
  tankBackLabel:   { fontSize: 14, fontWeight: '600' },
  tankHeaderName:  { fontSize: 16, fontWeight: '700' },
  tankHeaderCount: { fontSize: 13, fontWeight: '500' },

  // ── Ocean map ──
  oceanMap:       { borderRadius: 20, overflow: 'hidden', gap: 2, padding: 14 },
  mapTitleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  mapTitle:       { fontSize: 18, fontWeight: '800', color: '#E8F4FF' },
  mapSubtitle:    { fontSize: 12, fontWeight: '500' },
  mapZone:        { borderRadius: 14, padding: 12, marginBottom: 8, gap: 10 },
  mapZoneLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  mapNodesRow:    { flexDirection: 'row', gap: 8 },
  mapNode:        { flex: 1, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden', paddingBottom: 10 },
  mapNodeBar:     { height: 4, width: '100%', marginBottom: 8 },
  mapNodeName:    { fontSize: 12, fontWeight: '700', color: '#D0E8FF', paddingHorizontal: 10 },
  mapNodeCount:   { fontSize: 10, fontWeight: '500', paddingHorizontal: 10, marginTop: 2 },
  mapNodeLockRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, marginTop: 6 },
  mapNodeLockText:{ fontSize: 10, color: '#607D8B' },
  mapNodeEnterRow:{ paddingHorizontal: 10, marginTop: 6 },
  mapNodeEnter:   { fontSize: 11, fontWeight: '700' },

  // ── Hatch modal ──
  hatchOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center', padding: 28 },
  hatchCard:       { width: '100%', maxWidth: 320, backgroundColor: '#0B1C2E', borderRadius: 30, padding: 28, alignItems: 'center', gap: 18, borderWidth: 1.5, borderColor: '#1A3050' },
  hatchTitle:      { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  hatchCenter:     { width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  hatchEggEmoji:   { fontSize: 88 },
  hatchFishEmoji:  { fontSize: 80 },
  hatchGlow:       { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
  hatchFlash:      { backgroundColor: 'white', borderRadius: 30 },
  hatchInfo:       { width: '100%', alignItems: 'center', gap: 10 },
  hatchRarityBadge:{ paddingHorizontal: 16, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  hatchRarityText: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1 },
  hatchFishName:   { fontSize: 26, fontWeight: '800', color: '#E8F4FF', textAlign: 'center' },
  hatchNewText:    { fontSize: 13, fontWeight: '600', color: '#69F0AE' },
  hatchBtn:        { marginTop: 4, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 22, width: '100%', alignItems: 'center' },
  hatchBtnText:    { fontSize: 16, fontWeight: '800', color: 'white' },
  hatchDotsRow:    { flexDirection: 'row', gap: 10 },
  hatchDot:        { width: 12, height: 12, borderRadius: 6 },
  hatchHint:       { fontSize: 14, fontWeight: '600', color: '#7FB3D3', letterSpacing: 0.5 },

  // Biome unlock modal
  biomeUnlockOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  biomeUnlockCard:    { width: '100%', borderRadius: 28, padding: 28, alignItems: 'center', gap: 12 },
  biomeUnlockEmoji:   { fontSize: 52, marginBottom: 4 },
  biomeUnlockTitle:   { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  biomeUnlockRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1, width: '100%' },
  biomeUnlockName:    { fontSize: 16, fontWeight: '700' },
  biomeUnlockSub:     { fontSize: 14, textAlign: 'center', marginTop: 4 },
  biomeUnlockBtn:     { marginTop: 8, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 20 },
});
