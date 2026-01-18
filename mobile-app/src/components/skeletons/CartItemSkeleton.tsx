import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBase';
import { theme } from '../../theme';

export const CartItemSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <SkeletonBox width={80} height={80} borderRadius={8} />
      
      <View style={styles.details}>
        <SkeletonBox width="80%" height={16} style={styles.name} />
        <SkeletonBox width="50%" height={14} style={styles.price} />
        <SkeletonBox width="60%" height={14} style={styles.subtotal} />
        
        <View style={styles.quantityContainer}>
          <SkeletonBox width={36} height={36} borderRadius={4} />
          <SkeletonBox width={40} height={20} style={styles.quantity} />
          <SkeletonBox width={36} height={36} borderRadius={4} />
        </View>
      </View>

      <SkeletonBox width={36} height={36} borderRadius={18} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    marginBottom: 8,
  },
  price: {
    marginBottom: 6,
  },
  subtotal: {
    marginBottom: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantity: {
    marginHorizontal: 4,
  },
});
