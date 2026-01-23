import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { useCart } from '../../state';
import { Button, Input } from '../../components';

type DeliveryOption = 'standard' | 'express';
type PaymentMethod = 'CARD' | 'UPI' | 'COD' | 'WALLET';

interface AddressForm {
  fullName: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
}

export const CheckoutScreen: React.FC = () => {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const { state: cartState, clearCart } = useCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [addressForm, setAddressForm] = useState<AddressForm>({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');

  const deliveryCharge = deliveryOption === 'express' ? 50 : 0;
  const totalAmount = cartState.totalAmount + deliveryCharge;

  const handleContinueFromAddress = () => {
    // Allow progression without blocking validation
    setCurrentStep(2);
  };

  const handleContinueFromDelivery = () => {
    setCurrentStep(3);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handlePlaceOrder = () => {
    Alert.alert(
      'Order Placed Successfully!',
      'This is a mock order. Your cart will be cleared and you will be redirected to Orders.',
      [
        {
          text: 'OK',
          onPress: () => {
            clearCart();
            navigation.navigate('MainTabs' as never, { screen: 'Orders' } as never);
          },
        },
      ]
    );
  };

  const renderStepIndicator = () => (
    <View style={[styles.stepIndicator, { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md }]}>
      <View style={styles.stepItem}>
        <View
          style={[
            styles.stepCircle,
            {
              backgroundColor: currentStep >= 1 ? theme.colors.primary : theme.colors.surfaceVariant,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.labelMedium,
              { color: currentStep >= 1 ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
            ]}
          >
            1
          </Text>
        </View>
        <Text
          style={[
            theme.typography.labelSmall,
            {
              color: currentStep >= 1 ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          Address
        </Text>
      </View>

      <View style={[styles.stepLine, { backgroundColor: currentStep >= 2 ? theme.colors.primary : theme.colors.outlineVariant }]} />

      <View style={styles.stepItem}>
        <View
          style={[
            styles.stepCircle,
            {
              backgroundColor: currentStep >= 2 ? theme.colors.primary : theme.colors.surfaceVariant,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.labelMedium,
              { color: currentStep >= 2 ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
            ]}
          >
            2
          </Text>
        </View>
        <Text
          style={[
            theme.typography.labelSmall,
            {
              color: currentStep >= 2 ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          Delivery
        </Text>
      </View>

      <View style={[styles.stepLine, { backgroundColor: currentStep >= 3 ? theme.colors.primary : theme.colors.outlineVariant }]} />

      <View style={styles.stepItem}>
        <View
          style={[
            styles.stepCircle,
            {
              backgroundColor: currentStep >= 3 ? theme.colors.primary : theme.colors.surfaceVariant,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.labelMedium,
              { color: currentStep >= 3 ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
            ]}
          >
            3
          </Text>
        </View>
        <Text
          style={[
            theme.typography.labelSmall,
            {
              color: currentStep >= 3 ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          Payment
        </Text>
      </View>
    </View>
  );

  const renderAddressStep = () => (
    <View style={[styles.stepContent, { paddingHorizontal: theme.spacing.md }]}>
      <Text style={[theme.typography.titleMedium, { color: theme.colors.onSurface, marginBottom: theme.spacing.md }]}>
        Delivery Address
      </Text>

      <Input
        label="Full Name"
        value={addressForm.fullName}
        onChangeText={(text) => setAddressForm({ ...addressForm, fullName: text })}
        placeholder="Enter your full name"
        style={{ marginBottom: theme.spacing.md }}
      />

      <Input
        label="Phone Number"
        value={addressForm.phone}
        onChangeText={(text) => setAddressForm({ ...addressForm, phone: text })}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
        style={{ marginBottom: theme.spacing.md }}
      />

      <Input
        label="Address"
        value={addressForm.addressLine1}
        onChangeText={(text) => setAddressForm({ ...addressForm, addressLine1: text })}
        placeholder="Street address, building name"
        style={{ marginBottom: theme.spacing.md }}
      />

      <Input
        label="City"
        value={addressForm.city}
        onChangeText={(text) => setAddressForm({ ...addressForm, city: text })}
        placeholder="City"
        style={{ marginBottom: theme.spacing.md }}
      />

      <Input
        label="State"
        value={addressForm.state}
        onChangeText={(text) => setAddressForm({ ...addressForm, state: text })}
        placeholder="State"
        style={{ marginBottom: theme.spacing.md }}
      />

      <Input
        label="Postal Code"
        value={addressForm.postalCode}
        onChangeText={(text) => setAddressForm({ ...addressForm, postalCode: text })}
        placeholder="PIN code"
        keyboardType="number-pad"
        style={{ marginBottom: theme.spacing.md }}
      />

      <Button onPress={handleContinueFromAddress} variant="filled">
        Continue
      </Button>
    </View>
  );

  const renderDeliveryStep = () => (
    <View style={[styles.stepContent, { paddingHorizontal: theme.spacing.md }]}>
      <Text style={[theme.typography.titleMedium, { color: theme.colors.onSurface, marginBottom: theme.spacing.md }]}>
        Delivery Options
      </Text>

      <Pressable
        onPress={() => setDeliveryOption('standard')}
        style={[
          styles.radioOption,
          {
            backgroundColor: theme.colors.surface,
            borderColor: deliveryOption === 'standard' ? theme.colors.primary : theme.colors.outlineVariant,
            borderWidth: 2,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
          },
        ]}
      >
        <View style={styles.radioContent}>
          <View
            style={[
              styles.radioCircle,
              {
                borderColor: deliveryOption === 'standard' ? theme.colors.primary : theme.colors.outlineVariant,
              },
            ]}
          >
            {deliveryOption === 'standard' && (
              <View style={[styles.radioCircleInner, { backgroundColor: theme.colors.primary }]} />
            )}
          </View>
          <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
            <Text style={[theme.typography.bodyLarge, { color: theme.colors.onSurface, fontWeight: '600' }]}>
              Standard Delivery
            </Text>
            <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
              3-5 business days • Free
            </Text>
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={() => setDeliveryOption('express')}
        style={[
          styles.radioOption,
          {
            backgroundColor: theme.colors.surface,
            borderColor: deliveryOption === 'express' ? theme.colors.primary : theme.colors.outlineVariant,
            borderWidth: 2,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.lg,
          },
        ]}
      >
        <View style={styles.radioContent}>
          <View
            style={[
              styles.radioCircle,
              {
                borderColor: deliveryOption === 'express' ? theme.colors.primary : theme.colors.outlineVariant,
              },
            ]}
          >
            {deliveryOption === 'express' && (
              <View style={[styles.radioCircleInner, { backgroundColor: theme.colors.primary }]} />
            )}
          </View>
          <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
            <Text style={[theme.typography.bodyLarge, { color: theme.colors.onSurface, fontWeight: '600' }]}>
              Express Delivery
            </Text>
            <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
              1-2 business days • ₹50
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <Button onPress={handleBack} variant="outlined" style={{ flex: 1 }}>
          Back
        </Button>
        <Button onPress={handleContinueFromDelivery} variant="filled" style={{ flex: 1 }}>
          Continue
        </Button>
      </View>
    </View>
  );

  const renderPaymentStep = () => {
    const paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
      { value: 'CARD', label: 'Credit/Debit Card', icon: 'card-outline' },
      { value: 'UPI', label: 'UPI', icon: 'qr-code-outline' },
      { value: 'COD', label: 'Cash on Delivery', icon: 'cash-outline' },
      { value: 'WALLET', label: 'Digital Wallet', icon: 'wallet-outline' },
    ];

    return (
      <View style={[styles.stepContent, { paddingHorizontal: theme.spacing.md }]}>
        <Text style={[theme.typography.titleMedium, { color: theme.colors.onSurface, marginBottom: theme.spacing.md }]}>
          Payment Method
        </Text>

        {paymentMethods.map((method) => (
          <Pressable
            key={method.value}
            onPress={() => setPaymentMethod(method.value)}
            style={[
              styles.radioOption,
              {
                backgroundColor: theme.colors.surface,
                borderColor: paymentMethod === method.value ? theme.colors.primary : theme.colors.outlineVariant,
                borderWidth: 2,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            <View style={styles.radioContent}>
              <View
                style={[
                  styles.radioCircle,
                  {
                    borderColor: paymentMethod === method.value ? theme.colors.primary : theme.colors.outlineVariant,
                  },
                ]}
              >
                {paymentMethod === method.value && (
                  <View style={[styles.radioCircleInner, { backgroundColor: theme.colors.primary }]} />
                )}
              </View>
              <Ionicons
                name={method.icon as any}
                size={24}
                color={theme.colors.onSurface}
                style={{ marginLeft: theme.spacing.md }}
              />
              <Text style={[theme.typography.bodyLarge, { color: theme.colors.onSurface, marginLeft: theme.spacing.md }]}>
                {method.label}
              </Text>
            </View>
          </Pressable>
        ))}

        <View
          style={[
            styles.orderSummary,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.md,
              marginTop: theme.spacing.md,
              marginBottom: theme.spacing.lg,
              ...theme.elevation[1],
            },
          ]}
        >
          <Text style={[theme.typography.titleMedium, { color: theme.colors.onSurface, marginBottom: theme.spacing.md }]}>
            Order Summary
          </Text>

          {cartState.items.map((item) => (
            <View key={item.id} style={[styles.summaryRow, { marginBottom: theme.spacing.sm }]}>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurfaceVariant, flex: 1 }]} numberOfLines={1}>
                {item.productName} × {item.quantity}
              </Text>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurface }]}>
                ₹{((item.discountPrice ? parseFloat(item.discountPrice) : parseFloat(item.price)) * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant, marginVertical: theme.spacing.md }]} />

          <View style={[styles.summaryRow, { marginBottom: theme.spacing.sm }]}>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurfaceVariant }]}>Subtotal</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurface }]}>
              ₹{cartState.totalAmount.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.summaryRow, { marginBottom: theme.spacing.sm }]}>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurfaceVariant }]}>Delivery Charge</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurface }]}>
              {deliveryCharge === 0 ? 'Free' : `₹${deliveryCharge.toFixed(2)}`}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant, marginVertical: theme.spacing.md }]} />

          <View style={styles.summaryRow}>
            <Text style={[theme.typography.titleMedium, { color: theme.colors.onSurface }]}>Total Amount</Text>
            <Text style={[theme.typography.titleLarge, { color: theme.colors.primary, fontWeight: '600' }]}>
              ₹{totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <Button onPress={handleBack} variant="outlined" style={{ flex: 1 }}>
            Back
          </Button>
          <Button onPress={handlePlaceOrder} variant="filled" style={{ flex: 1 }}>
            Place Order
          </Button>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <View style={[styles.header, { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text style={[theme.typography.titleLarge, { color: theme.colors.onSurface, flex: 1, marginLeft: theme.spacing.md }]}>
          Checkout
        </Text>
      </View>

      {renderStepIndicator()}

      <ScrollView
        contentContainerStyle={{ paddingVertical: theme.spacing.md, paddingBottom: theme.spacing.xl }}
      >
        {currentStep === 1 && renderAddressStep()}
        {currentStep === 2 && renderDeliveryStep()}
        {currentStep === 3 && renderPaymentStep()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 60,
    height: 2,
    marginHorizontal: 8,
  },
  stepContent: {
    flex: 1,
  },
  radioOption: {},
  radioContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  orderSummary: {},
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
  },
});
