import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import kitRoutes from './routes/kitRoutes.js';

export const app = express();

// Middleware
app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:3000'],
  credentials: true
}));
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
