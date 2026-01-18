import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface SocialLoginButtonProps {
  provider: 'google' | 'apple';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  onPress,
  loading = false,
  disabled = false,
}) => {
  const isGoogle = provider === 'google';
  const buttonText = `Continue with ${isGoogle ? 'Google' : 'Apple'}`;
  const icon = isGoogle ? 'logo-google' : 'logo-apple';
  
  const buttonStyle = isGoogle ? styles.googleButton : styles.appleButton;
  const textStyle = isGoogle ? styles.googleText : styles.appleText;

  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={isGoogle ? theme.colors.text : '#FFFFFF'} />
      ) : (
        <>
          <Ionicons 
            name={icon} 
            size={20} 
            color={isGoogle ? theme.colors.text : '#FFFFFF'} 
            style={styles.icon}
          />
          <Text style={[styles.text, textStyle]}>{buttonText}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: theme.colors.border,
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  text: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as '600',
  },
  googleText: {
    color: theme.colors.text,
  },
  appleText: {
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.5,
  },
});
