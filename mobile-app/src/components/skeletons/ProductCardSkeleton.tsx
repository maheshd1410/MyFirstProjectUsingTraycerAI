import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBase';
import { theme } from '../../theme';

interface ProductCardSkeletonProps {
  variant?: 'grid' | 'list';
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({
  variant = 'grid',
}) => {
  if (variant === 'list') {
    return (
      <View style={styles.listContainer}>
        <SkeletonBox width={100} height={100} borderRadius={8} />
        <View style={styles.listContent}>
          <SkeletonBox width="80%" height={16} style={styles.titleLine} />
          <SkeletonBox width="50%" height={14} style={styles.categoryLine} />
          <View style={styles.ratingRow}>
            <SkeletonBox width={60} height={14} />
            <SkeletonBox width={40} height={14} />
          </View>
          <SkeletonBox width="40%" height={18} style={styles.priceLine} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gridContainer}>
      <SkeletonBox
        width="100%"
        height={150}
        borderRadius={8}
        style={styles.image}
      />
      <View style={styles.gridContent}>
        <SkeletonBox width="90%" height={14} style={styles.titleLine} />
        <SkeletonBox width="70%" height={14} style={styles.titleLine} />
        <SkeletonBox width="60%" height={12} style={styles.categoryLine} />
        <View style={styles.ratingRow}>
          <SkeletonBox width={50} height={12} />
          <SkeletonBox width={30} height={12} />
        </View>
        <SkeletonBox width="50%" height={16} style={styles.priceLine} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    margin: 4,
    padding: 8,
  },
  listContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  image: {
    marginBottom: 8,
  },
  gridContent: {
    padding: 4,
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  titleLine: {
    marginBottom: 6,
  },
  categoryLine: {
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  priceLine: {
    marginTop: 4,
  },
});
