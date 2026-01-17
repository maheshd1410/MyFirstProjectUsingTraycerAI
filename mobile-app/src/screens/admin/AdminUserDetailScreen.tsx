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
import {
  fetchAdminUserById,
  selectAdminSelectedUser,
  selectAdminLoading,
} from '../../store/admin/adminSlice';
import { UserStatusToggle } from '../../components';
import { theme } from '../../theme';

interface AdminUserDetailScreenProps {
  navigation: any;
  route: any;
}

export const AdminUserDetailScreen: React.FC<AdminUserDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const userId = route.params?.userId;
  const user = useAppSelector(selectAdminSelectedUser);
  const loading = useAppSelector(selectAdminLoading);

  useEffect(() => {
    if (userId) {
      dispatch(fetchAdminUserById(userId) as any);
    }
  }, [dispatch, userId]);

  if (loading || !user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* User Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.firstName[0]}
            {user.lastName[0]}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.userRole}>
            {user.role === 'ADMIN' ? '👨‍💼 Admin' : '👤 Customer'}
          </Text>
          <Text style={[styles.userStatus, user.isActive && styles.activeText]}>
            {user.isActive ? '✓ Active' : '✕ Inactive'}
          </Text>
        </View>
      </View>

      {/* User Status Toggle */}
      <View style={styles.section}>
        <UserStatusToggle userId={user.id} isActive={user.isActive} onToggle={() => {}} />
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Joined</Text>
              <Text style={styles.infoValue}>
                {new Date(user.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Account Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user.totalOrders || 0}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{(user.averageOrderValue || 0).toFixed(0)}</Text>
            <Text style={styles.statLabel}>Avg Order Value</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{(user.totalSpent || 0).toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>
      </View>

      {/* Order History */}
      {user.orders && user.orders.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {user.orders.slice(0, 5).map((order: any, index: number) => (
            <TouchableOpacity
              key={index}
              style={styles.orderItem}
              onPress={() => navigation.navigate('AdminOrderDetail', { orderId: order.id })}
            >
              <View style={styles.orderItemContent}>
                <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
                <Text style={styles.orderDate}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.orderItemRight}>
                <Text style={styles.orderAmount}>₹{order.totalAmount.toFixed(2)}</Text>
                <Text style={styles.orderStatus}>{order.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  avatarText: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.surface,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.text,
  },
  userRole: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  userStatus: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  activeText: {
    color: theme.colors.success,
  },
  section: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  viewAllText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
  infoBox: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  infoContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textLight,
    textTransform: 'uppercase',
    fontWeight: theme.typography.fontWeights.bold as any,
  },
  infoValue: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeights.semibold as any,
    marginTop: theme.spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textLight,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  orderItemContent: {
    flex: 1,
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
  orderItemRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.primary,
  },
  orderStatus: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  actionsSection: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    gap: theme.spacing.md,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.primary,
  },
});
