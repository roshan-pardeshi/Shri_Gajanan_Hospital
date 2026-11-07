import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { testConnection } from './db';
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

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check & DB Diagnostic Endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  const dbStatus = await testConnection();
  res.json({
    status: dbStatus.success ? 'online' : 'database_disconnected',
    timestamp: new Date().toISOString(),
    database: {
      engine: 'MySQL 8.0',
      connected: dbStatus.success,
      message: dbStatus.message,
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
  console.log('🚀 Starting SmartCare Hospital Express API Server...');
  console.log(`Port: ${PORT}`);

  // Test MySQL connection
  const connCheck = await testConnection();
  if (connCheck.success) {
    console.log('✅ Connected to local MySQL successfully!');
    // Automatically run schema & seed check
    try {
      await runMigrations();
    } catch (migErr: any) {
      console.warn('⚠️ Auto-migration note:', migErr.message);
    }
  } else {
    console.warn('⚠️ MySQL connection warning:', connCheck.message);
    console.warn('Please update DB_USER and DB_PASSWORD in your .env file.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Hospital Backend API ready at http://localhost:${PORT}/api`);
    console.log(`🏥 Health diagnostic at http://localhost:${PORT}/api/health`);
    console.log('----------------------------------------------------');
  });
}

startServer();
