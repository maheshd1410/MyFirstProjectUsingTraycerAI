import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBase';

export const CategoryChipSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <SkeletonBox width={80} height={32} borderRadius={16} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 8,
  },
});
