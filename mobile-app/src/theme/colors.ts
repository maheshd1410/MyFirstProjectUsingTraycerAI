/**
 * Material Design 3 Color System
 * Defines semantic color tokens for light and dark themes
 */

export type ColorScheme = {
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  onSecondary: string;
  onSecondaryContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  surfaceVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  error: string;
  errorContainer: string;
  onError: string;
  onErrorContainer: string;
  success: string;
  successContainer: string;
  onSuccess: string;
  onSuccessContainer: string;
  warning: string;
  warningContainer: string;
  onWarning: string;
  onWarningContainer: string;
  /** Legacy aliases maintained for compatibility */
  text: string;
  textLight: string;
  border: string;
};

const lightBase = {
  primary: '#6750A4',
  primaryContainer: '#EADDFF',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#21005D',
  secondary: '#625B71',
  secondaryContainer: '#E8DEF8',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#1D192B',
  background: '#FFFBFE',
  onBackground: '#1C1B1F',
  surface: '#FFFBFE',
  surfaceVariant: '#E7E0EC',
  onSurface: '#1C1B1F',
  onSurfaceVariant: '#49454F',
  outline: '#79747E',
  outlineVariant: '#CAC4D0',
  error: '#B3261E',
  errorContainer: '#F9DEDC',
  onError: '#FFFFFF',
  onErrorContainer: '#410E0B',
  success: '#2E7D32',
  successContainer: '#C8E6C9',
  onSuccess: '#FFFFFF',
  onSuccessContainer: '#1B5E20',
  warning: '#F57C00',
  warningContainer: '#FFE0B2',
  onWarning: '#FFFFFF',
  onWarningContainer: '#E65100',
};

export const lightColors: ColorScheme = {
  ...lightBase,
  text: lightBase.onSurface,
  textLight: lightBase.onSurfaceVariant,
  border: lightBase.outlineVariant,
};

const darkBase = {
  primary: '#D0BCFF',
  primaryContainer: '#4F378B',
  onPrimary: '#371E73',
  onPrimaryContainer: '#EADDFF',
  secondary: '#CCC2DC',
  secondaryContainer: '#4A4458',
  onSecondary: '#332D41',
  onSecondaryContainer: '#E8DEF8',
  background: '#1C1B1F',
  onBackground: '#E6E1E5',
  surface: '#1C1B1F',
  surfaceVariant: '#49454F',
  onSurface: '#E6E1E5',
  onSurfaceVariant: '#CAC4D0',
  outline: '#938F99',
  outlineVariant: '#49454F',
  error: '#F2B8B5',
  errorContainer: '#8C1D18',
  onError: '#601410',
  onErrorContainer: '#F9DEDC',
  success: '#81C784',
  successContainer: '#1B5E20',
  onSuccess: '#1B5E20',
  onSuccessContainer: '#C8E6C9',
  warning: '#FFB74D',
  warningContainer: '#E65100',
  onWarning: '#E65100',
  onWarningContainer: '#FFE0B2',
};

export const darkColors: ColorScheme = {
  ...darkBase,
  text: darkBase.onSurface,
  textLight: darkBase.onSurfaceVariant,
  border: darkBase.outlineVariant,
};
