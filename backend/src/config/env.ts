import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from workspace root or backend root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/trao-interview-prep',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-key-trao-assessment-2026-secure',
  jwtExpiresIn: '7d',
  llmProvider: (process.env.LLM_PROVIDER || 'gemini').toLowerCase(),
  llmApiKey: process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || '',
  tavilyApiKey: process.env.TAVILY_API_KEY || '',
  llmModel: process.env.LLM_MODEL || 'gemini-2.5-flash',
  allowLocalUrls: process.env.ALLOW_LOCAL_URLS === 'true',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5001'
};
