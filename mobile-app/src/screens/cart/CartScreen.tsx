import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { useCart } from '../../state';
import { Button } from '../../components';
import type { LocalCartItem } from '../../state';
import { ListItemAnimation } from '../../animations/ListItemAnimation';
import { SlideIn } from '../../animations/SlideIn';
import { 
  formatCartItemForScreenReader, 
  ensureTouchTarget 
} from '../../utils/accessibility';
import { getOptimizedImageProps } from '../../utils/performance';

// Memoized CartItem component
const CartItem = React.memo<{
  item: LocalCartItem;
  onQuantityChange: (itemId: string, currentQuantity: number, delta: number) => void;
  onRemove: (itemId: string, productName: string) => void;
  theme: any;
}>(({ item, onQuantityChange, onRemove, theme }) => {
  const price = item.discountPrice ? parseFloat(item.discountPrice) : parseFloat(item.price);
  const originalPrice = parseFloat(item.price);
  const subtotal = price * item.quantity;
  const hasDiscount = !!item.discountPrice;
  const touchTargetStyle = ensureTouchTarget(44);

  return (
    <View
      style={[
        styles.cartItem,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.md,
          ...theme.elevation[1],
        },
      ]}
      accessibilityLabel={`${item.productName}, quantity ${item.quantity}, subtotal ₹${subtotal.toFixed(2)}`}
      accessibilityRole="button"
    >
      <Image
        source={{ uri: item.productImage }}
        style={[styles.itemImage, { backgroundColor: theme.colors.surfaceVariant }]}
        resizeMode="cover"
      />
      <View style={styles.itemDetails}>
        <Text
          style={[theme.typography.bodyLarge, { color: theme.colors.onSurface, fontWeight: '600' }]}
          numberOfLines={2}
        >
          {item.productName}
        </Text>
        {item.variantName && (
          <Text
            style={[
              theme.typography.bodySmall,
              { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xs },
            ]}
          >
            Variant: {item.variantName}
          </Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs }}>
          {hasDiscount ? (
            <>
              <Text
                style={[
                  theme.typography.titleMedium,
                  { color: theme.colors.primary, fontWeight: '600' },
                ]}
              >
                ₹{price.toFixed(2)}
              </Text>
              <Text
                style={[
                  theme.typography.bodySmall,
                  {
                    color: theme.colors.onSurfaceVariant,
                    textDecorationLine: 'line-through',
                    marginLeft: theme.spacing.sm,
                  },
                ]}
              >
                ₹{originalPrice.toFixed(2)}
              </Text>
            </>
          ) : (
            <Text
              style={[
                theme.typography.titleMedium,
                { color: theme.colors.primary, fontWeight: '600' },
              ]}
            >
              ₹{price.toFixed(2)}
            </Text>
          )}
        </View>

        <View style={[styles.itemActions, { marginTop: theme.spacing.sm }]}>
          <View style={styles.quantityControls}>
            <Pressable
              onPress={() => onQuantityChange(item.id, item.quantity, -1)}
              disabled={item.quantity <= 1}
              style={[
                styles.quantityButton,
                touchTargetStyle,
                {
                  backgroundColor: item.quantity <= 1 ? theme.colors.surfaceVariant : theme.colors.primaryContainer,
                  borderRadius: theme.radius.sm,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
            >
              <Ionicons
                name="remove"
                size={18}
                color={item.quantity <= 1 ? theme.colors.onSurfaceVariant : theme.colors.onPrimaryContainer}
              />
            </Pressable>
            <Text
              style={[
                theme.typography.titleMedium,
                { color: theme.colors.onSurface, marginHorizontal: theme.spacing.md },
              ]}
              accessibilityLabel={`Quantity: ${item.quantity}`}
            >
              {item.quantity}
            </Text>
            <Pressable
              onPress={() => onQuantityChange(item.id, item.quantity, 1)}
              style={[
                styles.quantityButton,
                touchTargetStyle,
                {
                  backgroundColor: theme.colors.primaryContainer,
                  borderRadius: theme.radius.sm,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
            >
              <Ionicons name="add" size={18} color={theme.colors.onPrimaryContainer} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => onRemove(item.id, item.productName)}
            style={[styles.removeButton, { marginLeft: theme.spacing.md }, touchTargetStyle]}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.productName} from cart`}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
          </Pressable>
        </View>

        <Text
          style={[
            theme.typography.bodyMedium,
            { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xs },
          ]}
        >
          Subtotal: ₹{subtotal.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.price === nextProps.item.price &&
    prevProps.item.discountPrice === nextProps.item.discountPrice
  );
});

export const CartScreen: React.FC = () => {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const { state, updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = useCallback((itemId: string, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  }, [updateQuantity]);

  const handleRemoveItem = useCallback((itemId: string, productName: string) => {
    Alert.alert(
      'Remove Item',
      `Remove ${productName} from cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromCart(itemId),
        },
      ]
    );
  }, [removeFromCart]);

  const handleProceedToCheckout = () => {
    navigation.navigate('Checkout' as never);
  };

  const handleContinueShopping = () => {
    navigation.navigate('MainTabs' as never, { screen: 'Products' } as never);
  };

  const renderItem = useCallback(({ item, index }: { item: LocalCartItem; index: number }) => (
    <ListItemAnimation index={index}>
      <CartItem
        item={item}
        onQuantityChange={handleQuantityChange}
        onRemove={handleRemoveItem}
        theme={theme}
      />
    </ListItemAnimation>
  ), [handleQuantityChange, handleRemoveItem, theme]);

  const keyExtractor = useCallback((item: LocalCartItem) => item.id, []);

  const renderEmptyCart = () => (
    <View style={[styles.emptyContainer, { padding: theme.spacing.xl }]}>
      <Ionicons name="cart-outline" size={80} color={theme.colors.onSurfaceVariant} />
      <Text
        style={[
          theme.typography.titleLarge,
          { color: theme.colors.onSurface, marginTop: theme.spacing.md, textAlign: 'center' },
        ]}
      >
        Your cart is empty
      </Text>
      <Text
        style={[
          theme.typography.bodyMedium,
          { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.sm, textAlign: 'center' },
        ]}
      >
        Add products to your cart to see them here
      </Text>
      <Button
        label="Continue Shopping"
        onPress={handleContinueShopping}
        variant="filled"
        style={{ marginTop: theme.spacing.lg }}
      />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <View style={[styles.header, { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md }]}>
        <Text style={[theme.typography.titleLarge, { color: theme.colors.onSurface }]}>
          Cart ({state.totalQuantity} {state.totalQuantity === 1 ? 'item' : 'items'})
        </Text>
      </View>

      {state.items.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          <FlatList
            data={state.items}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.md,
              paddingTop: theme.spacing.sm,
              paddingBottom: theme.spacing.md,
            }}
          />

          <SlideIn direction="up" duration={300}>
            <View
              style={[
                styles.footer,
                {
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.md,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.outlineVariant,
                  ...theme.elevation[2],
                },
              ]}
            >
              <View style={styles.footerRow}>
                <Text style={[theme.typography.bodyLarge, { color: theme.colors.onSurfaceVariant }]}>
                  Total Items:
                </Text>
                <Text style={[theme.typography.bodyLarge, { color: theme.colors.onSurface }]}>
                  {state.totalQuantity}
                </Text>
              </View>
              <View style={[styles.footerRow, { marginTop: theme.spacing.xs }]}>
                <Text style={[theme.typography.titleMedium, { color: theme.colors.onSurface }]}>
                  Total Amount:
                </Text>
                <Text
                  style={[theme.typography.titleLarge, { color: theme.colors.primary, fontWeight: '600' }]}
                  accessibilityLiveRegion="polite"
                  accessibilityLabel={`Total amount: ₹${state.totalAmount.toFixed(2)}`}
                >
                  ₹{state.totalAmount.toFixed(2)}
                </Text>
              </View>
              <Button
                label="Proceed to Checkout"
                onPress={handleProceedToCheckout}
                variant="filled"
                style={{ marginTop: theme.spacing.md }}
              />
            </View>
          </SlideIn>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {},
  cartItem: {
    flexDirection: 'row',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {},
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
