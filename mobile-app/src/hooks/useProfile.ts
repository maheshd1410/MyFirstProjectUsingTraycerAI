import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  updateUserProfile, 
  uploadProfileImage as uploadProfileImageAction,
  selectProfileLoading,
  selectProfileError,
  clearProfileError,
} from '../store/profile/profileSlice';
import { UpdateProfileData } from '../types';

export const useProfile = () => {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectProfileLoading);
  const error = useAppSelector(selectProfileError);

  const updateProfile = async (data: UpdateProfileData) => {
    const result = await dispatch(updateUserProfile(data));
    if (updateUserProfile.fulfilled.match(result)) {
      // Update auth state with new user data
      // This will be handled in the component using setUser from authSlice
      return result.payload;
    }
    throw new Error(result.payload as string);
  };

  const uploadImage = async (imageUri: string) => {
    const result = await dispatch(uploadProfileImageAction(imageUri));
    if (uploadProfileImageAction.fulfilled.match(result)) {
      // Update auth state with new user data
      return result.payload;
    }
    throw new Error(result.payload as string);
  };

  const clearError = () => {
    dispatch(clearProfileError());
  };

  return {
    updateProfile,
    uploadImage,
    isLoading,
    error,
    clearError,
  };
};
