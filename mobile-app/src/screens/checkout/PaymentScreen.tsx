import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useStripe, CardField } from '@stripe/stripe-react-native';
import { createPaymentIntent } from '../../services/payment.service';
import { theme } from '../../theme';
import { Button } from '../../components';

interface PaymentScreenProps {
  navigation: any;
  route: any;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation, route }) => {
  const { orderId } = route.params;
  const { confirmPayment } = useStripe();

  const [loading, setLoading] = useState(false);
  const [creatingIntent, setCreatingIntent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);

  // Create payment intent on mount
  useEffect(() => {
    const initializePayment = async () => {
      try {
        setCreatingIntent(true);
        const response = await createPaymentIntent(orderId);
        setClientSecret(response.clientSecret);
        setPaymentAmount(response.amount);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to create payment intent');
      } finally {
        setCreatingIntent(false);
      }
    };

    initializePayment();
  }, [orderId]);

  const handlePayNow = async () => {
    if (!clientSecret) {
      setError('Payment intent not ready. Please try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: paymentError, paymentIntent } = await confirmPayment(clientSecret, {
        type: 'Card',
      });

      if (paymentError) {
        setError(paymentError.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'Succeeded') {
        // Payment successful, navigate to confirmation
        navigation.navigate('OrderConfirmation', { orderId });
      } else {
        setError('Payment was not completed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during payment');
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    Alert.alert(
      'Discard Payment?',
      'Are you sure you want to go back? Your payment will not be processed.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Go Back',
          onPress: () => navigation.goBack(),
          style: 'destructive',
        },
      ]
    );
  };

  // Set back button with warning
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Button
          title="Back"
          onPress={handleBackPress}
          style={styles.backButton}
        />
      ),
    });
  }, [navigation]);

  if (creatingIntent) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Preparing payment...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Payment Amount */}
      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Amount to Pay</Text>
        <Text style={styles.amountValue}>
          ₹{paymentAmount ? (paymentAmount / 100).toFixed(2) : '0.00'}
        </Text>
      </View>

      {/* Card Input */}
      <View style={styles.cardSection}>
        <Text style={styles.sectionTitle}>Card Details</Text>
        <CardField
          postalCodeEnabled={false}
          placeholder={{
            number: '4242 4242 4242 4242',
          }}
          cardStyle={{
            backgroundColor: theme.colors.surface,
            textColor: theme.colors.text,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSizes.base,
            placeholderColor: theme.colors.textLight,
          }}
          style={styles.cardField}
        />
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Pay Button */}
      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Processing Payment...' : 'Pay Now'}
          onPress={handlePayNow}
          disabled={loading || !clientSecret}
        />
      </View>

      {/* Test Card Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Test Card</Text>
        <Text style={styles.infoText}>Card: 4242 4242 4242 4242</Text>
        <Text style={styles.infoText}>Exp: Any future date</Text>
        <Text style={styles.infoText}>CVC: Any 3 digits</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  amountSection: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: `${theme.colors.background}80`,
    marginBottom: theme.spacing.sm,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.background,
  },
  cardSection: {
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
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: theme.spacing.md,
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
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    paddingHorizontal: theme.spacing.sm,
  },
  infoContainer: {
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  infoTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
});
