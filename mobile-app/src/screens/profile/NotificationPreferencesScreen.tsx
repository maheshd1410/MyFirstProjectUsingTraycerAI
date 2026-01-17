import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { theme } from '../../theme';
import * as notificationService from '../../services/notification.service';
import { NotificationPreferences } from '../../services/notification.service';

export const NotificationPreferencesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    orderUpdates: true,
    promotions: true,
    reviews: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await notificationService.getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);

    try {
      setSaving(true);
      await notificationService.updateNotificationPreferences(updatedPreferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
      // Revert on error
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to update notification preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        <Text style={styles.sectionDescription}>
          Choose which notifications you'd like to receive
        </Text>
      </View>

      <View style={styles.preferenceCard}>
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceTitle}>Order Updates</Text>
            <Text style={styles.preferenceDescription}>
              Get notified about order status changes, delivery updates, and confirmations
            </Text>
          </View>
          <Switch
            value={preferences.orderUpdates}
            onValueChange={(value) => updatePreference('orderUpdates', value)}
            disabled={saving}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.preferenceCard}>
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceTitle}>Promotional Offers</Text>
            <Text style={styles.preferenceDescription}>
              Receive notifications about special offers, discounts, and new products
            </Text>
          </View>
          <Switch
            value={preferences.promotions}
            onValueChange={(value) => updatePreference('promotions', value)}
            disabled={saving}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.preferenceCard}>
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceTitle}>Review Reminders</Text>
            <Text style={styles.preferenceDescription}>
              Get reminded to leave reviews for your delivered orders
            </Text>
          </View>
          <Switch
            value={preferences.reviews}
            onValueChange={(value) => updatePreference('reviews', value)}
            disabled={saving}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          You can change these preferences anytime. Some critical notifications like order
          confirmations may still be sent.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  preferenceCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500' as '500',
    color: theme.colors.text,
    marginBottom: 6,
  },
  preferenceDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    marginTop: 24,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
