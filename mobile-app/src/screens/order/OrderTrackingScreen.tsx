import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Linking,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToCart } from '../../store/cart/cartSlice';
import { cancelOrder, fetchOrderById, selectOrderLoading, selectSelectedOrder } from '../../store/order/orderSlice';
import { Button, OrderCancellationModal } from '../../components';
import { Order } from '../../types';
import { theme } from '../../theme';

interface OrderTrackingScreenProps {
  navigation: any;
  route: any;
}

const TIMELINE_STATUSES = [
  { status: 'PENDING', label: 'Order Placed', description: 'Your order has been placed' },
  {
    status: 'CONFIRMED',
    label: 'Order Confirmed',
    description: 'Your order has been confirmed',
  },
  {
    status: 'PREPARING',
    label: 'Preparing Your Order',
    description: 'We are preparing your order',
  },
  {
    status: 'OUT_FOR_DELIVERY',
    label: 'Out for Delivery',
    description: 'Your order is on the way',
  },
  { status: 'DELIVERED', label: 'Delivered', description: 'Order delivered successfully' },
];

export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({ navigation, route }) => {
  const { orderId } = route.params;
  const dispatch = useAppDispatch();
  const order = useAppSelector(selectSelectedOrder);
  const loading = useAppSelector(selectOrderLoading);

  const [refreshing, setRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [countdown, setCountdown] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  const getProgressPercentage = (status: string) => {
    const statusMap: Record<string, number> = {
      PENDING: 0.2,
      CONFIRMED: 0.4,
      PREPARING: 0.6,
      OUT_FOR_DELIVERY: 0.8,
      DELIVERED: 1.0,
    };
    return statusMap[status] || 0;
  };

  const getRelativeTime = (date: string) => {
    const now = Date.now();
    const past = new Date(date).getTime();
    const diff = now - past;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  const getStatusIndex = (o: Order) => {
    const statusOrder = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    return statusOrder.indexOf(o.status);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    dispatch(fetchOrderById(orderId) as any).finally(() => {
      setRefreshing(false);
    });
  };

  const handleShare = async () => {
    if (!order) return;

    const message = `Order ${order.orderNumber}\nStatus: ${order.status}\n${
      countdown || (order.estimatedDeliveryDate
        ? `Estimated Delivery: ${new Date(order.estimatedDeliveryDate).toLocaleDateString()}`
        : '')
    }`;

    try {
      await Share.share({
        message,
        title: 'Order Tracking',
      });
    } catch {
      // user cancelled share
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact us?',
      [
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@yourapp.com?subject=Order%20' + order?.orderNumber),
        },
        {
          text: 'Phone',
          onPress: () => Linking.openURL('tel:+1234567890'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleReorder = () => {
    if (!order?.items) return;

    order.items.forEach(item => {
      dispatch(addToCart({ productId: item.productId, quantity: item.quantity }) as any);
    });

    Alert.alert('Success', 'Items added to cart', [
      { text: 'OK' },
      { text: 'Go to Cart', onPress: () => navigation.navigate('Cart') },
    ]);
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
      })
      .finally(() => {
        setCanceling(false);
        setShowCancelModal(false);
      });
  };

  const handleViewOrderDetails = () => {
    navigation.navigate('OrderDetail', { orderId });
  };

  useEffect(() => {
    dispatch(fetchOrderById(orderId) as any);

    pollingInterval.current = setInterval(() => {
      if (appState.current === 'active') {
        dispatch(fetchOrderById(orderId) as any);
      }
    }, 30000);

    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
    });

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
      subscription.remove();
    };
  }, [orderId, dispatch]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (!order) return;
    Animated.timing(progressAnim, {
      toValue: getProgressPercentage(order.status),
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [order, progressAnim]);

  useEffect(() => {
    if (!order?.estimatedDeliveryDate) {
      setCountdown('');
      return;
    }

    const target = new Date(order.estimatedDeliveryDate).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown('Arriving soon');
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${hours}h ${minutes}m remaining`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [order?.estimatedDeliveryDate]);

  if (loading && !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📦❓</Text>
        <Text style={styles.emptyTitle}>Order Not Found</Text>
        <Text style={styles.emptySubtitle}>
          The order you're looking for doesn't exist or has been removed.
        </Text>
        <Button
          title="Go to Orders"
          onPress={() => navigation.navigate('OrderList')}
          style={styles.emptyButton}
        />
      </View>
    );
  }

  const currentStatusIndex = getStatusIndex(order);
  const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED';
  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';
  const isDelivered = order.status === 'DELIVERED';
  const progress = getProgressPercentage(order.status);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

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
        {!isCancelled && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress * 100)}% Complete</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live Tracking</Text>
            </View>
          </View>
        )}

        <View style={styles.headerSection}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.statusText}>
            Status: <Text style={styles.statusValue}>{order.status}</Text>
          </Text>
          {countdown && !isCancelled && (
            <View style={styles.countdownContainer}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}
        </View>

        {isCancelled ? (
          <View style={styles.cancelledSection}>
            <Text style={styles.cancelledIcon}>✕</Text>
            <Text style={styles.cancelledTitle}>Order Cancelled</Text>
            {order.cancellationReason && (
              <Text style={styles.cancelledReason}>{order.cancellationReason}</Text>
            )}
          </View>
        ) : (
          <View style={styles.timelineSection}>
            {TIMELINE_STATUSES.map((item, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;

              return (
                <View key={item.status} style={styles.timelineItem}>
                  <View style={styles.nodeContainer}>
                    <Animated.View
                      style={[
                        styles.node,
                        isCompleted && styles.nodeCompleted,
                        isCurrent && styles.nodeCurrent,
                        isCurrent && { transform: [{ scale: pulseAnim }] },
                      ]}
                    >
                      {isCompleted && <Text style={styles.nodeIcon}>✓</Text>}
                      {isCurrent && !isCompleted && <View style={styles.nodeDot} />}
                    </Animated.View>

                    {index < TIMELINE_STATUSES.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          isCompleted && styles.timelineLineCompleted,
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.contentContainer}>
                    <Text style={[styles.timelineLabel, isCurrent && styles.timelineLabelCurrent]}>
                      {item.label}
                    </Text>
                    <Text style={styles.timelineDescription}>{item.description}</Text>
                    {isCompleted && (
                      <Text style={styles.timestamp}>
                        {getRelativeTime(index === 0 ? order.createdAt : order.updatedAt)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {!isCancelled && (
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={handleContactSupport}>
                <Ionicons name="headset-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.actionButtonText}>Contact Support</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>

              {isDelivered && (
                <TouchableOpacity style={styles.actionButton} onPress={handleReorder}>
                  <Ionicons name="repeat-outline" size={24} color={theme.colors.primary} />
                  <Text style={styles.actionButtonText}>Reorder</Text>
                </TouchableOpacity>
              )}

              {canCancel && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonDanger]}
                  onPress={handleCancelOrder}
                  disabled={canceling}
                >
                  <Ionicons name="close-circle-outline" size={24} color={theme.colors.error} />
                  <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                    {canceling ? 'Canceling...' : 'Cancel Order'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {!isCancelled && order.estimatedDeliveryDate && (
          <View style={styles.deliveryDateSection}>
            <Text style={styles.deliveryLabel}>Estimated Delivery</Text>
            <Text style={styles.deliveryDate}>
              {new Date(order.estimatedDeliveryDate).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View style={styles.addressSection}>
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
            <Text style={styles.noAddressText}>No address information</Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Button title="View Order Details" onPress={handleViewOrderDetails} />
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
  headerSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  orderNumber: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as TextStyle['fontWeight'],
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  statusValue: {
    fontWeight: theme.typography.fontWeights.semibold as TextStyle['fontWeight'],
    color: theme.colors.primary,
  },
  timelineSection: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  nodeContainer: {
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  node: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeCompleted: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success,
  },
  nodeCurrent: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
    backgroundColor: theme.colors.background,
  },
  nodeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  nodeIcon: {
    color: theme.colors.background,
    fontSize: 20,
    fontWeight: theme.typography.fontWeights.bold as TextStyle['fontWeight'],
  },
  timelineLine: {
    width: 2,
    height: 60,
    backgroundColor: theme.colors.border,
    marginTop: theme.spacing.sm,
  },
  timelineLineCompleted: {
    backgroundColor: theme.colors.success,
  },
  contentContainer: {
    flex: 1,
    paddingTop: theme.spacing.sm,
  },
  timelineLabel: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as TextStyle['fontWeight'],
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  timelineLabelCurrent: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.bold as TextStyle['fontWeight'],
  },
  timelineDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  timestamp: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
  deliveryDateSection: {
    backgroundColor: `${theme.colors.primary}15`,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    alignItems: 'center',
  },
  deliveryLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  deliveryDate: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as TextStyle['fontWeight'],
    color: theme.colors.primary,
  },
  cancelledSection: {
    backgroundColor: `${theme.colors.error}15`,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  cancelledIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  cancelledTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as TextStyle['fontWeight'],
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  cancelledReason: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  addressSection: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as TextStyle['fontWeight'],
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
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
    fontWeight: theme.typography.fontWeights.semibold as TextStyle['fontWeight'],
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
  noAddressText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: theme.spacing.lg,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.error,
    textAlign: 'center',
  },
  progressContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold as TextStyle['fontWeight'],
    color: theme.colors.text,
    textAlign: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  liveText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeights.semibold as TextStyle['fontWeight'],
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    gap: 8,
  },
  countdownText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as TextStyle['fontWeight'],
    color: theme.colors.primary,
  },
  actionsSection: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
    gap: theme.spacing.sm,
  },
  actionButtonDanger: {
    borderColor: theme.colors.error,
    backgroundColor: `${theme.colors.error}10`,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold as TextStyle['fontWeight'],
    color: theme.colors.primary,
    textAlign: 'center',
  },
  actionButtonTextDanger: {
    color: theme.colors.error,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as TextStyle['fontWeight'],
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyButton: {
    minWidth: 200,
  },
});
