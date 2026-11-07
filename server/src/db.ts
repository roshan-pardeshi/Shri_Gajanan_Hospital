import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from project root .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_care_hospital',
};

// Initial connection pool
let pool: mysql.Pool | null = null;

export async function getDbPool(): Promise<mysql.Pool> {
  if (pool) return pool;

  // 1. First ensure database exists
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

  // 2. Create the connection pool
  pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    waitForConnections: true,
    connectionLimit: 15,
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
    return { success: true, message: 'MySQL connection successfully established.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to connect to MySQL.' };
  }
}
