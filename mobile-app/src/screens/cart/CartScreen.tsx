import React from 'react';
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

export const CartScreen: React.FC = () => {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const { state, updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (itemId: string, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string, productName: string) => {
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
  };

  const handleProceedToCheckout = () => {
    navigation.navigate('Checkout' as never);
  };

  const handleContinueShopping = () => {
    navigation.navigate('MainTabs' as never, { screen: 'Products' } as never);
  };

  const renderItem = ({ item }: { item: LocalCartItem }) => {
    const price = item.discountPrice ? parseFloat(item.discountPrice) : parseFloat(item.price);
    const originalPrice = parseFloat(item.price);
    const subtotal = price * item.quantity;
    const hasDiscount = !!item.discountPrice;

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
      >
        <Image
          source={{ uri: item.productImage }}
          style={[styles.itemImage, { backgroundColor: theme.colors.surfaceVariant }]}
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
                onPress={() => handleQuantityChange(item.id, item.quantity, -1)}
                disabled={item.quantity <= 1}
                style={[
                  styles.quantityButton,
                  {
                    backgroundColor: item.quantity <= 1 ? theme.colors.surfaceVariant : theme.colors.primaryContainer,
                    borderRadius: theme.radius.sm,
                  },
                ]}
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
              >
                {item.quantity}
              </Text>
              <Pressable
                onPress={() => handleQuantityChange(item.id, item.quantity, 1)}
                style={[
                  styles.quantityButton,
                  {
                    backgroundColor: theme.colors.primaryContainer,
                    borderRadius: theme.radius.sm,
                  },
                ]}
              >
                <Ionicons name="add" size={18} color={theme.colors.onPrimaryContainer} />
              </Pressable>
            </View>

            <Pressable
              onPress={() => handleRemoveItem(item.id, item.productName)}
              style={[styles.removeButton, { marginLeft: theme.spacing.md }]}
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
  };

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
        onPress={handleContinueShopping}
        variant="filled"
        style={{ marginTop: theme.spacing.lg }}
      >
        Continue Shopping
      </Button>
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
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.md,
              paddingTop: theme.spacing.sm,
              paddingBottom: theme.spacing.md,
            }}
          />

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
              >
                ₹{state.totalAmount.toFixed(2)}
              </Text>
            </View>
            <Button
              onPress={handleProceedToCheckout}
              variant="filled"
              style={{ marginTop: theme.spacing.md }}
            >
              Proceed to Checkout
            </Button>
          </View>
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
