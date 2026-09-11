import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth/authService.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    token = cookies['token'];
  }

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is required.'
      }
    });
  }

  try {
    const payload = AuthService.verifyToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email
    };
    next();
  } catch (error: any) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: error.message || 'Session expired or invalid token.'
      }
    });
  }
}
