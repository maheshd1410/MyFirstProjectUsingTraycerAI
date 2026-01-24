import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ActivityIndicator, View } from 'react-native';
import { store, persistor } from './src/store';
import { RootNavigator } from './src/navigation';
import { NetworkStatusProvider } from './src/utils/network';
import { OfflineBanner } from './src/components/OfflineBanner';
import { CartProvider, AuthProvider } from './src/state';
import { theme } from './src/theme';

export default function App() {
  const navigationRef = useRef<any>();

  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        }
        persistor={persistor}
      >
        <AuthProvider>
          <CartProvider>
            <NetworkStatusProvider>
              <SafeAreaProvider>
                <StatusBar style="auto" />
                <OfflineBanner />
                <RootNavigator navigationRef={navigationRef} />
              </SafeAreaProvider>
            </NetworkStatusProvider>
          </CartProvider>
        </AuthProvider>
      </PersistGate>
    </Provider>
  );
}
