import api from './api';
import { UpdateProfileData, User } from '../types';

export const updateProfile = async (data: UpdateProfileData): Promise<User> => {
  const response = await api.put('/profile', data);
  return response.data;
};

export const uploadProfileImage = async (imageUri: string): Promise<User> => {
  const formData = new FormData();
  
  // Create file object from URI
  const filename = imageUri.split('/').pop() || 'profile.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  const response = await api.post('/profile/image', formData);

  return response.data;
};
