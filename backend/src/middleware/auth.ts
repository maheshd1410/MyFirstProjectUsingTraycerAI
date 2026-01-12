// Authentication middleware placeholder
import { Request, Response, NextFunction } from 'express';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Implement JWT/auth checks later
  next();
};
