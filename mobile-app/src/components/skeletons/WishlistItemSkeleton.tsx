import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBase';
import { theme } from '../../theme';

export const WishlistItemSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <SkeletonBox width={100} height={100} borderRadius={8} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <SkeletonBox width="70%" height={16} />
          <SkeletonBox width={24} height={24} borderRadius={12} />
        </View>
        
        <SkeletonBox width="50%" height={14} style={styles.category} />
        
        <View style={styles.ratingRow}>
          <SkeletonBox width={60} height={14} />
          <SkeletonBox width={40} height={14} />
        </View>
        
        <SkeletonBox width="40%" height={18} style={styles.price} />
        
        <View style={styles.actionsRow}>
          <SkeletonBox width={80} height={32} borderRadius={6} />
          <SkeletonBox width={100} height={32} borderRadius={6} />
        </View>
      </View>
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
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  category: {
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  price: {
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
