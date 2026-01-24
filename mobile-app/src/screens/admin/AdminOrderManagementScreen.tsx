import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchAdminOrders,
  selectAdminOrders,
  selectAdminLoading,
} from '../../store/admin/adminSlice';
import { theme } from '../../theme';

interface AdminOrderManagementScreenProps {
  navigation: any;
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: '#FFA500',
  CONFIRMED: '#87CEEB',
  PROCESSING: '#FFD700',
  OUT_FOR_DELIVERY: '#87CEEB',
  DELIVERED: '#90EE90',
  CANCELLED: '#FF6B6B',
};

export const AdminOrderManagementScreen: React.FC<AdminOrderManagementScreenProps> = ({
  navigation,
}) => {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectAdminOrders);
  const loading = useAppSelector(selectAdminLoading);
  const { isConnected } = useNetInfo();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminOrders({ page: 1, pageSize: 20 }) as any);
  }, [dispatch]);

  const handleRefresh = async () => {
    if (!isConnected) {
      Alert.alert('Offline', 'You are currently offline. Pull-to-refresh requires an internet connection.');
      return;
    }
    setRefreshing(true);
    await dispatch(fetchAdminOrders({ page: 1, pageSize: 20 }) as any).unwrap().catch(() => {});
    setRefreshing(false);
  };

  useEffect(() => {
    if (selectedStatus) {
      setFilteredOrders(orders.filter((order) => order.status === selectedStatus));
    } else {
      setFilteredOrders(orders);
    }
  }, [selectedStatus, orders]);

  const statuses = ['PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

  const renderOrderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('AdminOrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>Order #{item.orderNumber}</Text>
          <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: ORDER_STATUS_COLORS[item.status] || theme.colors.textLight },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Customer:</Text>
          <Text style={styles.detailValue}>
            {item.user?.firstName} {item.user?.lastName}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={styles.detailValue}>₹{item.totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Items:</Text>
          <Text style={styles.detailValue}>{item.items?.length || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              !selectedStatus && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedStatus(null)}
          >
            <Text
              style={[
                styles.filterButtonText,
                !selectedStatus && styles.filterButtonTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {statuses.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                selectedStatus === status && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedStatus === status && styles.filterButtonTextActive,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      {loading.fetch && !filteredOrders.length ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="document-outline" size={48} color={theme.colors.textLight} />
              <Text style={styles.emptyText}>
                {selectedStatus ? 'No orders with this status' : 'No orders found'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  filterContainer: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
  },
  filterButtonTextActive: {
    color: theme.colors.surface,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  orderNumber: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.text,
  },
  orderDate: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.surface,
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
  detailValue: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
    marginTop: theme.spacing.md,
  },
});
