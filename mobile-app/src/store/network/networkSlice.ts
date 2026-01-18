import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NetworkState } from '../../types';
import { RootState } from '../index';

const initialState: NetworkState = {
  isConnected: true,
  isInternetReachable: null,
  connectionType: null,
  lastOnlineTime: null,
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkStatus: (state, action: PayloadAction<Partial<NetworkState>>) => {
      return { ...state, ...action.payload };
    },
    setLastOnlineTime: (state, action: PayloadAction<number>) => {
      state.lastOnlineTime = action.payload;
    },
  },
});

export const { setNetworkStatus, setLastOnlineTime } = networkSlice.actions;

// Selectors
export const selectIsOnline = (state: RootState) => state.network.isConnected;
export const selectConnectionType = (state: RootState) => state.network.connectionType;
export const selectLastOnlineTime = (state: RootState) => state.network.lastOnlineTime;
export const selectIsInternetReachable = (state: RootState) => state.network.isInternetReachable;

export default networkSlice.reducer;
