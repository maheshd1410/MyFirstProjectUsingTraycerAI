import React, { useState } from 'react';
import { TextInput as RNTextInput, View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme';
import type { TextInputProps } from './TextInput.types';

export const TextInput: React.FC<TextInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  disabled = false,
  accessibilityLabel,
  ...rest
}) => {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    return theme.colors.outline;
  };

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
            },
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          borderWidth: 1,
          borderColor: getBorderColor(),
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.md,
        }}
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
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={helperText}
          accessibilityState={{ invalid: !!error, disabled }}
          {...rest}
        />
      </View>

      {error && (
        <Text
          style={[
            theme.typography.bodySmall,
            {
              color: theme.colors.error,
              marginTop: theme.spacing.sm,
            },
          ]}
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
