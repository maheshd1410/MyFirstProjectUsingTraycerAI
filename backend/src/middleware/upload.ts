import multer, { StorageEngine } from 'multer';
import { Request } from 'express';

// Memory storage for multer
const storage: StorageEngine = multer.memoryStorage();

// File filter to accept only images with extension and MIME validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  // Get file extension
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  
  // Validate MIME type and extension
  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
};

// Configure multer with enhanced limits
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB per file
  files: 5, // Maximum 5 files
  fieldNameSize: 100, // Max field name size
  fieldSize: 1024 * 1024, // 1MB max field value size
};

export const upload = multer({
  storage,
  fileFilter,
  limits,
});

export const uploadErrorHandler = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if ((error as any).code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }
    if ((error as any).code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Maximum 5 files allowed' });
    }
  }

  if (error && error.message) {
    return res.status(400).json({ error: error.message });
  }

  next();
};
