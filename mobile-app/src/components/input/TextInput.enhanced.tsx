import React, { useState, useEffect } from 'react';
import { TextInput as RNTextInput, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme';
import { getInputAccessibilityLabel } from '../../utils/accessibility';
import type { TextInputProps } from './TextInput.types';

export const TextInput: React.FC<TextInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  disabled = false,
  required = false,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}) => {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = useSharedValue(theme.colors.outline);
  const translateX = useSharedValue(0);

  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    return theme.colors.outline;
  };

  // Animate border color on focus/blur
  useEffect(() => {
    borderColor.value = withTiming(getBorderColor(), {
      duration: 200,
      easing: Easing.ease,
    });
  }, [isFocused, error]);

  // Error shake animation
  useEffect(() => {
    if (error) {
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [error]);

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      borderColor: borderColor.value,
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View
      style={{
        opacity: disabled ? theme.opacity.disabled : 1,
      }}
    >
      {label && (
        <Text
          style={[
            theme.typography.bodySmall,
            {
              color: theme.colors.onSurfaceVariant,
              marginBottom: theme.spacing.sm,
              fontWeight: '600',
            },
          ]}
        >
          {label}
          {required && (
            <Text style={{ color: theme.colors.error }}> *</Text>
          )}
        </Text>
      )}

      <Animated.View
        style={[
          {
            borderWidth: 1,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.md,
            minHeight: 48,
          },
          animatedBorderStyle,
        ]}
      >
        <RNTextInput
          style={[
            theme.typography.bodyLarge,
            {
              color: theme.colors.onSurface,
              padding: 0,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          accessible
          accessibilityLabel={
            accessibilityLabel ||
            getInputAccessibilityLabel(label || placeholder || '', required, error)
          }
          accessibilityHint={accessibilityHint || helperText}
          accessibilityState={{ invalid: !!error, disabled }}
          {...rest}
        />
      </Animated.View>

      {error && (
        <Text
          style={[
            theme.typography.bodySmall,
            {
              color: theme.colors.error,
              marginTop: theme.spacing.sm,
            },
          ]}
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Error: ${error}`}
        >
          {error}
        </Text>
      )}

      {!error && helperText && (
        <Text
          style={[
            theme.typography.bodySmall,
            {
              color: theme.colors.onSurfaceVariant,
              marginTop: theme.spacing.sm,
            },
          ]}
        >
          {helperText}
        </Text>
      )}
    </View>
  );
};
