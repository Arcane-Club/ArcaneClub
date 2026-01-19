import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'secret';
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch (error: any) {
    console.error('Auth verification failed:', error.message);
    return res.status(401).json({ success: false, message: `Invalid token: ${error.message}` });
  }
};

export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
      req.user = { id: payload.userId, role: payload.role };
    } catch (error) {
      // Ignore invalid token for optional auth
    }
  }
  next();
};
