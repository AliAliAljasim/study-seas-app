export const Colors = {
  gold: '#FFD700',
  orange: '#FF6B35',
  darkOrange: '#FF8C00',
  steel: '#4A90E2',
  darkSteel: '#2E5BBA',
  purple: '#9370DB',
  darkPurple: '#8A2BE2',
  brown: '#8B4513',
  sienna: '#A0522D',
  green: '#4CAF50',
  red: '#F44336',

  dark: {
    background: '#1E1E1E',
    surface: '#2D2D2D',
    card: '#3A3A3A',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    border: '#444444',
    primaryContainer: '#2A2A1A',
  },
  light: {
    background: '#F2F2F7',
    surface: '#FFFFFF',
    card: '#F8F8F8',
    text: '#000000',
    textSecondary: '#666666',
    border: '#DDDDDD',
    primaryContainer: '#FFFDE7',
  },
};

export type Theme = typeof Colors.dark;

export function getTheme(isDark: boolean) {
  return isDark ? Colors.dark : Colors.light;
}
