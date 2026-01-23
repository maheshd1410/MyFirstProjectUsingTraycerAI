import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme';
import type { Spacing } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  padding?: keyof Spacing;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevation = 1,
  padding = 'md',
  style,
}) => {
  const theme = useAppTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: theme.spacing[padding],
        },
        theme.elevation[elevation],
        style,
      ]}
    >
      {children}
    </View>
  );
};
