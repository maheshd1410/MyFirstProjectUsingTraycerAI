import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme';
import { Product, ProductVariant } from '../../types';
import { ProductStackParamList } from '../../navigation/types';
import { MOCK_PRODUCTS } from './products.mock';
import { useCart } from '../../state';

const formatPrice = (value?: string) => {
  if (!value) return null;
  const number = parseFloat(value);
  return isNaN(number) ? null : number.toFixed(2);
};

type Props = NativeStackScreenProps<ProductStackParamList, 'ProductDetail'>;

export const ProductDetailScreen: React.FC<Props> = ({ route }) => {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const { addToCart } = useCart();
  const { productId } = route.params;

  const product = useMemo<Product | undefined>(
    () => MOCK_PRODUCTS.find((item) => item.id === productId),
    [productId]
  );

  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    product?.variants?.[0]?.id
  );
  const [quantity, setQuantity] = useState(1);

  const selectedVariant: ProductVariant | undefined = useMemo(() => {
    if (!product?.variants) return undefined;
    return product.variants.find((variant) => variant.id === selectedVariantId) || product.variants[0];
  }, [product, selectedVariantId]);

  if (!product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centered}>
          <Text style={[theme.typography.titleMedium, { color: theme.colors.error }]}>Product not found</Text>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.textLight, marginTop: theme.spacing.xs }]}>This product is unavailable in mock data.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const basePrice = selectedVariant?.price || product.price;
  const baseDiscount = selectedVariant?.discountPrice || product.discountPrice;

  const priceDisplay = formatPrice(basePrice);
  const discountDisplay = formatPrice(baseDiscount);

  const handleSelectVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((current) => {
      const next = current + delta;
      const max = selectedVariant?.stockQuantity ?? product.stockQuantity;
      if (next < 1) return 1;
      if (max && next > max) return max;
      return next;
    });
  };

  const handleAddToCart = () => {
    const cartItem = {
      id: `${product.id}_${selectedVariant?.id || 'no-variant'}_${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productImage: product.images[0],
      price: basePrice,
      discountPrice: baseDiscount,
      quantity,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      variantAttributes: selectedVariant?.attributes,
    };

    addToCart(cartItem);

    const variantLabel = selectedVariant ? `Variant: ${selectedVariant.name}` : '';
    Alert.alert(
      'Added to Cart',
      `${product.name}${variantLabel ? '\n' + variantLabel : ''}\nQuantity: ${quantity}`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        { 
          text: 'Go to Cart', 
          onPress: () => navigation.navigate('Cart' as never)
        }
      ]
    );
  };

  const variantChips = product.variants?.map((variant) => {
    const isSelected = variant.id === selectedVariantId;
    const label = variant.name || Object.values(variant.attributes || {}).join(' • ');
    return (
      <Pressable
        key={variant.id}
        onPress={() => handleSelectVariant(variant.id)}
        style={[
          styles.chip,
          {
            backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
            borderColor: isSelected ? theme.colors.primary : theme.colors.outlineVariant,
            marginRight: theme.spacing.sm,
            marginBottom: theme.spacing.sm,
          },
        ]}
      >
        <Text
          style={{
            color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant,
            ...theme.typography.labelMedium,
          }}
        >
          {label || 'Variant'}
        </Text>
      </Pressable>
    );
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xl }}>
        <Image
          source={{ uri: product.images[0] }}
          style={styles.heroImage}
          resizeMode="cover"
        />

        <View style={[styles.section, { paddingHorizontal: theme.spacing.md }]}> 
          <Text style={[theme.typography.titleLarge, { color: theme.colors.text }]}>{product.name}</Text>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.textLight, marginTop: theme.spacing.xs }]}>
            {product.category.name}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.sm }}>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.primary, marginRight: theme.spacing.sm }]}>
              ⭐ {product.averageRating.toFixed(1)}
            </Text>
            <Text style={[theme.typography.bodySmall, { color: theme.colors.textLight }]}>({product.totalReviews} reviews)</Text>
          </View>
        </View>

        <View style={[styles.section, { paddingHorizontal: theme.spacing.md }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            {discountDisplay ? (
              <>
                <Text style={[theme.typography.titleLarge, { color: theme.colors.primary, marginRight: theme.spacing.sm }]}>₹{discountDisplay}</Text>
                <Text style={[theme.typography.bodyMedium, { color: theme.colors.textLight, textDecorationLine: 'line-through' }]}>₹{priceDisplay}</Text>
              </>
            ) : (
              <Text style={[theme.typography.titleLarge, { color: theme.colors.primary }]}>₹{priceDisplay}</Text>
            )}
          </View>
          <Text style={[theme.typography.bodySmall, { color: theme.colors.textLight, marginTop: theme.spacing.xs }]}>
            In stock: {selectedVariant?.stockQuantity ?? product.stockQuantity} {product.unit.toLowerCase()}
          </Text>
        </View>

        {variantChips && variantChips.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: theme.spacing.md }]}> 
            <Text style={[theme.typography.titleMedium, { color: theme.colors.text, marginBottom: theme.spacing.sm }]}>Variants</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{variantChips}</View>
          </View>
        )}

        <View style={[styles.section, { paddingHorizontal: theme.spacing.md }]}> 
          <Text style={[theme.typography.titleMedium, { color: theme.colors.text, marginBottom: theme.spacing.xs }]}>Description</Text>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.textLight, lineHeight: 20 }]}>{product.description}</Text>
        </View>

        <View style={[styles.section, { paddingHorizontal: theme.spacing.md }]}> 
          <Text style={[theme.typography.titleMedium, { color: theme.colors.text, marginBottom: theme.spacing.sm }]}>Quantity</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => handleQuantityChange(-1)} style={[styles.counterButton, { backgroundColor: theme.colors.surfaceVariant }]}> 
              <Text style={[theme.typography.titleMedium, { color: theme.colors.text }]}>-</Text>
            </Pressable>
            <Text style={[theme.typography.titleMedium, { color: theme.colors.text, marginHorizontal: theme.spacing.md }]}>{quantity}</Text>
            <Pressable onPress={() => handleQuantityChange(1)} style={[styles.counterButton, { backgroundColor: theme.colors.surfaceVariant }]}> 
              <Text style={[theme.typography.titleMedium, { color: theme.colors.text }]}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.section, { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.lg }]}> 
          <Pressable onPress={handleAddToCart} style={[styles.addButton, { backgroundColor: theme.colors.primary }]}> 
            <Text style={[theme.typography.titleMedium, { color: theme.colors.onPrimary, textAlign: 'center' }]}>Add to Cart</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 280,
  },
  section: {
    paddingVertical: 16,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    borderRadius: 12,
    paddingVertical: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
