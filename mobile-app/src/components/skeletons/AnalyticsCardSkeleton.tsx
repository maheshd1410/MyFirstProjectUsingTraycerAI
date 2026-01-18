import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBase';
import { theme } from '../../theme';

export const AnalyticsCardSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <SkeletonBox width="60%" height={16} style={styles.title} />
      <SkeletonBox width="80%" height={32} style={styles.value} />
      <SkeletonBox width="40%" height={14} style={styles.subtitle} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  title: {
    marginBottom: 12,
  },
  value: {
    marginBottom: 8,
  },
  subtitle: {
    marginTop: 4,
  },
});
