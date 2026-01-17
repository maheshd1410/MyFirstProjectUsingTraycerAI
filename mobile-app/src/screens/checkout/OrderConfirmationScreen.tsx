import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOrderById, selectSelectedOrder, selectOrderLoading } from '../../store/order/orderSlice';
import { clearCartAsync } from '../../store/cart/cartSlice';
import { theme } from '../../theme';
import { Button } from '../../components';

interface OrderConfirmationScreenProps {
  navigation: any;
  route: any;
}

export const OrderConfirmationScreen: React.FC<OrderConfirmationScreenProps> = ({
  navigation,
  route,
}) => {
  const { orderId } = route.params;
  const dispatch = useAppDispatch();
  const selectedOrder = useAppSelector(selectSelectedOrder);
  const loading = useAppSelector(selectOrderLoading);

  // Prevent back navigation
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
      gestureEnabled: false,
    });
  }, [navigation]);

  // Fetch order details and clear cart on mount
  useEffect(() => {
    dispatch(fetchOrderById(orderId) as any);
    dispatch(clearCartAsync() as any);
  }, [orderId, dispatch]);

  const handleViewOrderDetails = () => {
    navigation.navigate('ProductList');
  };

  const handleContinueShopping = () => {
    navigation.navigate('ProductList');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Success Icon and Message */}
      <View style={styles.successSection}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>Order Placed Successfully!</Text>
        <Text style={styles.successSubtitle}>
          Thank you for your order. We'll process it soon.
        </Text>
      </View>

      {/* Order Details */}
      {selectedOrder && (
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Number</Text>
            <Text style={styles.detailValue}>{selectedOrder.orderNumber}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Amount</Text>
            <Text style={styles.detailValue}>
              ₹{parseFloat(selectedOrder.totalAmount).toFixed(2)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Delivery</Text>
            <Text style={styles.detailValue}>
              {new Date(selectedOrder.estimatedDeliveryDate).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Order Items */}
          <View style={styles.itemsSection}>
            <Text style={styles.itemsSectionTitle}>Order Items</Text>
            {selectedOrder.items && selectedOrder.items.length > 0 ? (
              selectedOrder.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    ₹{parseFloat(item.totalPrice).toFixed(2)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noItemsText}>No items in this order</Text>
            )}
          </View>

          <View style={styles.divider} />

          {/* Delivery Address */}
          <View style={styles.addressSection}>
            <Text style={styles.addressSectionTitle}>Delivery Address</Text>
            <Text style={styles.addressText}>{selectedOrder.address?.fullName}</Text>
            <Text style={styles.addressText}>{selectedOrder.address?.addressLine1}</Text>
            {selectedOrder.address?.addressLine2 && (
              <Text style={styles.addressText}>{selectedOrder.address.addressLine2}</Text>
            )}
            <Text style={styles.addressText}>
              {selectedOrder.address?.city}, {selectedOrder.address?.state}{' '}
              {selectedOrder.address?.postalCode}
            </Text>
            <Text style={styles.addressText}>{selectedOrder.address?.phoneNumber}</Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <Button
          title="View Order Details"
          onPress={handleViewOrderDetails}
          style={styles.primaryButton}
        />
        <Button
          title="Continue Shopping"
          onPress={handleContinueShopping}
          style={styles.secondaryButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  successSection: {
    backgroundColor: `${theme.colors.success}10`,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  successTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  successSubtitle: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  detailsSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  detailLabel: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  detailValue: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  itemsSection: {
    paddingVertical: theme.spacing.md,
  },
  itemsSectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  itemQuantity: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
  },
  itemPrice: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
  },
  noItemsText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
  addressSection: {
    paddingVertical: theme.spacing.md,
  },
  addressSectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  addressText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  actionsSection: {
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  primaryButton: {
    marginBottom: theme.spacing.md,
  },
  secondaryButton: {
    marginBottom: 0,
  },
});
