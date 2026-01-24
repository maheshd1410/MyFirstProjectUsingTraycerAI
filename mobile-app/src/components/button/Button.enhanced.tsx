import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme';
import { ensureTouchTarget, getButtonAccessibilityLabel, getAccessibilityHint } from '../../utils/accessibility';
import type { ButtonProps } from './Button.types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  accessibilityHint,
}) => {
  const theme = useAppTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

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
      ...ensureTouchTarget(44),
    },
  ];

  const textStyle = [
    theme.typography.labelLarge,
    {
      color: getTextColor(),
      marginHorizontal: leadingIcon || trailingIcon ? theme.spacing.sm : 0,
    },
  ];

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 10, stiffness: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
  };

  // Animate loading state transition
  React.useEffect(() => {
    opacity.value = withTiming(loading ? 0.7 : 1, { duration: 200 });
  }, [loading, opacity]);

  const state = loading ? 'loading' : disabled ? 'disabled' : undefined;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || getButtonAccessibilityLabel(label, state)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[containerStyle, animatedStyle]}
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
    </AnimatedPressable>
  );
};
