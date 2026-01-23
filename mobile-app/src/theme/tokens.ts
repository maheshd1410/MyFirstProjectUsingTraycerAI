import { ViewStyle } from 'react-native';

// Spacing tokens (4px grid)
export type Spacing = {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
  huge: number;
  massive: number;
};

export const spacing: Spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
};

// Border radius tokens
export type Radius = {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  full: number;
};

export const radius: Radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

// Elevation tokens (React Native shadow properties)
export type ElevationLevel = ViewStyle & {
  elevation: number;
};

export type Elevation = {
  0: ViewStyle;
  1: ElevationLevel;
  2: ElevationLevel;
  3: ElevationLevel;
  4: ElevationLevel;
  5: ElevationLevel;
};

export const elevation: Elevation = {
  0: {},
  1: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  2: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  3: {
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  4: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  5: {
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
};

// Opacity tokens
export type Opacity = {
  disabled: number;
  hover: number;
  focus: number;
  selected: number;
  activated: number;
  pressed: number;
  dragged: number;
};

export const opacity: Opacity = {
  disabled: 0.38,
  hover: 0.08,
  focus: 0.12,
  selected: 0.12,
  activated: 0.12,
  pressed: 0.16,
  dragged: 0.16,
};

// zIndex tokens
export type ZIndex = {
  base: number;
  dropdown: number;
  sticky: number;
  fixed: number;
  modalBackdrop: number;
  modal: number;
  popover: number;
  tooltip: number;
};

export const zIndex: ZIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
};
