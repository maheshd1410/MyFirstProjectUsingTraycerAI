import React, { useEffect, useCallback, useRef } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store, persistor } from './src/store';
import { RootNavigator } from './src/navigation';
import { theme } from './src/theme';

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

        // Add any additional resource loading here
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

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

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

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
    <Provider store={store}>
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
          <RootNavigator navigationRef={navigationRef} />
        </PersistGate>
      </StripeProvider>
    </Provider>
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
