import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Input } from '../../components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  createAddress,
  updateAddress,
  selectAddressLoading,
  selectAddressError,
  clearError,
} from '../../store/address/addressSlice';
import { Address, CreateAddressData, UpdateAddressData } from '../../types';

export const AddressFormScreen = ({ navigation, route }: any) => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectAddressLoading);
  const error = useAppSelector(selectAddressError);

  const { address, mode } = route.params || { mode: 'create' };

  const [formData, setFormData] = useState({
    fullName: address?.fullName || '',
    phoneNumber: address?.phoneNumber || '',
    addressLine1: address?.addressLine1 || '',
    addressLine2: address?.addressLine2 || '',
    city: address?.city || '',
    state: address?.state || '',
    postalCode: address?.postalCode || '',
    country: address?.country || 'India',
    isDefault: address?.isDefault || false,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    }
    if (!formData.addressLine1.trim()) {
      errors.addressLine1 = 'Address is required';
    }
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      errors.state = 'State is required';
    }
    if (!formData.postalCode.trim()) {
      errors.postalCode = 'Postal code is required';
    }
    if (!formData.country.trim()) {
      errors.country = 'Country is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'create') {
        const createData: CreateAddressData = {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
          isDefault: formData.isDefault,
        };
        dispatch(createAddress(createData) as any);
      } else {
        const updateData: UpdateAddressData = {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
        };
        dispatch(updateAddress({ id: address.id, data: updateData }) as any);
      }
      
      setTimeout(() => {
        if (!error) {
          navigation.goBack();
        }
      }, 500);
    } catch (err) {
      Alert.alert('Error', 'Failed to save address');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Input
          label="Full Name"
          value={formData.fullName}
          onChangeText={(text) => {
            setFormData({ ...formData, fullName: text });
            if (validationErrors.fullName) {
              setValidationErrors({ ...validationErrors, fullName: '' });
            }
          }}
          placeholder="Enter full name"
          error={validationErrors.fullName}
        />

        <Input
          label="Phone Number"
          value={formData.phoneNumber}
          onChangeText={(text) => {
            setFormData({ ...formData, phoneNumber: text });
            if (validationErrors.phoneNumber) {
              setValidationErrors({ ...validationErrors, phoneNumber: '' });
            }
          }}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          error={validationErrors.phoneNumber}
        />

        <Input
          label="Address Line 1"
          value={formData.addressLine1}
          onChangeText={(text) => {
            setFormData({ ...formData, addressLine1: text });
            if (validationErrors.addressLine1) {
              setValidationErrors({ ...validationErrors, addressLine1: '' });
            }
          }}
          placeholder="Enter address"
          error={validationErrors.addressLine1}
        />

        <Input
          label="Address Line 2 (Optional)"
          value={formData.addressLine2}
          onChangeText={(text) => setFormData({ ...formData, addressLine2: text })}
          placeholder="Enter additional address details"
        />

        <Input
          label="City"
          value={formData.city}
          onChangeText={(text) => {
            setFormData({ ...formData, city: text });
            if (validationErrors.city) {
              setValidationErrors({ ...validationErrors, city: '' });
            }
          }}
          placeholder="Enter city"
          error={validationErrors.city}
        />

        <Input
          label="State"
          value={formData.state}
          onChangeText={(text) => {
            setFormData({ ...formData, state: text });
            if (validationErrors.state) {
              setValidationErrors({ ...validationErrors, state: '' });
            }
          }}
          placeholder="Enter state"
          error={validationErrors.state}
        />

        <Input
          label="Postal Code"
          value={formData.postalCode}
          onChangeText={(text) => {
            setFormData({ ...formData, postalCode: text });
            if (validationErrors.postalCode) {
              setValidationErrors({ ...validationErrors, postalCode: '' });
            }
          }}
          placeholder="Enter postal code"
          error={validationErrors.postalCode}
        />

        <Input
          label="Country"
          value={formData.country}
          onChangeText={(text) => {
            setFormData({ ...formData, country: text });
            if (validationErrors.country) {
              setValidationErrors({ ...validationErrors, country: '' });
            }
          }}
          placeholder="Enter country"
          error={validationErrors.country}
        />

        <TouchableOpacity
          style={[styles.checkboxContainer, formData.isDefault && styles.checkboxChecked]}
          onPress={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
        >
          <Text style={styles.checkboxLabel}>Set as default address</Text>
          <Text style={styles.checkboxSymbol}>{formData.isDefault ? '✓' : ''}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === 'create' ? 'Add Address' : 'Update Address'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff3b30',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  checkboxChecked: {
    borderColor: '#6200ee',
    backgroundColor: '#f3e5f5',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  checkboxSymbol: {
    fontSize: 18,
    color: '#6200ee',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 14,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
