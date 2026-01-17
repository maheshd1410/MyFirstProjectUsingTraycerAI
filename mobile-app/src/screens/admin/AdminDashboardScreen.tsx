import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAnalytics, selectAnalytics, selectAdminLoading } from '../../store/admin/adminSlice';
import { AnalyticsCard } from '../../components';
import { theme } from '../../theme';

interface AdminDashboardScreenProps {
  navigation: any;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const analytics = useAppSelector(selectAnalytics);
  const loading = useAppSelector(selectAdminLoading);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchAnalytics() as any);
  }, [dispatch]);

  const handleRefresh = () => {
    setRefreshing(true);
    dispatch(fetchAnalytics() as any).finally(() => {
      setRefreshing(false);
    });
  };

  if (loading && !analytics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const chartData = analytics?.revenueByDate || [];
  const chartLabels = chartData.slice(0, 6).map((item) => item.date.slice(0, 5));
  const chartDatasets = [chartData.slice(0, 6).map((item) => item.revenue)];

  const orderStatusData = analytics?.ordersByStatus || {};
  const pieChartData = [
    {
      name: 'Pending',
      population: orderStatusData.PENDING || 0,
      color: '#FFA500',
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Confirmed',
      population: orderStatusData.CONFIRMED || 0,
      color: '#87CEEB',
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Out for Delivery',
      population: orderStatusData.OUT_FOR_DELIVERY || 0,
      color: '#FFD700',
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Delivered',
      population: orderStatusData.DELIVERED || 0,
      color: '#90EE90',
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
  ];

  return (
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
      {/* Key Metrics */}
      <View style={styles.metricsSection}>
        <AnalyticsCard
          title="Total Revenue"
          value={`₹${(analytics?.totalRevenue || 0).toFixed(2)}`}
          icon="cash-outline"
          color={theme.colors.primary}
          subtitle="From completed orders"
        />
        <AnalyticsCard
          title="Total Orders"
          value={analytics?.totalOrders || 0}
          icon="layers-outline"
          color="#FFA500"
        />
        <AnalyticsCard
          title="Total Users"
          value={analytics?.totalUsers || 0}
          icon="people-outline"
          color="#FF6B6B"
        />
        <AnalyticsCard
          title="Active Users"
          value={analytics?.activeUsers || 0}
          icon="checkmark-circle-outline"
          color={theme.colors.success}
        />
      </View>

      {/* Revenue Trend Chart */}
      {chartDatasets[0] && chartDatasets[0].length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Revenue Trend (Last 7 Days)</Text>
          <LineChart
            data={{
              labels: chartLabels,
              datasets: [{ data: chartDatasets[0] }],
            }}
            width={Dimensions.get('window').width - 32}
            height={220}
            chartConfig={{
              backgroundColor: theme.colors.background,
              backgroundGradientFrom: theme.colors.surface,
              backgroundGradientTo: theme.colors.surface,
              decimalPlaces: 0,
              color: () => theme.colors.primary,
              labelColor: () => theme.colors.textLight,
              style: { borderRadius: 16 },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: theme.colors.primary,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Order Status Distribution */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Order Status Distribution</Text>
        <PieChart
          data={pieChartData}
          width={Dimensions.get('window').width - 32}
          height={220}
          chartConfig={{
            color: () => theme.colors.primary,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AdminProductManagement')}
        >
          <Ionicons name="cube-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Product Management</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AdminOrderManagement')}
        >
          <Ionicons name="receipt-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Order Management</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AdminUserManagement')}
        >
          <Ionicons name="people-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>User Management</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

import { Dimensions } from 'react-native';

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
  metricsSection: {
    marginBottom: theme.spacing.xl,
  },
  chartSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  chartTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  chart: {
    borderRadius: 16,
    marginVertical: theme.spacing.md,
  },
  actionsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  actionButtonText: {
    flex: 1,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
  },
});
