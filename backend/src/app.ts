import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import kitRoutes from './routes/kitRoutes.js';

export const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.endsWith('.vercel.app') || origin === 'http://localhost:3000' || origin === config.frontendUrl) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.use('/api/health', healthRoutes);

// Auth Routes
app.use('/api/auth', authRoutes);

// Kit Routes
app.use('/api/kits', kitRoutes);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error Handler]', err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An internal server error occurred.'
    }
  });
});
