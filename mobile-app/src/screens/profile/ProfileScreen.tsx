import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks';
import { theme } from '../../theme';

export const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout, isLoading } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 'edit-profile',
      icon: 'person-outline',
      label: 'Edit Profile',
      onPress: () => (navigation as any).navigate('EditProfile'),
    },
    {
      id: 'orders',
      icon: 'receipt-outline',
      label: 'My Orders',
      onPress: () => console.log('Navigate to Orders'),
    },
    {
      id: 'addresses',
      icon: 'location-outline',
      label: 'My Addresses',
      onPress: () => (navigation as any).navigate('AddressList'),
    },
    {
      id: 'notifications',
      icon: 'notifications-outline',
      label: 'Notifications',
      onPress: () => (navigation as any).navigate('Notifications'),
    },
    {
      id: 'notification-settings',
      icon: 'settings-outline',
      label: 'Notification Settings',
      onPress: () => (navigation as any).navigate('NotificationPreferences'),
    },
    ...(user?.role === 'ADMIN'
      ? [
          {
            id: 'admin-panel',
            icon: 'shield-checkmark-outline' as const,
            label: 'Admin Panel',
            onPress: () => (navigation as any).navigate('AdminDashboard'),
          },
        ]
      : []),
    {
      id: 'logout',
      icon: 'log-out-outline',
      label: 'Logout',
      onPress: handleLogout,
      danger: true,
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please login to view your profile</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={60} color={theme.colors.textLight} />
            </View>
          )}
        </View>
        <Text style={styles.name}>{`${user.firstName} ${user.lastName}`}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.phone}>{user.phoneNumber}</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name={item.icon as any}
                size={24}
                color={item.danger ? theme.colors.error : theme.colors.text}
              />
              <Text style={[styles.menuItemText, item.danger && styles.menuItemTextDanger]}>
                {item.label}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.error,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  profileImageContainer: {
    marginBottom: theme.spacing.md,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '600' as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  email: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  phone: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  menuContainer: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
    fontWeight: '500' as any,
  },
  menuItemTextDanger: {
    color: theme.colors.error,
  },
});
