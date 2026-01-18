import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as profileService from '../../services/profile.service';
import { UpdateProfileData, ProfileState } from '../../types';
import { RootState } from '../index';

const initialState: ProfileState = {
  user: null,
  isLoading: {
    fetch: false,
    refresh: false,
    loadMore: false,
    action: false,
    upload: false,
  },
  error: null,
};

/**
 * Async thunk to update user profile
 */
export const updateUserProfile = createAsyncThunk(
  'profile/updateUserProfile',
  async (data: UpdateProfileData, { rejectWithValue }) => {
    try {
      const updatedUser = await profileService.updateProfile(data);
      return updatedUser;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update profile');
    }
  }
);

/**
 * Async thunk to upload profile image
 */
export const uploadProfileImage = createAsyncThunk(
  'profile/uploadProfileImage',
  async (imageUri: string, { rejectWithValue }) => {
    try {
      const updatedUser = await profileService.uploadProfileImage(imageUri);
      return updatedUser;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to upload profile image');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Update user profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading.action = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading.action = false;
        state.user = action.payload;
        // Note: The auth slice will be updated separately in the component
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading.action = false;
        state.error = action.payload as string;
      });

    // Upload profile image
    builder
      .addCase(uploadProfileImage.pending, (state) => {
        state.isLoading.upload = true;
        state.error = null;
      })
      .addCase(uploadProfileImage.fulfilled, (state, action) => {
        state.isLoading.upload = false;
        state.user = action.payload;
        // Note: The auth slice will be updated separately in the component
      })
      .addCase(uploadProfileImage.rejected, (state, action) => {
        state.isLoading.upload = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearProfileError } = profileSlice.actions;

// Selectors
export const selectProfileLoading = (state: RootState) => state.profile.isLoading;
export const selectProfileError = (state: RootState) => state.profile.error;

export default profileSlice.reducer;
