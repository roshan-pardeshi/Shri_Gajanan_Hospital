import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { testConnection, isCloudDb, dbConfig, closeDbPool } from './db';

// Import Route Handlers
import authRouter from './routes/auth';
import doctorsRouter from './routes/doctors';
import specialitiesRouter from './routes/specialities';
import appointmentsRouter from './routes/appointments';
import laboratoryRouter from './routes/laboratory';
import schemesRouter from './routes/schemes';
import settingsRouter from './routes/settings';
import notificationsRouter from './routes/notifications';
import aiChatRouter from './routes/aiChat';
import sectionsRouter from './routes/sections';
import reviewsRouter from './routes/reviews';
import chiefDoctorRouter from './routes/chiefDoctor';

// Ensure .env is loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Allowed CORS origins (Production Firebase Hosting, Render direct access, & Local Development)
const ALLOWED_ORIGINS = [
  'https://shri-gajanan-hospital-35386.web.app',
  'https://shri-gajanan-hospital-35386.firebaseapp.com',
  'https://shri-gajanan-hospital.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as direct browser navigation, curl, or server-to-server health checks)
      if (!origin) {
        return callback(null, true);
      }
      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      // Safely disallow rejected origins without throwing an unhandled exception into Express
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cached database connection status for instant (< 5ms) health responses
let cachedDbStatus = {
  connected: false,
  message: 'Connecting to database in background...',
  latencyMs: 0,
  checkedAt: new Date().toISOString(),
};
let isCheckingDb = false;

export async function checkDatabaseStatus(timeoutMs: number = 3000) {
  if (isCheckingDb) return cachedDbStatus;
  isCheckingDb = true;
  try {
    const res = await testConnection(timeoutMs);
    cachedDbStatus = {
      connected: res.success,
      message: res.message,
      latencyMs: res.latencyMs || 0,
      checkedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    cachedDbStatus = {
      connected: false,
      message: err?.message || 'Database check failed',
      latencyMs: 0,
      checkedAt: new Date().toISOString(),
    };
  } finally {
    isCheckingDb = false;
  }
  return cachedDbStatus;
}

// Health Check & DB Diagnostic Endpoint (Responds immediately and independently of database latency)
app.get('/api/health', async (_req: Request, res: Response) => {
  // If cache is older than 20 seconds, trigger a non-blocking background refresh
  const cacheAge = Date.now() - new Date(cachedDbStatus.checkedAt).getTime();
  if (cacheAge > 20000 && !isCheckingDb) {
    checkDatabaseStatus(3000);
  }

  // Respond immediately with HTTP 200 and current diagnostic state
  res.status(200).json({
    status: 'online',
    service: 'Shri Gajanan Hospital API',
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      type: isCloudDb ? 'TiDB Cloud (Serverless MySQL)' : 'Local MySQL',
      connected: cachedDbStatus.connected,
      message: cachedDbStatus.message,
      latency_ms: cachedDbStatus.latencyMs,
      last_checked: cachedDbStatus.checkedAt,
    },
  });
});

// Mount API Routes
app.use('/api/auth', authRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/specialities', specialitiesRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/laboratory', laboratoryRouter);
app.use('/api/schemes', schemesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/chat', aiChatRouter);
app.use('/api/sections', sectionsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/chief-doctor', chiefDoctorRouter);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// 1. Start Express Server IMMEDIATELY without waiting for database (Requirement 1)
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('----------------------------------------------------');
  console.log('🚀 Shri Gajanan Multispeciality Hospital Express API Server');
  console.log(`Port: ${PORT} (bound to 0.0.0.0)`);
  console.log(`Process ID: ${process.pid}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Database Target: ${isCloudDb ? 'TiDB Cloud (Serverless / Cloud MySQL)' : 'Local MySQL'}`);
  console.log(`Database Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`Database Name: ${dbConfig.database}`);
  console.log(`SSL/TLS: ${isCloudDb ? 'Enabled (Strict TLSv1.2)' : 'Disabled (Local)'}`);
  console.log(`📡 Hospital Backend API ready at http://localhost:${PORT}/api`);
  console.log(`🏥 Health diagnostic at http://localhost:${PORT}/api/health`);
  console.log('----------------------------------------------------');

  // 2. Run database connectivity check asynchronously AFTER server starts (Requirement 2)
  checkDatabaseStatus(5000).then((status) => {
    const dbLabel = isCloudDb ? 'TiDB Cloud' : 'Local MySQL';
    if (status.connected) {
      console.log(`✅ Background DB check: Connected to ${dbLabel} (${dbConfig.host}:${dbConfig.port}) successfully! [${status.latencyMs}ms]`);
    } else {
      console.warn(`⚠️ Background DB check: ${dbLabel} initial note: ${status.message}`);
      console.warn('Server is live and listening. Database requests will retry on demand.');
    }
  }).catch((err) => {
    console.warn('⚠️ Background DB check error:', err?.message || err);
  });
});

// Listener Error Handling
server.on('error', (err: any) => {
  console.error('[FATAL SERVER ERROR]: Could not bind HTTP listener:', err);
  process.exit(1);
});

// 4. Graceful Shutdown Handlers (Requirement 4)
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);

  // Force exit fallback if connections do not close within 10 seconds
  const forceTimer = setTimeout(() => {
    console.error('⚠️ Forcefully terminating process after 10s shutdown timeout.');
    process.exit(1);
  }, 10000);
  forceTimer.unref();

  // 1. Immediately terminate idle keep-alive connections to speed up shutdown
  if (typeof server.closeIdleConnections === 'function') {
    server.closeIdleConnections();
  }

  // 2. Stop accepting new HTTP requests
  server.close(async (err) => {
    if (err && (err as any).code !== 'ERR_SERVER_NOT_RUNNING') {
      console.error('Error closing HTTP server:', err);
    } else {
      console.log('✅ HTTP server stopped accepting new requests.');
    }

    // 3. Close database connection pool cleanly
    try {
      await closeDbPool();
      console.log('✅ Database connection pool drained and closed cleanly.');
    } catch (dbErr: any) {
      console.warn('Notice while closing DB pool:', dbErr?.message || dbErr);
    }

    console.log('👋 Graceful shutdown complete. Exiting process.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Process Exception & Rejection Handlers
process.on('unhandledRejection', (reason: any) => {
  console.error('[UNHANDLED REJECTION]: Fatal unhandled promise rejection occurred:', reason instanceof Error ? { message: reason.message, stack: reason.stack } : reason);
  // Trigger a controlled graceful shutdown rather than leaving server in an unknown state
  gracefulShutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (err: Error) => {
  console.error('[UNCAUGHT EXCEPTION]: Fatal uncaught exception occurred:', {
    message: err.message,
    stack: err.stack,
  });
  // Trigger a controlled graceful shutdown so container orchestrators can restart cleanly
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});
