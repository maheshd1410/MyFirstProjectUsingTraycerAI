import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  selectOfflineQueue,
  selectLastSyncTime,
  clearQueue,
  removeFromQueue,
  syncOfflineActions,
} from '../../store/offline/offlineSlice';
import { colors } from '../../theme';

export const OfflineQueueScreen: React.FC = () => {
  const queue = useAppSelector(selectOfflineQueue);
  const lastSyncTime = useAppSelector(selectLastSyncTime);
  const dispatch = useAppDispatch();

  const handleClearQueue = () => {
    Alert.alert(
      'Clear Queue',
      'Are you sure you want to clear all queued actions? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => dispatch(clearQueue()),
        },
      ]
    );
  };

  const handleRemoveItem = (id: string) => {
    Alert.alert(
      'Remove Action',
      'Are you sure you want to remove this action from the queue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => dispatch(removeFromQueue(id)),
        },
      ]
    );
  };

  const handleRetryAll = () => {
    dispatch(syncOfflineActions());
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatActionType = (type: string) => {
    // Convert action type to readable format
    return type
      .split('/')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Offline Queue</Text>
        <Text style={styles.subtitle}>
          {queue.length} action{queue.length !== 1 ? 's' : ''} queued
        </Text>
        {lastSyncTime && (
          <Text style={styles.lastSync}>
            Last sync: {formatTimestamp(lastSyncTime)}
          </Text>
        )}
      </View>

      {queue.length > 0 ? (
        <>
          <FlatList
            data={queue}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.queueItem}>
                <View style={styles.itemHeader}>
                  <Text style={styles.actionType}>
                    {formatActionType(item.type)}
                  </Text>
                  {item.priority && (
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(item.priority) },
                      ]}
                    >
                      <Text style={styles.priorityText}>
                        {item.priority.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.timestamp}>
                  {formatTimestamp(item.timestamp)}
                </Text>
                
                {item.retryCount > 0 && (
                  <Text style={styles.retryCount}>
                    Retry attempts: {item.retryCount}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(item.id)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.retryButton]}
              onPress={handleRetryAll}
            >
              <Text style={styles.buttonText}>Retry All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClearQueue}
            >
              <Text style={[styles.buttonText, styles.clearButtonText]}>
                Clear Queue
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>✓</Text>
          <Text style={styles.emptyText}>No queued actions</Text>
          <Text style={styles.emptySubtext}>
            Actions will appear here when you're offline
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  lastSync: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  queueItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  timestamp: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  retryCount: {
    fontSize: 14,
    color: colors.warning,
    marginBottom: 8,
  },
  removeButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.errorLight,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
  },
  clearButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.error,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  clearButtonText: {
    color: colors.error,
  },
});
