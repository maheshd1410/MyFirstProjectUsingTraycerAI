import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchCart,
  updateCartItem,
  removeFromCart,
  clearCartAsync,
  selectCartItems,
  selectCartLoading,
  selectCartError,
  selectCartTotal,
  selectCartItemCount,
} from '../../store/cart/cartSlice';
import { Button } from '../../components';
import { theme } from '../../theme';
import { CartItem } from '../../types';

type AppStackParamList = {
  Cart: undefined;
  ProductList: undefined;
};

type Props = NativeStackScreenProps<AppStackParamList, 'Cart'>;

export const CartScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const loading = useAppSelector(selectCartLoading);
  const error = useAppSelector(selectCartError);
  const totalAmount = useAppSelector(selectCartTotal);
  const itemCount = useAppSelector(selectCartItemCount);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleQuantityIncrease = (item: CartItem) => {
    dispatch(updateCartItem({ itemId: item.id, quantity: item.quantity + 1 }));
  };

  const handleQuantityDecrease = (item: CartItem) => {
    if (item.quantity > 1) {
      dispatch(updateCartItem({ itemId: item.id, quantity: item.quantity - 1 }));
    }
  };

  const handleRemoveItem = (itemId: string) => {
    dispatch(removeFromCart(itemId));
  };

  const handleClearCart = () => {
    dispatch(clearCartAsync());
  };

  const handleContinueShopping = () => {
    navigation.navigate('ProductList');
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const displayPrice = item.discountPrice ? parseFloat(item.discountPrice) : parseFloat(item.price);
    const originalPrice = parseFloat(item.price);
    const hasDiscount = item.discountPrice && parseFloat(item.discountPrice) < originalPrice;

    return (
      <View style={styles.cartItemContainer}>
        <Image source={{ uri: item.productImage }} style={styles.itemImage as any} />

        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.productName}
          </Text>

          <View style={styles.priceContainer}>
            {hasDiscount ? (
              <>
                <Text style={styles.discountPrice}>₹{displayPrice.toFixed(2)}</Text>
                <Text style={styles.originalPrice}>₹{originalPrice.toFixed(2)}</Text>
              </>
            ) : (
              <Text style={styles.price}>₹{displayPrice.toFixed(2)}</Text>
            )}
          </View>

          <Text style={styles.subtotal}>
            Subtotal: ₹{parseFloat(item.subtotal).toFixed(2)}
          </Text>

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityDecrease(item)}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityIncrease(item)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.id)}
        >
          <Text style={styles.removeButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🛒</Text>
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptyMessage}>Add items from our products to get started</Text>
      <Button title="Continue Shopping" onPress={handleContinueShopping} />
    </View>
  );

  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load cart</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Button
            title="Retry"
            onPress={() => dispatch(fetchCart())}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {items.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            scrollEnabled={true}
          />

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items:</Text>
              <Text style={styles.summaryValue}>{itemCount}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>₹{parseFloat(totalAmount).toFixed(2)}</Text>
            </View>

            <Button
              title="Proceed to Checkout"
              onPress={() => navigation.navigate('Checkout' as never)}
              style={styles.checkoutButton}
            />

            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearCart}
              disabled={loading}
            >
              <Text style={styles.clearButtonText}>Clear Cart</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  errorMessage: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  cartItemContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  price: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.primary,
  },
  discountPrice: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  originalPrice: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    textDecorationLine: 'line-through' as any,
  },
  subtotal: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
  },
  quantity: {
    marginHorizontal: theme.spacing.sm,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: theme.spacing.sm,
  },
  removeButtonText: {
    fontSize: 18,
  },
  summaryContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  summaryValue: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
  },
  totalLabel: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.primary,
  },
  checkoutButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  clearButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.md,
  },
  clearButtonText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
});
