import React, { useEffect, useState } from 'react';

/**
 * Stable keyExtractor for FlatList
 */
export const createKeyExtractor = <T extends { id: string }>(
  prefix?: string
) => (item: T, index: number): string => {
  return prefix ? `${prefix}-${item.id}` : item.id;
};

/**
 * Memoized renderItem wrapper for FlatList
 */
export const createMemoizedRenderItem = <T>(
  Component: React.ComponentType<{ item: T; index: number }>
) => {
  const MemoizedComponent = React.memo(Component);
  return ({ item, index }: { item: T; index: number }) => (
    <MemoizedComponent item={item} index={index} />
  );
};

/**
 * Image optimization helper
 */
export const getOptimizedImageProps = (
  uri: string,
  width?: number,
  height?: number
) => {
  const props: any = {
    source: { uri },
    resizeMode: 'cover' as const,
    defaultSource: undefined, // Can add placeholder
  };
  
  // Only add style if width/height are provided
  if (width !== undefined && height !== undefined) {
    props.style = { width, height };
  }
  
  return props;
};

/**
 * Debounce hook for search inputs
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttle hook for limiting function calls
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const [lastCall, setLastCall] = useState(0);

  return React.useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        setLastCall(now);
        return callback(...args);
      }
    }) as T,
    [callback, delay, lastCall]
  );
};

/**
 * Check if two objects are shallowly equal (for memoization)
 */
export const shallowEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  
  if (
    typeof obj1 !== 'object' ||
    obj1 === null ||
    typeof obj2 !== 'object' ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }

  return true;
};

/**
 * Optimized FlatList props for better performance
 */
export const getOptimizedFlatListProps = () => ({
  removeClippedSubviews: true,
  maxToRenderPerBatch: 10,
  windowSize: 10,
  initialNumToRender: 6,
  updateCellsBatchingPeriod: 50,
});
