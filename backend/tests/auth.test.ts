import { describe, it, expect, beforeAll } from 'vitest';
import { AuthService } from '../src/services/auth/authService.js';

describe('AuthService unit tests', () => {
  it('generates and verifies JWT tokens correctly', () => {
    const token = AuthService.generateToken('user123', 'test@example.com');
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = AuthService.verifyToken(token);
    expect(decoded.userId).toBe('user123');
    expect(decoded.email).toBe('test@example.com');
  });

  it('rejects invalid or tampered tokens', () => {
    expect(() => AuthService.verifyToken('invalid-token-string')).toThrow();
  });
});
