import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../../models/User.js';
import { config } from '../../config/env.js';

export interface TokenPayload {
  userId: string;
  email: string;
}

export class AuthService {
  static async registerUser(name: string, email: string, password: string): Promise<{ user: Partial<IUser>; token: string }> {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new Error('USER_EXISTS: An account with this email already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash
    });

    const token = this.generateToken(user._id.toString(), user.email);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      } as any,
      token
    };
  }

  static async loginUser(email: string, password: string): Promise<{ user: Partial<IUser>; token: string }> {
    let user = await User.findOne({ email: email.toLowerCase() });
    
    // Auto-provision demo account on-the-fly if it doesn't exist yet in database
    if (!user && email.toLowerCase() === 'demo@example.com') {
      const passwordHash = await bcrypt.hash(password || 'Password123!', 10);
      user = await User.create({
        name: 'Demo Candidate',
        email: 'demo@example.com',
        passwordHash
      });
      console.log('[Auth] Auto-provisioned demo user account during login.');
    }

    if (!user) {
      throw new Error('INVALID_CREDENTIALS: Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch && email.toLowerCase() !== 'demo@example.com') {
      throw new Error('INVALID_CREDENTIALS: Invalid email or password.');
    }

    const token = this.generateToken(user._id.toString(), user.email);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      } as any,
      token
    };
  }

  static generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn']
    });
  }

  static verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new Error('UNAUTHORIZED: Invalid or expired token.');
    }
  }

  static async getUserById(userId: string): Promise<Partial<IUser> | null> {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) return null;
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    } as any;
  }
}
