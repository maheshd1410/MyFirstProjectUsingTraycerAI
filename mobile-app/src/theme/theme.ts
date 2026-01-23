import type { ColorScheme } from './colors';
import { lightColors, darkColors } from './colors';
import type { Typography } from './typography';
import { typography } from './typography';
import type { Spacing, Radius, Elevation, Opacity, ZIndex } from './tokens';
import { spacing, radius, elevation, opacity, zIndex } from './tokens';

export type Theme = {
  colors: ColorScheme;
  typography: Typography;
  spacing: Spacing;
  radius: Radius;
  /** Legacy alias for radius tokens */
  borderRadius: Radius;
  elevation: Elevation;
  opacity: Opacity;
  zIndex: ZIndex;
  isDark: boolean;
};

const createTheme = (colorScheme: 'light' | 'dark'): Theme => ({
  colors: colorScheme === 'dark' ? darkColors : lightColors,
  typography,
  spacing,
  radius,
  borderRadius: radius,
  elevation,
  opacity,
  zIndex,
  isDark: colorScheme === 'dark',
});

export const lightTheme: Theme = createTheme('light');
export const darkTheme: Theme = createTheme('dark');
