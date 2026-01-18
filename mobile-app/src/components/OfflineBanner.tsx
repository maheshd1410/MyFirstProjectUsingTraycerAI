import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNetworkStatus } from '../utils/network';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectQueueCount } from '../store/offline/offlineSlice';
import { syncOfflineActions } from '../store/offline/offlineSlice';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

export const OfflineBanner: React.FC = () => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const queueCount = useAppSelector(selectQueueCount);
  const dispatch = useAppDispatch();
  
  const [slideAnim] = useState(new Animated.Value(-100));
  const [showReconnecting, setShowReconnecting] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);

  const isOffline = !isConnected || isInternetReachable === false;

  useEffect(() => {
    if (isOffline) {
      // Show offline banner
      setShowBackOnline(false);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else if (slideAnim._value === 0) {
      // Show "Back Online" briefly
      setShowBackOnline(true);
      setTimeout(() => {
        // Hide banner
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowBackOnline(false);
        });
      }, 2000);
    }
  }, [isOffline]);

  const handleRetryNow = () => {
    setShowReconnecting(true);
    dispatch(syncOfflineActions()).finally(() => {
      setShowReconnecting(false);
    });
  };

  if (!isOffline && !showBackOnline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: showBackOnline ? colors.success : colors.error,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>
          {showBackOnline ? '✓' : showReconnecting ? '⟳' : '⚠'}
        </Text>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {showBackOnline
              ? 'Back Online'
              : showReconnecting
              ? 'Reconnecting...'
              : 'No Internet Connection'}
          </Text>
          
          {!showBackOnline && queueCount > 0 && (
            <Text style={styles.subtitle}>
              {queueCount} action{queueCount > 1 ? 's' : ''} queued
            </Text>
          )}
        </View>

        {!showBackOnline && !showReconnecting && queueCount > 0 && (
          <TouchableOpacity style={styles.retryButton} onPress={handleRetryNow}>
            <Text style={styles.retryButtonText}>Retry Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingTop: 16, // Extra padding for status bar
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    fontSize: 20,
    color: colors.white,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  subtitle: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
});
