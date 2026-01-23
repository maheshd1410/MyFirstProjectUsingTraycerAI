import { useColorScheme } from 'react-native';
import type { Theme } from './theme';
import { lightTheme, darkTheme } from './theme';

// Re-export theme objects and type
export { lightTheme, darkTheme } from './theme';
export type { Theme } from './theme';

// Re-export all design system tokens and types
export { lightColors, darkColors } from './colors';
export type { ColorScheme } from './colors';
export { typography } from './typography';
export type { Typography } from './typography';
export { spacing, radius, radius as borderRadius, elevation, opacity, zIndex } from './tokens';
export type { Spacing, Radius, Elevation, Opacity, ZIndex } from './tokens';

/**
 * Hook to get the current app theme based on system color scheme preference.
 * Automatically switches between light and dark themes.
 */
export const useAppTheme = (): Theme => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};

/**
 * Helper function to get theme for non-hook contexts.
 * Use when you can't use React hooks.
 */
export const getTheme = (colorScheme: 'light' | 'dark' | null | undefined): Theme => {
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};

/**
 * Default export for backward compatibility.
 * Returns the light theme by default.
 * For automatic theme switching, use useAppTheme() hook instead.
 */
export const theme: Theme = lightTheme;
