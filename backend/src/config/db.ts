import mongoose from 'mongoose';
import { config } from './env.js';

import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

async function seedDemoUser() {
  try {
    const demoEmail = 'demo@example.com';
    const existing = await User.findOne({ email: demoEmail });
    if (!existing) {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      await User.create({
        name: 'Demo Candidate',
        email: demoEmail,
        passwordHash
      });
      console.log(`[Database] Seeded demo user account: ${demoEmail}`);
    }
  } catch (err: any) {
    console.warn('[Database] Demo user seeding warning:', err?.message || err);
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
    await seedDemoUser();
    return conn;
  } catch (error: any) {
    console.error(`[Database] MongoDB connection failed: ${error.message}`);
    throw error;
  }
}
