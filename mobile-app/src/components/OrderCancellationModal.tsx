import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { theme } from '../theme';

interface OrderCancellationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const PREDEFINED_REASONS = [
  'Changed mind',
  'Found better price',
  'Ordered by mistake',
  'Delivery taking too long',
  'Other',
];

export const OrderCancellationModal: React.FC<OrderCancellationModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState('');
  const [slideAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  const handleConfirm = () => {
    const reason = selectedReason === 'Other' ? otherReason : selectedReason;
    if (reason) {
      onConfirm(reason);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setOtherReason('');
    onClose();
  };

  const isConfirmDisabled = !selectedReason || (selectedReason === 'Other' && !otherReason.trim());

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        <Animated.View 
          style={[
            styles.modalContent,
            { transform: [{ translateY }] }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Cancel Order</Text>
            <Text style={styles.subtitle}>Please select a reason for cancellation</Text>
          </View>

          <ScrollView style={styles.reasonsContainer}>
            {PREDEFINED_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonOption,
                  selectedReason === reason && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason)}
              >
                <View style={[
                  styles.radioButton,
                  selectedReason === reason && styles.radioButtonSelected,
                ]}>
                  {selectedReason === reason && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={[
                  styles.reasonText,
                  selectedReason === reason && styles.reasonTextSelected,
                ]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}

            {selectedReason === 'Other' && (
              <TextInput
                style={styles.otherInput}
                placeholder="Please specify your reason..."
                placeholderTextColor={theme.colors.textSecondary}
                value={otherReason}
                onChangeText={setOtherReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            )}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                isConfirmDisabled && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={isConfirmDisabled}
            >
              <Text style={[
                styles.confirmButtonText,
                isConfirmDisabled && styles.confirmButtonTextDisabled,
              ]}>
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    maxHeight: '80%',
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  reasonsContainer: {
    marginBottom: theme.spacing.lg,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  reasonOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  reasonText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  reasonTextSelected: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  otherInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 80,
    marginTop: theme.spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.sm,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  confirmButton: {
    backgroundColor: theme.colors.error,
  },
  confirmButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.background,
  },
  confirmButtonTextDisabled: {
    color: theme.colors.textSecondary,
  },
});
