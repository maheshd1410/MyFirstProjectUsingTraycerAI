import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectOrderById, updateOrderStatus } from '../../store/order/orderSlice';
import { StatusPickerModal } from '../../components';
import { theme } from '../../theme';

interface AdminOrderDetailScreenProps {
  navigation: any;
  route: any;
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: '#FFA500',
  CONFIRMED: '#87CEEB',
  PROCESSING: '#FFD700',
  OUT_FOR_DELIVERY: '#87CEEB',
  DELIVERED: '#90EE90',
  CANCELLED: '#FF6B6B',
};

export const AdminOrderDetailScreen: React.FC<AdminOrderDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const orderId = route.params?.orderId;
  const order = useAppSelector((state) => selectOrderById(state, orderId));
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!order) {
      navigation.goBack();
    }
  }, [order, navigation]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setLoading(true);
      await dispatch(
        updateOrderStatus({
          orderId,
          status: newStatus,
        }) as any
      );
      setStatusModalVisible(false);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Order Header */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Order #{order.orderNumber}</Text>
            <Text style={styles.subtitle}>
              {new Date(order.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: ORDER_STATUS_COLORS[order.status] || theme.colors.textLight },
            ]}
          >
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => setStatusModalVisible(true)}
          disabled={loading}
        >
          <Ionicons name="swap-vertical-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.statusButtonText}>Update Status</Text>
        </TouchableOpacity>
      </View>

      {/* Customer Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>
              {order.user?.firstName} {order.user?.lastName}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{order.user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{order.user?.phone || 'Not provided'}</Text>
          </View>
        </View>
      </View>

      {/* Shipping Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <View style={styles.infoBox}>
          <Text style={styles.addressText}>
            {order.shippingAddress?.street}
            {'\n'}
            {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
            {order.shippingAddress?.zipCode}
            {'\n'}
            {order.shippingAddress?.country}
          </Text>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.items?.map((item: any, index: number) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product?.name}</Text>
              <Text style={styles.itemDetails}>
                Qty: {item.quantity} × ₹{item.price.toFixed(2)}
              </Text>
            </View>
            <Text style={styles.itemPrice}>₹{(item.quantity * item.price).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.infoBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>
              ₹{((order.totalAmount || 0) - (order.tax || 0) - (order.shippingCost || 0)).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax:</Text>
            <Text style={styles.summaryValue}>₹{(order.tax || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping:</Text>
            <Text style={styles.summaryValue}>₹{(order.shippingCost || 0).toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>₹{(order.totalAmount || 0).toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Payment Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Information</Text>
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Method:</Text>
            <Text style={styles.infoValue}>{order.paymentMethod || 'Not specified'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.infoValue, styles.paidText]}>
              {order.paymentStatus || 'PENDING'}
            </Text>
          </View>
        </View>
      </View>

      {/* Status Modal */}
      <StatusPickerModal
        visible={statusModalVisible}
        currentStatus={order.status}
        onSelect={handleStatusChange}
        onClose={() => setStatusModalVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.surface,
  },
  statusButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  statusButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  infoBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
  infoValue: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
  addressText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  itemDetails: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
  },
  itemPrice: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.primary,
    marginLeft: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
  },
  summaryValue: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTopWidth: theme.spacing.md,
    marginBottomWidth: 0,
  },
  totalLabel: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.primary,
  },
  paidText: {
    color: theme.colors.success,
  },
});
