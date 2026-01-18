import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkState } from '../types';

const NETWORK_STATE_KEY = '@network_state';
const DEBOUNCE_DELAY = 500;

// Network Status Context
const NetworkStatusContext = createContext<NetworkState>({
  isConnected: true,
  isInternetReachable: null,
  connectionType: null,
  lastOnlineTime: null,
});

export const useNetworkStatus = () => {
  return useContext(NetworkStatusContext);
};

interface NetworkStatusProviderProps {
  children: ReactNode;
}

export const NetworkStatusProvider = ({ children }: NetworkStatusProviderProps) => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: null,
    connectionType: null,
    lastOnlineTime: null,
  });

  useEffect(() => {
    // Load persisted network state
    const loadPersistedState = async () => {
      try {
        const persisted = await AsyncStorage.getItem(NETWORK_STATE_KEY);
        if (persisted) {
          const parsed = JSON.parse(persisted);
          setNetworkState(parsed);
        }
      } catch (error) {
        console.error('Failed to load persisted network state:', error);
      }
    };

    loadPersistedState();

    // Subscribe to network changes with debouncing
    let debounceTimer: NodeJS.Timeout;
    
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      clearTimeout(debounceTimer);
      
      debounceTimer = setTimeout(() => {
        const newState: NetworkState = {
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable,
          connectionType: state.type,
          lastOnlineTime: state.isConnected ? Date.now() : networkState.lastOnlineTime,
        };

        setNetworkState(newState);

        // Persist state
        AsyncStorage.setItem(NETWORK_STATE_KEY, JSON.stringify(newState)).catch((error) => {
          console.error('Failed to persist network state:', error);
        });
      }, DEBOUNCE_DELAY);
    });

    return () => {
      clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, []);

  return (
    <NetworkStatusContext.Provider value={networkState}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

// Programmatic network monitoring
type NetworkChangeCallback = (state: NetworkState) => void;

export const subscribeToNetworkChanges = (callback: NetworkChangeCallback) => {
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    callback({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.type,
      lastOnlineTime: state.isConnected ? Date.now() : null,
    });
  });

  return unsubscribe;
};

// Get current network state (async)
export const getCurrentNetworkState = async (): Promise<NetworkState> => {
  const state = await NetInfo.fetch();
  return {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable,
    connectionType: state.type,
    lastOnlineTime: state.isConnected ? Date.now() : null,
  };
};
