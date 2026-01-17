import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  TextStyle,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchOrders,
  selectOrders,
  selectOrderLoading,
  selectOrderError,
  selectOrderPagination,
  clearError,
} from '../../store/order/orderSlice';
import { Order, OrderStatus } from '../../types';
import { theme } from '../../theme';
import { Button, OrderStatusBadge, OrderCardSkeleton } from '../../components';

interface OrderListScreenProps {
  navigation: any;
  route: any;
}

const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export const OrderListScreen: React.FC<OrderListScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectOrders);
  const loading = useAppSelector(selectOrderLoading);
  const error = useAppSelector(selectOrderError);
  const pagination = useAppSelector(selectOrderPagination);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'All'>('All');

  useEffect(() => {
    dispatch(fetchOrders() as any);
  }, [dispatch]);

  const handleRefresh = () => {
    setRefreshing(true);
    dispatch(fetchOrders()).then(() => {
      setRefreshing(false);
    });
  };

  const handleLoadMore = () => {
    if (!loading && pagination && pagination.currentPage < pagination.totalPages) {
      const nextPage = pagination.currentPage + 1;
      dispatch(
        fetchOrders({
          page: nextPage,
          pageSize: pagination.pageSize,
          status: selectedStatus !== 'All' ? selectedStatus : undefined,
        }) as any
      );
    }
  };

  const handleStatusFilter = (status: OrderStatus | 'All') => {
    setSelectedStatus(status);
    dispatch(
      fetchOrders({
        page: 1,
        status: status !== 'All' ? status : undefined,
      }) as any
    );
  };

  const handleOrderPress = (order: Order) => {
    navigation.navigate('OrderDetail', { orderId: order.id });
  };

  const handleRetry = () => {
    dispatch(clearError());
    dispatch(fetchOrders() as any);
  };

  const renderSkeletons = () => (
    <>
      {[...Array(3)].map((_, index) => (
        <OrderCardSkeleton key={`skeleton-${index}`} />
      ))}
    </>
  );


  const renderOrderCard = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleOrderPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <OrderStatusBadge status={item.status} size="small" />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>₹{parseFloat(item.totalAmount).toFixed(2)}</Text>
        </View>

        <Text style={styles.itemCount}>
          {item.items?.length || 0} {item.items?.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetails}>View Details →</Text>
      </View>
    </TouchableOpacity>
  );

  const renderStatusFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
    >
      {['All', ...ORDER_STATUSES].map((status) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.filterChip,
            selectedStatus === status && styles.filterChipActive,
          ]}
          onPress={() => handleStatusFilter(status as OrderStatus | 'All')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedStatus === status && styles.filterChipTextActive,
            ]}
          >
            {status}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            onPress={handleRetry}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderStatusFilter()}

      {loading && orders.length === 0 ? (
        <View style={styles.skeletonContainer}>
          {renderSkeletons()}
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No orders yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Start shopping to place your first order
          </Text>
          <Button
            title="Browse Products"
            onPress={() => navigation.navigate('ProductList')}
            style={styles.browseButton}
          />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListFooterComponent={
            loading && orders.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeights.medium as TextStyle['fontWeight'],
  },
  filterChipTextActive: {
    color: theme.colors.background,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  orderNumber: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as TextStyle['fontWeight'],
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  orderDate: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
  },
  statusBadgeText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold as TextStyle['fontWeight'],
    color: theme.colors.background,
  },
  cardBody: {
    marginBottom: theme.spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  amountLabel: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  amountValue: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as TextStyle['fontWeight'],
    color: theme.colors.primary,
  },
  itemCount: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
  },
  cardFooter: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  viewDetails: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.semibold as TextStyle['fontWeight'],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold as TextStyle['fontWeight'],
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyStateSubtitle: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  browseButton: {
    minWidth: 200,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.error,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 120,
  },
  skeletonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  footerLoader: {
    paddingVertical: theme.spacing.lg,
  },
});
