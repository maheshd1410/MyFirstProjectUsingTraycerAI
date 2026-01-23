import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header } from '../../components';
import { ProductCard } from '../../components/product';
import { useAppTheme } from '../../theme';
import { Product } from '../../types';
import { MOCK_PRODUCTS } from './products.mock';
import { ProductStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProductStackParamList, 'ProductList'>;

export const ProductListScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useAppTheme();
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  const products = useMemo<Product[]>(() => MOCK_PRODUCTS, []);

  const handleToggleLayout = () => {
    setLayout((current) => (current === 'grid' ? 'list' : 'grid'));
  };

  const renderItem = ({ item, index }: { item: Product; index: number }) => {
    const isLastInRow = layout === 'grid' && (index + 1) % 2 === 0;

    return (
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
          onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <Header
        title="Products"
        rightAction={
          <Pressable onPress={handleToggleLayout} style={{ paddingHorizontal: theme.spacing.md }}>
            <Text style={[theme.typography.labelLarge, { color: theme.colors.primary }]}>
              {layout === 'grid' ? 'List' : 'Grid'} View
            </Text>
          </Pressable>
        }
      />

      <FlatList
        data={products}
        key={layout === 'grid' ? 'grid' : 'list'}
        keyExtractor={(item) => item.id}
        numColumns={layout === 'grid' ? 2 : 1}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.md,
        }}
        columnWrapperStyle={layout === 'grid' ? styles.columnWrapper : undefined}
        ListEmptyComponent={
          <View style={{ padding: theme.spacing.lg, alignItems: 'center' }}>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.textLight }]}>No products available</Text>
          </View>
        }
      />
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
