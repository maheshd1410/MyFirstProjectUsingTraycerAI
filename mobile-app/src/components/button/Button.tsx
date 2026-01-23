import React from 'react';
import { Pressable, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme';
import type { ButtonProps } from './Button.types';

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'filled',
  loading = false,
  disabled = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  accessibilityLabel,
}) => {
  const theme = useAppTheme();

  const getBackgroundColor = () => {
    if (variant === 'filled') return theme.colors.primary;
    if (variant === 'outlined') return 'transparent';
    return 'transparent';
  };

  const getTextColor = () => {
    if (variant === 'filled') return theme.colors.onPrimary;
    if (variant === 'outlined') return theme.colors.primary;
    return theme.colors.primary;
  };

  const getBorderColor = () => {
    if (variant === 'outlined') return theme.colors.outline;
    return 'transparent';
  };

  const containerStyle = [
    {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.radius.lg,
      backgroundColor: getBackgroundColor(),
      borderWidth: variant === 'outlined' ? 1 : 0,
      borderColor: getBorderColor(),
      opacity: disabled ? theme.opacity.disabled : 1,
      width: fullWidth ? '100%' : 'auto',
    },
  ];

  const textStyle = [
    theme.typography.labelLarge,
    {
      color: getTextColor(),
      marginHorizontal: leadingIcon || trailingIcon ? theme.spacing.sm : 0,
    },
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        containerStyle,
        {
          opacity: pressed && !disabled ? (disabled ? theme.opacity.disabled : theme.opacity.pressed) : disabled ? theme.opacity.disabled : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
        />
      ) : (
        <>
          {leadingIcon && (
            <View style={{ marginRight: theme.spacing.sm }}>
              {leadingIcon}
            </View>
          )}
          <Text style={textStyle}>{label}</Text>
          {trailingIcon && (
            <View style={{ marginLeft: theme.spacing.sm }}>
              {trailingIcon}
            </View>
          )}
        </>
      )}
    </Pressable>
  );
};
