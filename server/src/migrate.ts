import fs from 'fs';
import path from 'path';
import { getDbPool, testConnection, dbConfig } from './db';

export async function runMigrations(): Promise<boolean> {
  // If explicitly disabled via env, skip immediately
  if (process.env.RUN_MIGRATIONS === 'false') {
    console.log('ℹ️ RUN_MIGRATIONS is set to false. Skipping database schema migration & seed.');
    return true;
  }

  console.log('=====================================================');
  console.log('SmartCare Hospital - Database Migration & Verification');
  console.log(`Connecting to database on ${dbConfig.host}:${dbConfig.port} as user '${dbConfig.user}'...`);
  console.log('=====================================================');

  const check = await testConnection();
  if (!check.success) {
    console.error('❌ Database Connection Failed:', check.message);
    console.error('\nPlease verify your credentials in .env:');
    console.error('  DB_HOST=' + dbConfig.host);
    console.error('  DB_PORT=' + dbConfig.port);
    console.error('  DB_USER=' + dbConfig.user);
    console.error('  DB_PASSWORD=*****');
    console.error('  DB_NAME=' + dbConfig.database);
    return false;
  }

  console.log('✅ Connection verified!');
  const pool = await getDbPool();

  try {
    // Check if tables already exist
    const [existingTables]: any = await pool.query('SHOW TABLES');
    const tableCount = Array.isArray(existingTables) ? existingTables.length : 0;

    // Safety guard: If tables already exist and RUN_MIGRATIONS is not explicitly set to 'force',
    // preserve all existing data, tables, admin credentials and patient records.
    if (tableCount > 0 && process.env.RUN_MIGRATIONS !== 'force') {
      console.log(`\n📊 Existing database tables found (${tableCount} tables).`);
      console.log('Preserving all existing records and schema (safe mode - no re-seeding or table modification).');
      console.log('\n📊 Database Summary (smart_care_hospital):');
      for (const t of existingTables) {
        const tableName = Object.values(t)[0] as string;
        try {
          const [countRes]: any = await pool.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
          console.log(`  - ${tableName.padEnd(24)}: ${countRes[0]?.count ?? 0} records`);
        } catch {
          console.log(`  - ${tableName.padEnd(24)}: active`);
        }
      }
      console.log('\n✅ Database is verified and ready.');
      return true;
    }

    // Only if database has no tables (fresh database) or RUN_MIGRATIONS === 'force'
    console.log('\n⚠️ No existing tables found or RUN_MIGRATIONS=force. Initializing database schema...');

    const schemaPath = path.resolve(process.cwd(), 'server/database/schema.sql');
    const seedPath = path.resolve(process.cwd(), 'server/database/seed.sql');

    if (fs.existsSync(schemaPath)) {
      console.log('🔄 Executing Schema DDL (server/database/schema.sql)...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await pool.query(schemaSql);
      console.log('✅ Tables created/verified successfully!');
    }

    if (fs.existsSync(seedPath)) {
      console.log('🔄 Seeding default data (server/database/seed.sql)...');
      const seedSql = fs.readFileSync(seedPath, 'utf-8');
      await pool.query(seedSql);
      console.log('✅ Initial seed data inserted/verified successfully!');
    }

    // Verify tables after creation
    const [tables]: any = await pool.query('SHOW TABLES');
    console.log('\n📊 Database Summary (smart_care_hospital):');
    for (const t of tables) {
      const tableName = Object.values(t)[0] as string;
      const [countRes]: any = await pool.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
      console.log(`  - ${tableName.padEnd(24)}: ${countRes[0]?.count ?? 0} records`);
    }

    console.log('\n🎉 Database migration and seeding completed successfully!');
    return true;
  } catch (err: any) {
    console.error('❌ Migration Error:', err.message);
    return false;
  }
}

// Run immediately if called directly via CLI
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations().then((ok) => {
    process.exit(ok ? 0 : 1);
  });
}
