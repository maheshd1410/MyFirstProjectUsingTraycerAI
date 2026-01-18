import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  selectOfflineQueue,
  selectIsProcessing,
  syncOfflineActions,
  clearQueue,
} from '../store/offline/offlineSlice';
import { colors } from '../theme';

export const SyncStatusIndicator: React.FC = () => {
  const queue = useAppSelector(selectOfflineQueue);
  const isProcessing = useAppSelector(selectIsProcessing);
  const dispatch = useAppDispatch();
  
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [syncedCount, setSyncedCount] = useState(0);

  useEffect(() => {
    if (isProcessing) {
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (visible) {
      // Hide after 2 seconds
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setVisible(false);
          setSyncedCount(0);
        });
      }, 2000);
    }
  }, [isProcessing]);

  const handleRetryFailed = () => {
    dispatch(syncOfflineActions());
  };

  const handleClearQueue = () => {
    dispatch(clearQueue());
    setVisible(false);
  };

  if (!visible && queue.length === 0) {
    return null;
  }

  const failedActions = queue.filter((action) => action.retryCount >= 3);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        {isProcessing ? (
          <>
            <ActivityIndicator color={colors.primary} size="small" />
            <View style={styles.textContainer}>
              <Text style={styles.title}>Syncing...</Text>
              <Text style={styles.subtitle}>
                {syncedCount} of {queue.length} actions
              </Text>
            </View>
          </>
        ) : failedActions.length > 0 ? (
          <>
            <Text style={styles.errorIcon}>✕</Text>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Sync Failed</Text>
              <Text style={styles.subtitle}>
                {failedActions.length} action{failedActions.length > 1 ? 's' : ''} failed
              </Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleRetryFailed}>
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.successIcon}>✓</Text>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Synced Successfully</Text>
              <Text style={styles.subtitle}>All actions completed</Text>
            </View>
          </>
        )}
      </View>

      {failedActions.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClearQueue}>
          <Text style={styles.clearButtonText}>Clear Failed</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  successIcon: {
    fontSize: 24,
    color: colors.success,
  },
  errorIcon: {
    fontSize: 24,
    color: colors.error,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  clearButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
  },
});
