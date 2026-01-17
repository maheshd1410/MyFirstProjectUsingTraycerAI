import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'small' | 'medium' | 'large';
}

const STATUS_CONFIG: Record<OrderStatus, { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  PENDING: {
    color: theme.colors.warning,
    icon: 'time-outline',
    label: 'Pending',
  },
  CONFIRMED: {
    color: theme.colors.info,
    icon: 'checkmark-circle-outline',
    label: 'Confirmed',
  },
  PREPARING: {
    color: theme.colors.info,
    icon: 'restaurant-outline',
    label: 'Preparing',
  },
  OUT_FOR_DELIVERY: {
    color: theme.colors.secondary,
    icon: 'car-outline',
    label: 'Out for Delivery',
  },
  DELIVERED: {
    color: theme.colors.success,
    icon: 'checkmark-done-circle-outline',
    label: 'Delivered',
  },
  CANCELLED: {
    color: theme.colors.error,
    icon: 'close-circle-outline',
    label: 'Cancelled',
  },
  REFUNDED: {
    color: theme.colors.error,
    icon: 'return-down-back-outline',
    label: 'Refunded',
  },
};

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, size = 'medium' }) => {
  const config = STATUS_CONFIG[status];
  
  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      text: styles.textSmall,
      iconSize: 12,
    },
    medium: {
      container: styles.containerMedium,
      text: styles.textMedium,
      iconSize: 16,
    },
    large: {
      container: styles.containerLarge,
      text: styles.textLarge,
      iconSize: 20,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, currentSize.container, { backgroundColor: `${config.color}20` }]}>
      <Ionicons name={config.icon} size={currentSize.iconSize} color={config.color} />
      <Text style={[styles.text, currentSize.text, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  containerMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  containerLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  text: {
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 12,
  },
  textMedium: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 16,
  },
});
