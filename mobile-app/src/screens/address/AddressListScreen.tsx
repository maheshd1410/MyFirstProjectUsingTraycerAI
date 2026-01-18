import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchAddresses,
  setDefaultAddress,
  deleteAddress,
  selectAddresses,
  selectAddressLoading,
  selectAddressError,
  selectAddress,
} from '../../store/address/addressSlice';
import { Address } from '../../types';

export const AddressListScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const addresses = useAppSelector(selectAddresses);
  const loading = useAppSelector(selectAddressLoading);
  const error = useAppSelector(selectAddressError);
  const { isConnected } = useNetInfo();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchAddresses() as any);
  }, [dispatch]);

  const handleRefresh = async () => {
    if (!isConnected) {
      Alert.alert('Offline', 'You are currently offline. Pull-to-refresh requires an internet connection.');
      return;
    }
    setRefreshing(true);
    await dispatch(fetchAddresses() as any).unwrap().catch(() => {});
    setRefreshing(false);
  };

  const handleSelectAddress = (address: Address) => {
    // Dispatch to store selected address in Redux
    dispatch(selectAddress(address));

    // Check if navigation came from Checkout screen
    const currentRoute = navigation.getState()?.routes[navigation.getState()?.index - 1];
    if (currentRoute?.name === 'Checkout') {
      // Navigate back to Checkout
      navigation.navigate('Checkout');
    } else {
      // Otherwise navigate to Cart (original behavior)
      navigation.navigate('Cart');
    }
  };

  const handleEditAddress = (address: Address) => {
    navigation.navigate('AddressForm', { address, mode: 'edit' });
  };

  const handleDeleteAddress = (id: string) => {
    dispatch(deleteAddress(id) as any);
  };

  const handleSetDefault = (id: string) => {
    dispatch(setDefaultAddress(id) as any);
  };

  const renderAddressItem = ({ item }: { item: Address }) => (
    <TouchableOpacity
      style={styles.addressCard}
      onPress={() => handleSelectAddress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.addressContent}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{item.fullName}</Text>
          {item.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
        </View>
        <Text style={styles.phone}>{item.phoneNumber}</Text>
        <Text style={styles.address}>
          {item.addressLine1}
          {item.addressLine2 ? `, ${item.addressLine2}` : ''}
        </Text>
        <Text style={styles.location}>
          {item.city}, {item.state} {item.postalCode}, {item.country}
        </Text>
      </View>

      <View style={styles.actions}>
        {!item.isDefault && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetDefault(item.id)}
          >
            <Text style={styles.actionText}>Set Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditAddress(item)}
        >
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteAddress(item.id)}
        >
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading.fetch && addresses.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {addresses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No addresses added yet</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddressForm', { mode: 'create' })}
          >
            <Text style={styles.addButtonText}>+ Add Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={addresses}
            renderItem={renderAddressItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            scrollEnabled={true}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#6200ee"
              />
            }
          />
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => navigation.navigate('AddressForm', { mode: 'create' })}
          >
            <Text style={styles.floatingButtonText}>+</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressContent: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  defaultBadge: {
    backgroundColor: '#6200ee',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6200ee',
  },
  deleteButton: {
    borderColor: '#ff3b30',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6200ee',
  },
  deleteText: {
    color: '#ff3b30',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ff3b30',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6200ee',
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
