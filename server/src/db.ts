import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from project root .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Detect if connecting to a cloud database (TiDB Cloud, AWS RDS, etc.)
const isCloudDb = Boolean(
  process.env.DB_SSL === 'true' ||
  (process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST))
);

// Support SSL CA certificate either from a file path or direct content in environment variable
function getCaCertificate(): string | undefined {
  const caEnv = process.env.DB_SSL_CA;
  if (!caEnv || !caEnv.trim()) return undefined;

  const trimmed = caEnv.trim();

  // If it's a file path that exists on disk, read it
  try {
    if (fs.existsSync(trimmed)) {
      return fs.readFileSync(trimmed, 'utf-8');
    }
  } catch {
    // If path check fails (e.g. content contains newlines or invalid path chars), treat as raw certificate content
  }

  // Treat as certificate content provided directly via environment variable
  // Unescape escaped newlines (\n) if supplied in a single-line env string
  return trimmed.includes('\\n') ? trimmed.replace(/\\n/g, '\n') : trimmed;
}

const caCert = getCaCertificate();

// Secure SSL configuration for TiDB Cloud / Cloud MySQL
// rejectUnauthorized is strictly enabled (true)
const sslConfig = isCloudDb
  ? {
      minVersion: 'TLSv1.2' as const,
      rejectUnauthorized: true,
      ...(caCert ? { ca: caCert } : {}),
    }
  : undefined;

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || (isCloudDb ? '4000' : '3306'), 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_care_hospital',
  ssl: sslConfig,
};

// Initial connection pool
let pool: mysql.Pool | null = null;

export async function getDbPool(): Promise<mysql.Pool> {
  if (pool) return pool;

  // 1. In local development only, ensure database exists.
  // In cloud environments (TiDB Cloud), database smart_care_hospital already exists and user lacks superuser rights.
  if (!isCloudDb) {
    try {
      const adminConn = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
      });
      await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await adminConn.end();
    } catch (err: any) {
      console.warn(`[MySQL Notice] Initial database check: ${err.message}`);
    }
  }

  // 2. Create the connection pool with secure SSL/TLS support
  pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    ssl: dbConfig.ssl,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '15', 10),
    queueLimit: 0,
    decimalNumbers: true,
    multipleStatements: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    dateStrings: true,
  });

  return pool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const p = await getDbPool();
  const [results] = await p.query(sql, params);
  return results as T;
}

export async function withTransaction<T>(
  callback: (conn: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const p = await getDbPool();
  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const p = await getDbPool();
    const [res] = await p.query('SELECT 1 AS check_ok');
    return { success: true, message: 'Database connection successfully established.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to connect to database.' };
  }
}
