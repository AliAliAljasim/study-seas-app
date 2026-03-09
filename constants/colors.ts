// Ocean-inspired study app palette
export const Colors = {
  // Brand accents
  teal:   '#3DBDAA',
  amber:  '#F4A261',
  coral:  '#E76F51',
  ocean:  '#2E86AB',
  mint:   '#52B788',

  // Legacy aliases (used across screens)
  gold:       '#3DBDAA', // replaced gold → teal throughout
  orange:     '#F4A261',
  darkOrange: '#E07340',
  steel:      '#2E86AB',
  darkSteel:  '#1A6A8C',
  purple:     '#9381FF',
  darkPurple: '#7B6CF6',
  brown:      '#8B6355',
  sienna:     '#A07060',
  green:      '#52B788',
  red:        '#E76F51',

  dark: {
    background:       '#0D1B2A',
    surface:          '#152234',
    card:             '#1C2E44',
    text:             '#E8F4FD',
    textSecondary:    '#7AAFC8',
    border:           '#2A3F56',
    primaryContainer: '#0A2535',
  },
  light: {
    background:       '#EEF5FB',
    surface:          '#FFFFFF',
    card:             '#F2F8FD',
    text:             '#142030',
    textSecondary:    '#5A7E9B',
    border:           '#CAE0F0',
    primaryContainer: '#E0F2FA',
  },
};

export type Theme = typeof Colors.dark;

export function getTheme(isDark: boolean) {
  return isDark ? Colors.dark : Colors.light;
}
