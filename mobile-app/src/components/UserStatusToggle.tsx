import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';

interface UserStatusToggleProps {
  userId: string;
  isActive: boolean;
  onToggle: (userId: string, isActive: boolean) => Promise<void>;
}

export const UserStatusToggle: React.FC<UserStatusToggleProps> = ({
  userId,
  isActive,
  onToggle,
}) => {
  const [loading, setLoading] = useState(false);

  const handleToggle = () => {
    Alert.alert(
      'Confirm Status Change',
      `Are you sure you want to ${isActive ? 'disable' : 'enable'} this account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await onToggle(userId, !isActive);
              Alert.alert('Success', `Account ${!isActive ? 'enabled' : 'disabled'} successfully`);
            } catch (error) {
              Alert.alert('Error', 'Failed to update account status');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Account Status</Text>
        <Text style={[styles.status, isActive ? styles.statusActive : styles.statusInactive]}>
          {isActive ? 'Active' : 'Inactive'}
        </Text>
      </View>
      <View style={styles.switchContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Switch
            value={isActive}
            onValueChange={handleToggle}
            trackColor={{ false: theme.colors.border, true: `${theme.colors.success}50` }}
            thumbColor={isActive ? theme.colors.success : theme.colors.textLight}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.md,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  status: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium as any,
  },
  statusActive: {
    color: theme.colors.success,
  },
  statusInactive: {
    color: theme.colors.error,
  },
  switchContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
});
