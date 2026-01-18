import React, { useEffect, useCallback, useRef } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ActivityIndicator, View, StyleSheet, Platform, AppState, Alert, Linking } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store, persistor } from './src/store';
import { RootNavigator } from './src/navigation';
import { theme } from './src/theme';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineBanner } from './src/components/OfflineBanner';
import { SyncStatusIndicator } from './src/components/SyncStatusIndicator';
import { NetworkStatusProvider, subscribeToNetworkChanges } from './src/utils/network';
import { setNetworkStatus } from './src/store/network/networkSlice';
import { syncOfflineActions } from './src/store/offline/offlineSlice';
import { handleOAuthCallback } from './src/utils/oauthCallback';
import { loadUserFromStorage } from './src/store/auth/authSlice';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('order-updates', {
      name: 'Order Updates',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF5722',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push notification permissions');
      return null;
    }
    
    // Get native device push token (FCM token for Android, APNs for iOS)
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    // Extract the FCM token from the platform-specific response
    token = deviceToken.data;
    console.log('Device Push Token retrieved:', token);
  } else {
    console.warn('Must use physical device for push notifications');
  }

  return token;
}

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);
  const navigationRef = useRef<any>();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const appStateRef = useRef(AppState.currentState);

  const handleDeepLink = useCallback(({ url }: { url: string }) => {
    // Handle OAuth callback
    if (url.includes('token=') || url.includes('error=')) {
      handleOAuthCallback(url)
        .then((result) => {
          if (result.success) {
            // Reload user from storage to refresh auth state
            store.dispatch(loadUserFromStorage() as any);
            Alert.alert('Success', 'Logged in successfully!');
          } else {
            Alert.alert('Error', result.error || 'Authentication failed');
          }
        })
        .catch((error) => {
          console.error('Deep link error:', error);
          Alert.alert('Error', 'Failed to process authentication');
        });
    }
  }, []);

  const handleNotificationNavigation = async (orderId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (token && navigationRef.current) {
        navigationRef.current.navigate('OrderTracking', { orderId });
      } else {
        await AsyncStorage.setItem(
          'pendingNotificationNavigation',
          JSON.stringify({ screen: 'OrderTracking', params: { orderId } })
        );
      }
    } catch (error) {
      console.error('Error handling notification navigation:', error);
    }
  };

  useEffect(() => {
    // Prepare app resources
    async function prepare() {
      try {
        // Register for push notifications
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log('Expo Push Token:', token);
          // Token will be sent to backend after successful login/register
        }

        // Initialize network status listener
        const unsubscribeNetwork = subscribeToNetworkChanges((networkState) => {
          store.dispatch(setNetworkStatus(networkState));
        });

        // Try to sync offline queue on app start
        const offlineState = store.getState().offline;
        if (offlineState.queue.length > 0) {
          console.log('Syncing offline queue on app start...');
          store.dispatch(syncOfflineActions());
        }

        // Add any additional resource loading here
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

    // Set up deep link listener for OAuth callbacks
    const deepLinkSubscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was launched with a deep link
    Linking.getInitialURL().then((url) => {
      if (url != null) {
        handleDeepLink({ url });
      }
    });

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Handle notification when app is foregrounded
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data;
      
      // Store pending navigation for after login
      if (data.type === 'ORDER_UPDATE' && data.orderId) {
        handleNotificationNavigation(data.orderId);
      }
    });

    // Listen for app state changes to sync queue when app comes to foreground
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground, syncing offline queue...');
        const offlineState = store.getState().offline;
        const networkState = store.getState().network;
        
        if (offlineState.queue.length > 0 && networkState.isConnected) {
          store.dispatch(syncOfflineActions());
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      deepLinkSubscription.remove();
      appStateSubscription.remove();
    };
  }, [handleDeepLink]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <NetworkStatusProvider>
          <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
            <PersistGate
              loading={
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              }
              persistor={persistor}
              onBeforeLift={onLayoutRootView}
            >
              <StatusBar style="auto" />
              <OfflineBanner />
              <RootNavigator navigationRef={navigationRef} />
              <SyncStatusIndicator />
            </PersistGate>
          </StripeProvider>
        </NetworkStatusProvider>
      </Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
