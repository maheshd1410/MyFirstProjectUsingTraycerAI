import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCartItems, selectCartTotal } from '../../store/cart/cartSlice';
import { selectAddresses, selectDefaultAddress, fetchAddresses } from '../../store/address/addressSlice';
import { createOrder } from '../../store/order/orderSlice';
import { Address, PaymentMethod } from '../../types';
import { theme } from '../../theme';
import { Button } from '../../components';
import { Input } from '../../components/Input';

interface CheckoutScreenProps {
  navigation: any;
  route: any;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  const addresses = useAppSelector(selectAddresses);
  const defaultAddress = useAppSelector(selectDefaultAddress);

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(defaultAddress || null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch addresses on mount
  useEffect(() => {
    dispatch(fetchAddresses() as any);
  }, [dispatch]);

  // Initialize selected address on mount
  useEffect(() => {
    if (!selectedAddress && addresses.length > 0) {
      const addr = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddress(addr);
    }
  }, [addresses]);

  // Calculate amounts
  const subtotal = parseFloat(cartTotal);
  const taxAmount = subtotal * 0.05; // 5% tax
  const deliveryCharge = 50; // ₹50 delivery
  const totalAmount = subtotal + taxAmount + deliveryCharge;

  const handleChangeAddress = () => {
    navigation.navigate('AddressList');
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError('Please select a delivery address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderData = {
        addressId: selectedAddress.id,
        paymentMethod,
        specialInstructions: specialInstructions || undefined,
      };

      const result = await dispatch(createOrder(orderData) as any);

      if (createOrder.fulfilled.match(result)) {
        const orderId = result.payload.id;

        // Navigate based on payment method
        if (paymentMethod === 'CARD') {
          navigation.navigate('Payment', { orderId });
        } else {
          navigation.navigate('OrderConfirmation', { orderId });
        }
      } else {
        setError(result.payload || 'Failed to create order');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods: PaymentMethod[] = ['CARD', 'UPI', 'COD', 'WALLET'];

  return (
    <ScrollView style={styles.container}>
      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>

        {cartItems.map((item) => (
          <View key={item.productId} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.productName}</Text>
            <Text style={styles.itemPrice}>
              {item.quantity} x ₹{parseFloat(item.price).toFixed(2)}
            </Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Subtotal</Text>
          <Text style={styles.priceValue}>₹{subtotal.toFixed(2)}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Tax (5%)</Text>
          <Text style={styles.priceValue}>₹{taxAmount.toFixed(2)}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Delivery Charge</Text>
          <Text style={styles.priceValue}>₹{deliveryCharge.toFixed(2)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.priceRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        {selectedAddress ? (
          <View style={styles.addressCard}>
            <Text style={styles.addressName}>{selectedAddress.fullName}</Text>
            <Text style={styles.addressText}>{selectedAddress.addressLine1}</Text>
            {selectedAddress.addressLine2 && (
              <Text style={styles.addressText}>{selectedAddress.addressLine2}</Text>
            )}
            <Text style={styles.addressText}>
              {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}
            </Text>
            <Text style={styles.addressPhone}>{selectedAddress.phoneNumber}</Text>

            <Button
              title="Change Address"
              onPress={handleChangeAddress}
              style={styles.changeAddressButton}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.selectAddressButton}
            onPress={handleChangeAddress}
          >
            <Text style={styles.selectAddressText}>Select Delivery Address</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method}
            style={styles.paymentMethodRow}
            onPress={() => setPaymentMethod(method)}
          >
            <View style={styles.radioButton}>
              {paymentMethod === method && (
                <View style={styles.radioButtonFilled} />
              )}
            </View>
            <Text style={styles.paymentMethodLabel}>{method}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Special Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
        <Input
          placeholder="Add any special instructions for your order"
          value={specialInstructions}
          onChangeText={setSpecialInstructions}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Place Order Button */}
      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Processing...' : 'Place Order'}
          onPress={handlePlaceOrder}
          disabled={loading || !selectedAddress}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  itemName: {
    flex: 1,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.text,
  },
  itemPrice: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  priceLabel: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  priceValue: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  totalLabel: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary,
  },
  addressCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  addressName: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold,
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
  changeAddressButton: {
    marginTop: theme.spacing.md,
  },
  selectAddressButton: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
  },
  selectAddressText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginRight: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonFilled: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  paymentMethodLabel: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.text,
  },
  errorContainer: {
    backgroundColor: `${theme.colors.error}20`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSizes.sm,
  },
  buttonContainer: {
    marginBottom: theme.spacing.xl,
  },
});
