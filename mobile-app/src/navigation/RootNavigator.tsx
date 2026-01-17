import React, { useEffect } from 'react';
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadUserFromStorage, selectIsAuthenticated, selectAuthLoading } from '../store/auth/authSlice';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { theme } from '../theme';

interface RootNavigatorProps {
  navigationRef?: React.MutableRefObject<any>;
}

export const RootNavigator: React.FC<RootNavigatorProps> = ({ navigationRef }) => {
  const dispatch = useAppDispatch();
  const localNavRef = useRef<any>();
  const navRef = navigationRef || localNavRef;
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);

  useEffect(() => {
    // Load user from storage on app start
    dispatch(loadUserFromStorage());

    // Check for pending notification navigation after authentication
    const checkPendingNavigation = async () => {
      try {
        const pendingNav = await AsyncStorage.getItem('pendingNotificationNavigation');
        if (pendingNav && isAuthenticated) {
          const navData = JSON.parse(pendingNav);
          
          // Clear pending navigation
          await AsyncStorage.removeItem('pendingNotificationNavigation');
          
          // Navigate after a short delay to ensure navigation is ready
          setTimeout(() => {
            if (navRef.current) {
              navRef.current.navigate(navData.screen, navData.params);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking pending navigation:', error);
      }
    };

    if (isAuthenticated) {
      checkPendingNavigation();
    }
  }, [dispatch]);

  useEffect(() => {
    // Handle pending navigation when authentication state changes
    if (isAuthenticated) {
      const checkPendingNavigation = async () => {
        try {
          const pendingNav = await AsyncStorage.getItem('pendingNotificationNavigation');
          if (pendingNav) {
            const navData = JSON.parse(pendingNav);
            
            // Clear pending navigation
            await AsyncStorage.removeItem('pendingNotificationNavigation');
            
            // Navigate after a short delay
            setTimeout(() => {
              if (navRef.current) {
                navRef.current.navigate(navData.screen, navData.params);
              }
            }, 1000);
          }
        } catch (error) {
          console.error('Error checking pending navigation:', error);
        }
      };

      checkPendingNavigation();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
        />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navRef}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
