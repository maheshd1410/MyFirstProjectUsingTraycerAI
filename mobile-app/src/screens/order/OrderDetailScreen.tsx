import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchOrderById,
  selectSelectedOrder,
  selectOrderLoading,
  cancelOrder,
} from '../../store/order/orderSlice';
import { useReviews } from '../../hooks/useReviews';
import { Order, OrderStatus } from '../../types';
import { theme } from '../../theme';
import { Button, OrderCancellationModal, OrderStatusBadge } from '../../components';

interface OrderDetailScreenProps {
  navigation: any;
  route: any;
}

export const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { orderId } = route.params;
  const dispatch = useAppDispatch();
  const order = useAppSelector(selectSelectedOrder);
  const loading = useAppSelector(selectOrderLoading);
  const { userReviews, loadUserReviews } = useReviews();
  const [canceling, setCanceling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  useEffect(() => {
    dispatch(fetchOrderById(orderId) as any);
    loadUserReviews();
  }, [orderId, dispatch]);

  const handleRefresh = () => {
    setRefreshing(true);
    dispatch(fetchOrderById(orderId) as any).finally(() => {
      setRefreshing(false);
    });
  };


  const handleTrackOrder = () => {
    navigation.navigate('OrderTracking', { orderId });
  };

  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancellation = (reason: string) => {
    setCanceling(true);
    dispatch(
      cancelOrder({
        orderId,
        cancellationReason: reason,
      }) as any
    )
      .then(() => {
        Alert.alert('Success', 'Order cancelled successfully');
        setShowCancelModal(false);
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to cancel the order. Please try again.');
      })
      .finally(() => {
        setCanceling(false);
      });
  };

  const handleShareReceipt = async () => {
    if (!order) return;

    const receipt = `
━━━━━━━━━━━━━━━━━━━━
ORDER RECEIPT
━━━━━━━━━━━━━━━━━━━━

Order Number: ${order.orderNumber}
Date: ${new Date(order.createdAt).toLocaleString()}
Status: ${order.status}

ITEMS:
${order.items?.map(item => `• ${item.productName} x${item.quantity}\n  ₹${parseFloat(item.totalPrice).toFixed(2)}`).join('\n')}

PAYMENT DETAILS:
Subtotal: ₹${parseFloat(order.subtotal).toFixed(2)}
Tax: ₹${parseFloat(order.taxAmount).toFixed(2)}
Delivery: ₹${parseFloat(order.deliveryCharge).toFixed(2)}
${parseFloat(order.discountAmount) > 0 ? `Discount: -₹${parseFloat(order.discountAmount).toFixed(2)}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
TOTAL: ₹${parseFloat(order.totalAmount).toFixed(2)}
━━━━━━━━━━━━━━━━━━━━

Payment Method: ${order.paymentMethod}
Payment Status: ${order.paymentStatus}

DELIVERY ADDRESS:
${order.address?.fullName}
${order.address?.addressLine1}
${order.address?.addressLine2 || ''}
${order.address?.city}, ${order.address?.state} ${order.address?.postalCode}
${order.address?.phoneNumber}

Thank you for your order!
    `.trim();

    try {
      await Share.share({
        message: receipt,
        title: `Receipt - ${order.orderNumber}`,
      });
    } catch (error) {
      // User cancelled share
    }
  };

  if (loading && !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';
  const canTrack =
    order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && order.status !== 'REFUNDED';

  return (
    <>
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Order Header */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.sectionTitle}>{order.orderNumber}</Text>
            <Text style={styles.orderDate}>
              {new Date(order.createdAt).toLocaleDateString()}{' '}
              {new Date(order.createdAt).toLocaleTimeString()}
            </Text>
          </View>
          <OrderStatusBadge status={order.status} />
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.items && order.items.length > 0 ? (
          order.items.map((item, index) => {
            const hasReview = userReviews.some(
              (review: any) => review.orderId === orderId && review.productId === item.productId
            );
            const isDelivered = order.status === 'DELIVERED';

            return (
              <View key={index}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemEmoji}>📦</Text>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                  </View>
                  <View style={styles.itemPrice}>
                    <Text style={styles.itemUnitPrice}>
                      ₹{parseFloat(item.unitPrice).toFixed(2)}
                    </Text>
                    <Text style={styles.itemTotal}>
                      ₹{parseFloat(item.totalPrice).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Review Button for Delivered Orders */}
                {isDelivered && !hasReview && (
                  <TouchableOpacity
                    style={[styles.reviewButton]}
                    onPress={() =>
                      navigation.navigate('WriteReview', {
                        orderId: order.id,
                        productId: item.productId,
                        productName: item.productName,
                        productImage: item.productImage || '',
                      })
                    }
                  >
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.reviewButtonText}>Write Review</Text>
                  </TouchableOpacity>
                )}

                {/* Show Review Added Badge for Reviewed Items */}
                {isDelivered && hasReview && (
                  <View style={[styles.reviewButton, styles.reviewButtonDone]}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={theme.colors.success}
                    />
                    <Text style={styles.reviewButtonDoneText}>Review Added</Text>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <Text style={styles.noItemsText}>No items in this order</Text>
        )}
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        {order.address ? (
          <View style={styles.addressCard}>
            <Text style={styles.addressName}>{order.address.fullName}</Text>
            <Text style={styles.addressText}>{order.address.addressLine1}</Text>
            {order.address.addressLine2 && (
              <Text style={styles.addressText}>{order.address.addressLine2}</Text>
            )}
            <Text style={styles.addressText}>
              {order.address.city}, {order.address.state} {order.address.postalCode}
            </Text>
            <Text style={styles.addressPhone}>{order.address.phoneNumber}</Text>
          </View>
        ) : (
          <Text style={styles.noItemsText}>No address information</Text>
        )}
      </View>

      {/* Payment Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Information</Text>

        <View style={styles.priceRow}>
          <Text style={styles.label}>Payment Method</Text>
          <Text style={styles.value}>{order.paymentMethod}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.label}>Payment Status</Text>
          <View
            style={{
              backgroundColor:
                order.paymentStatus === 'COMPLETED'
                  ? theme.colors.success
                  : order.paymentStatus === 'PENDING'
                    ? theme.colors.warning
                    : order.paymentStatus === 'REFUNDED'
                      ? theme.colors.error
                      : theme.colors.info,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.borderRadius.sm,
            }}
          >
            <Text style={styles.statusBadgeText}>{order.paymentStatus}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.priceRow}>
          <Text style={styles.label}>Subtotal</Text>
          <Text style={styles.value}>₹{parseFloat(order.subtotal).toFixed(2)}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.label}>Tax</Text>
          <Text style={styles.value}>₹{parseFloat(order.taxAmount).toFixed(2)}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.label}>Delivery Charge</Text>
          <Text style={styles.value}>₹{parseFloat(order.deliveryCharge).toFixed(2)}</Text>
        </View>

        {parseFloat(order.discountAmount) > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.label}>Discount</Text>
            <Text style={[styles.value, styles.discount]}>
              -₹{parseFloat(order.discountAmount).toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.priceRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{parseFloat(order.totalAmount).toFixed(2)}</Text>
        </View>
      </View>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <Text style={styles.instructionsText}>{order.specialInstructions}</Text>
        </View>
      )}

      {/* Delivery Dates */}
      <View style={styles.section}>
        {order.estimatedDeliveryDate && (
          <View style={styles.dateRow}>
            <Text style={styles.label}>Estimated Delivery</Text>
            <Text style={styles.value}>
              {new Date(order.estimatedDeliveryDate).toLocaleDateString()}
            </Text>
          </View>
        )}

        {order.status === 'DELIVERED' && order.updatedAt && (
          <View style={styles.dateRow}>
            <Text style={styles.label}>Delivered On</Text>
            <Text style={styles.value}>{new Date(order.updatedAt).toLocaleDateString()}</Text>
          </View>
        )}

        {order.status === 'CANCELLED' && order.cancellationReason && (
          <View style={styles.dateRow}>
            <Text style={styles.label}>Cancellation Reason</Text>
            <Text style={[styles.value, styles.cancellationText]}>
              {order.cancellationReason}
            </Text>
          </View>
        )}
      </View>

      {/* Order History Timeline */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.historyHeader}
          onPress={() => setShowOrderHistory(!showOrderHistory)}
        >
          <Text style={styles.sectionTitle}>Order History</Text>
          <Ionicons
            name={showOrderHistory ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>

        {showOrderHistory && (
          <View style={styles.historyTimeline}>
            <View style={styles.historyItem}>
              <View style={styles.historyDot} />
              <View style={styles.historyContent}>
                <Text style={styles.historyStatus}>Order Placed</Text>
                <Text style={styles.historyTime}>
                  {new Date(order.createdAt).toLocaleString()}
                </Text>
              </View>
            </View>

            {order.status !== 'PENDING' && (
              <View style={styles.historyItem}>
                <View style={styles.historyDot} />
                <View style={styles.historyContent}>
                  <Text style={styles.historyStatus}>Status Updated</Text>
                  <Text style={styles.historyTime}>
                    {new Date(order.updatedAt).toLocaleString()}
                  </Text>
                  <Text style={styles.historyNote}>Status: {order.status}</Text>
                </View>
              </View>
            )}

            {order.status === 'CANCELLED' && order.cancellationReason && (
              <View style={styles.historyItem}>
                <View style={[styles.historyDot, styles.historyDotError]} />
                <View style={styles.historyContent}>
                  <Text style={styles.historyStatus}>Order Cancelled</Text>
                  <Text style={styles.historyNote}>{order.cancellationReason}</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Download Receipt Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.receiptButton} onPress={handleShareReceipt}>
          <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.receiptButtonText}>Share Receipt</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {canTrack && (
          <Button
            title="Track Order"
            onPress={handleTrackOrder}
            style={styles.trackButton}
          />
        )}

        {canCancel && (
          <Button
            title={canceling ? 'Canceling...' : 'Cancel Order'}
            onPress={handleCancelOrder}
            disabled={canceling}
            style={styles.cancelButton}
          />
        )}
      </View>
    </ScrollView>

    <OrderCancellationModal
      visible={showCancelModal}
      onClose={() => setShowCancelModal(false)}
      onConfirm={handleConfirmCancellation}
    />
  </>
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
  section: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  orderDate: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
  },
  statusBadgeText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.background,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  itemEmoji: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  itemQuantity: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
  },
  itemPrice: {
    alignItems: 'flex-end',
  },
  itemUnitPrice: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  itemTotal: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.text,
  },
  noItemsText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: theme.spacing.lg,
  },
  addressCard: {
    backgroundColor: theme.colors.background,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
  },
  addressName: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  addressText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  addressPhone: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  value: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
  },
  discount: {
    color: theme.colors.success,
  },
  cancellationText: {
    color: theme.colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
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
  instructionsText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.text,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  trackButton: {
    marginBottom: theme.spacing.md,
  },
  cancelButton: {
    marginBottom: 0,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginLeft: theme.spacing.lg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: theme.spacing.sm,
  },
  reviewButtonDone: {
    borderColor: theme.colors.success,
    backgroundColor: `${theme.colors.success}10`,
  },
  reviewButtonText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.primary,
  },
  reviewButtonDoneText: {
    color: theme.colors.success,
  },
  errorText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.error,
    textAlign: 'center',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTimeline: {
    marginTop: theme.spacing.md,
    paddingLeft: theme.spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.md,
    marginTop: 4,
  },
  historyDotError: {
    backgroundColor: theme.colors.error,
  },
  historyContent: {
    flex: 1,
  },
  historyStatus: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  historyTime: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  historyNote: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: theme.spacing.sm,
  },
  receiptButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.primary,
  },
});
