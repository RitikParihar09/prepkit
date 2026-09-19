import { app } from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

async function startServer() {
  try {
    // Attempt DB connection, but start HTTP server regardless so health checks work
    connectDB().catch(err => console.warn('[Database] Initial DB connection failed, server will retry on demand.', err));

    app.listen(config.port, () => {
      console.log(`[Server] Backend service listening on port ${config.port}`);
    });
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
}

startServer();
