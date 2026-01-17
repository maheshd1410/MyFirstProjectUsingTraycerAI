import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError } from '../utils/errors';

const authService = new AuthService();

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { firstName, lastName, phoneNumber } = req.body;

    const updatedUser = await authService.updateUserProfile(userId, {
      firstName,
      lastName,
      phoneNumber,
    });

    res.json(updatedUser);
  } catch (error: any) {
    if (error.message === 'Phone number already in use') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
};

export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    if (!req.file) {
      throw new AppError('No image file provided', 400);
    }

    // Get Cloudinary URL from multer-storage-cloudinary
    const imageUrl = (req.file as any).path;

    const updatedUser = await authService.updateProfileImage(userId, imageUrl);

    res.json(updatedUser);
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to upload profile image' });
    }
  }
};
