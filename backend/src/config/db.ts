import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error: any) {
    console.error(`[Database] MongoDB connection failed: ${error.message}`);
    throw error;
  }
}
