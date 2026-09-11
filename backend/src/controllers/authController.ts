import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { AuthService } from '../services/auth/authService.js';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export class AuthController {
  static async register(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors.map(e => e.message).join(', ')
          }
        });
      }

      const { name, email, password } = parsed.data;
      const result = await AuthService.registerUser(name, email, password);

      // Set auth cookie for seamless browser sessions if desired
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(201).json(result);
    } catch (error: any) {
      if (error.message.startsWith('USER_EXISTS')) {
        return res.status(409).json({
          error: {
            code: 'USER_EXISTS',
            message: 'An account with this email address already exists.'
          }
        });
      }
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: error.message || 'An unexpected error occurred during registration.'
        }
      });
    }
  }

  static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors.map(e => e.message).join(', ')
          }
        });
      }

      const { email, password } = parsed.data;
      const result = await AuthService.loginUser(email, password);

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json(result);
    } catch (error: any) {
      if (error.message.startsWith('INVALID_CREDENTIALS')) {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password.'
          }
        });
      }
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: error.message || 'An unexpected error occurred during login.'
        }
      });
    }
  }

  static async logout(_req: AuthenticatedRequest, res: Response) {
    res.clearCookie('token');
    return res.status(200).json({ status: 'ok', message: 'Logged out successfully.' });
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      }

      const user = await AuthService.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      }

      return res.status(200).json({ user });
    } catch (error: any) {
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
}
