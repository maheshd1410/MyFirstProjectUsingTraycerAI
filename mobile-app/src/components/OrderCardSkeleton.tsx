import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '../theme';

export const OrderCardSkeleton: React.FC = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View style={[styles.orderNumber, { opacity }]} />
        <Animated.View style={[styles.statusBadge, { opacity }]} />
      </View>
      
      <Animated.View style={[styles.date, { opacity }]} />
      
      <View style={styles.divider} />
      
      <View style={styles.items}>
        <Animated.View style={[styles.item, { opacity }]} />
        <Animated.View style={[styles.item, { opacity, width: '80%' }]} />
      </View>
      
      <View style={styles.footer}>
        <Animated.View style={[styles.itemCount, { opacity }]} />
        <Animated.View style={[styles.amount, { opacity }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  orderNumber: {
    width: 120,
    height: 18,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
  },
  statusBadge: {
    width: 80,
    height: 24,
    backgroundColor: theme.colors.border,
    borderRadius: 12,
  },
  date: {
    width: 100,
    height: 14,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginBottom: theme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  items: {
    marginBottom: theme.spacing.md,
  },
  item: {
    height: 14,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    width: 60,
    height: 14,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
  },
  amount: {
    width: 80,
    height: 20,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
  },
});
