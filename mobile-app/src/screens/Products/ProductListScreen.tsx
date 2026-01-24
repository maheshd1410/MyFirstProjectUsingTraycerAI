import React, { useMemo, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header } from '../../components';
import { ProductCard } from '../../components/product';
import { useAppTheme } from '../../theme';
import { Product } from '../../types';
import { MOCK_PRODUCTS } from './products.mock';
import { ProductStackParamList } from '../../navigation/types';
import { FadeIn } from '../../animations/FadeIn';
import { ListItemAnimation } from '../../animations/ListItemAnimation';
import { createKeyExtractor, getOptimizedFlatListProps } from '../../utils/performance';
import { getAccessibilityHint } from '../../utils/accessibility';

type Props = NativeStackScreenProps<ProductStackParamList, 'ProductList'>;

export const ProductListScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useAppTheme();
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  const products = useMemo<Product[]>(() => MOCK_PRODUCTS, []);

  const handleToggleLayout = useCallback(() => {
    setLayout((current) => (current === 'grid' ? 'list' : 'grid'));
  }, []);

  const handleProductPress = useCallback((productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  }, [navigation]);

  // Memoized renderItem for performance
  const renderItem = useCallback(({ item, index }: { item: Product; index: number }) => {
    const isLastInRow = layout === 'grid' && (index + 1) % 2 === 0;

    return (
      <ListItemAnimation index={index} delay={index * 50}>
        <View
          style={[
            styles.item,
            {
              marginRight: layout === 'grid' && !isLastInRow ? theme.spacing.md : 0,
              marginBottom: theme.spacing.md,
              flex: layout === 'grid' ? 1 : undefined,
            },
          ]}
        >
          <ProductCard
            product={item}
            variant={layout}
            onPress={handleProductPress}
          />
        </View>
      </ListItemAnimation>
    );
  }, [layout, theme.spacing.md, handleProductPress]);

  // Stable key extractor
  const keyExtractor = createKeyExtractor('product');
  
  // Optimized FlatList props
  const flatListProps = getOptimizedFlatListProps();

  return (
    <SafeAreaView 
      style={{ flex: 1, backgroundColor: theme.colors.background }} 
      edges={['bottom']}
      accessibilityLabel="Products screen"
    >
      <FadeIn duration={300}>
        <Header
          title="Products"
          rightAction={
            <Pressable 
              onPress={handleToggleLayout} 
              style={{ paddingHorizontal: theme.spacing.md }}
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${layout === 'grid' ? 'list' : 'grid'} view`}
              accessibilityHint={getAccessibilityHint('change product display layout')}
            >
              <Text style={[theme.typography.labelLarge, { color: theme.colors.primary }]}>
                {layout === 'grid' ? 'List' : 'Grid'} View
              </Text>
            </Pressable>
          }
        />

        <FlatList
          data={products}
          key={layout === 'grid' ? 'grid' : 'list'}
          keyExtractor={keyExtractor}
          numColumns={layout === 'grid' ? 2 : 1}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.md,
          }}
          columnWrapperStyle={layout === 'grid' ? styles.columnWrapper : undefined}
          ListEmptyComponent={
            <View style={{ padding: theme.spacing.lg, alignItems: 'center' }}>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.textLight }]}>
                No products available
              </Text>
            </View>
          }
          accessibilityLabel="Product list"
          {...flatListProps}
        />
      </FadeIn>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  item: {
    minWidth: 0,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});
