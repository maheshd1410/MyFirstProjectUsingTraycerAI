import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface StatusPickerModalProps {
  visible: boolean;
  currentStatus: string;
  onSelect: (status: string) => void;
  onClose: () => void;
}

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export const StatusPickerModal: React.FC<StatusPickerModalProps> = ({
  visible,
  currentStatus,
  onSelect,
  onClose,
}) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  const validNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  const handleConfirm = () => {
    if (selectedStatus === currentStatus) {
      Alert.alert('Info', 'Please select a different status');
      return;
    }
    onSelect(selectedStatus);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Update Order Status</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.currentStatus}>
            Current Status: <Text style={styles.currentStatusValue}>{STATUS_LABELS[currentStatus]}</Text>
          </Text>

          <ScrollView style={styles.statusList}>
            {validNextStatuses.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  selectedStatus === status && styles.statusOptionSelected,
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <View style={styles.statusCheckbox}>
                  {selectedStatus === status && (
                    <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                  )}
                </View>
                <Text
                  style={[
                    styles.statusLabel,
                    selectedStatus === status && styles.statusLabelSelected,
                  ]}
                >
                  {STATUS_LABELS[status]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    paddingBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.text,
  },
  currentStatus: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  currentStatusValue: {
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.primary,
  },
  statusList: {
    maxHeight: 300,
    paddingHorizontal: theme.spacing.lg,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statusOptionSelected: {
    backgroundColor: `${theme.colors.primary}10`,
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  statusCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  statusLabel: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.text,
  },
  statusLabelSelected: {
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.background,
  },
});
