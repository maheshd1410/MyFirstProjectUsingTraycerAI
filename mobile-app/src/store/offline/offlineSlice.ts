import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { OfflineAction } from '../../types';
import { RootState } from '../index';

interface OfflineState {
  queue: OfflineAction[];
  isProcessing: boolean;
  lastSyncTime: number | null;
}

const initialState: OfflineState = {
  queue: [],
  isProcessing: false,
  lastSyncTime: null,
};

// Registry of thunk action creators for replay
// This will be populated by the middleware
export const thunkRegistry = new Map<string, (payload: any) => any>();

// Add action to queue
export const addToQueue = createAsyncThunk(
  'offline/addToQueue',
  async (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
    return {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    } as OfflineAction;
  }
);

// Process offline queue
export const syncOfflineActions = createAsyncThunk(
  'offline/syncOfflineActions',
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    const { queue } = state.offline;

    const results: { success: string[]; failed: string[] } = {
      success: [],
      failed: [],
    };

    // Sort by priority: high > medium > low
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sortedQueue = [...queue].sort((a, b) => {
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      return aPriority - bPriority;
    });

    for (const action of sortedQueue) {
      try {
        // Get the thunk creator from registry
        const thunkCreator = thunkRegistry.get(action.type);
        
        if (thunkCreator) {
          // Dispatch the actual thunk and unwrap to catch errors
          await dispatch(thunkCreator(action.payload)).unwrap();
        } else {
          console.warn(`No thunk creator found for action type: ${action.type}`);
          // Fallback to plain action dispatch for non-thunk actions
          await dispatch({
            type: action.type,
            payload: action.payload,
          });
        }
        
        results.success.push(action.id);
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        
        // Increment retry count
        if (action.retryCount < 3) {
          // Keep in queue for retry
          results.failed.push(action.id);
        } else {
          // Max retries reached, remove from queue
          console.warn(`Max retries reached for action ${action.id}, removing from queue`);
          results.success.push(action.id);
        }
      }
    }

    return results;
  }
);

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter((item) => item.id !== action.payload);
    },
    clearQueue: (state) => {
      state.queue = [];
    },
    incrementRetryCount: (state, action: PayloadAction<string>) => {
      const item = state.queue.find((q) => q.id === action.payload);
      if (item) {
        item.retryCount += 1;
      }
    },
    processQueue: (state) => {
      state.isProcessing = true;
    },
    queueProcessed: (state) => {
      state.isProcessing = false;
      state.lastSyncTime = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addToQueue.fulfilled, (state, action) => {
        // Check queue size limit (max 100 actions)
        if (state.queue.length >= 100) {
          // Remove oldest action (FIFO)
          state.queue.shift();
        }
        
        // Check for duplicate actions
        const exists = state.queue.find(
          (item) =>
            item.type === action.payload.type &&
            JSON.stringify(item.payload) === JSON.stringify(action.payload.payload)
        );

        if (!exists) {
          state.queue.push(action.payload);
        }
      })
      .addCase(syncOfflineActions.pending, (state) => {
        state.isProcessing = true;
      })
      .addCase(syncOfflineActions.fulfilled, (state, action) => {
        const { success, failed } = action.payload;
        
        // Remove successfully synced actions
        state.queue = state.queue.filter((item) => !success.includes(item.id));
        
        // Increment retry count for failed actions
        failed.forEach((id) => {
          const item = state.queue.find((q) => q.id === id);
          if (item) {
            item.retryCount += 1;
          }
        });

        state.isProcessing = false;
        state.lastSyncTime = Date.now();
      })
      .addCase(syncOfflineActions.rejected, (state) => {
        state.isProcessing = false;
      });
  },
});

export const {
  removeFromQueue,
  clearQueue,
  incrementRetryCount,
  processQueue,
  queueProcessed,
} = offlineSlice.actions;

// Selectors
export const selectOfflineQueue = (state: RootState) => state.offline.queue;
export const selectIsProcessing = (state: RootState) => state.offline.isProcessing;
export const selectLastSyncTime = (state: RootState) => state.offline.lastSyncTime;
export const selectQueueCount = (state: RootState) => state.offline.queue.length;

export default offlineSlice.reducer;
