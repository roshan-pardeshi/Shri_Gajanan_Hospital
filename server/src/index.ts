import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { testConnection, isCloudDb, dbConfig } from './db';
import { runMigrations } from './migrate';

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

// Health Check & DB Diagnostic Endpoint (Responds promptly and independently of database status)
app.get('/api/health', async (_req: Request, res: Response) => {
  // Test database connection with a strict 3-second timeout
  const dbStatus = await testConnection(3000);

  res.status(200).json({
    status: 'online',
    service: 'Shri Gajanan Hospital API',
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      type: isCloudDb ? 'TiDB Cloud (Serverless MySQL)' : 'Local MySQL',
      connected: dbStatus.success,
      message: dbStatus.message,
      latency_ms: dbStatus.latencyMs,
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

// Server Initialization
async function startServer() {
  console.log('----------------------------------------------------');
  console.log('🚀 Starting Shri Gajanan Multispeciality Hospital Express API Server...');
  console.log(`Port: ${PORT}`);
  console.log(`Database Target: ${isCloudDb ? 'TiDB Cloud (Serverless / Cloud MySQL)' : 'Local MySQL'}`);
  console.log(`Database Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`Database Name: ${dbConfig.database}`);
  console.log(`SSL/TLS: ${isCloudDb ? 'Enabled (Strict TLSv1.2)' : 'Disabled (Local)'}`);

  // Test database connection with a 5-second initial timeout
  const connCheck = await testConnection(5000);
  const dbLabel = isCloudDb ? 'TiDB Cloud' : 'Local MySQL';

  if (connCheck.success) {
    console.log(`✅ Connected to ${dbLabel} (${dbConfig.host}:${dbConfig.port}) successfully! [${connCheck.latencyMs ?? 0}ms]`);
    // Automatically run schema & seed check (safe mode)
    try {
      await runMigrations();
    } catch (migErr: any) {
      console.warn('⚠️ Auto-migration note:', migErr.message);
    }
  } else {
    console.warn(`⚠️ ${dbLabel} initial connection note: ${connCheck.message}`);
    console.warn('Server will continue running. Endpoints requiring database will retry on demand.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Hospital Backend API ready at http://localhost:${PORT}/api`);
    console.log(`🏥 Health diagnostic at http://localhost:${PORT}/api/health`);
    console.log('----------------------------------------------------');
  });
}

startServer();
