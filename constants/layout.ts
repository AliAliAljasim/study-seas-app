import { useWindowDimensions, Platform } from 'react-native';

export const CONTENT_MAX_WIDTH = 680;
export const MODAL_MAX_WIDTH   = 560;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  // Use the shorter dimension to detect iPad regardless of orientation
  const shortSide = Math.min(width, height);
  const isTablet = Platform.OS === 'ios' ? shortSide >= 768 : shortSide >= 600;
  const isLandscape = width > height;
  return { width, height, isTablet, isLandscape };
}

/** ScrollView contentContainerStyle addition — centers and caps content on iPad */
export function contentContainer(isTablet: boolean, extraStyle?: object) {
  if (!isTablet) return extraStyle ?? {};
  return {
    maxWidth: CONTENT_MAX_WIDTH,
    width: '100%' as const,
    alignSelf: 'center' as const,
    ...extraStyle,
  };
}

/** Modal overlay style — bottom sheet on phone, centered on iPad */
export function modalOverlay(isTablet: boolean) {
  return {
    flex: 1 as const,
    backgroundColor: '#000000AA',
    justifyContent: isTablet ? ('center' as const) : ('flex-end' as const),
    alignItems: isTablet ? ('center' as const) : ('stretch' as const),
  };
}

/** Modal card style — rounded bottom on phone, fully rounded on iPad */
export function modalCard(isTablet: boolean, bg: string, extraStyle?: object) {
  if (isTablet) {
    return {
      backgroundColor: bg,
      borderRadius: 24,
      width: MODAL_MAX_WIDTH,
      maxHeight: '85%' as const,
      padding: 28,
      paddingTop: 24,
      gap: 12,
      ...extraStyle,
    };
  }
  return {
    backgroundColor: bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
    gap: 12,
    ...extraStyle,
  };
}
