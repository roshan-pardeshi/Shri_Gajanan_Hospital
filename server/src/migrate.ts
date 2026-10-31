import fs from 'fs';
import path from 'path';
import { getDbPool, testConnection, dbConfig } from './db';

export async function runMigrations(): Promise<boolean> {
  console.log('=====================================================');
  console.log('SmartCare Hospital - MySQL Database Migration');
  console.log(`Connecting to MySQL on ${dbConfig.host}:${dbConfig.port} as user '${dbConfig.user}'...`);
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

    // Verify tables
    const [tables]: any = await pool.query('SHOW TABLES');
    console.log('\n📊 Database Summary (smart_care_hospital):');
    for (const t of tables) {
      const tableName = Object.values(t)[0] as string;
      const [countRes]: any = await pool.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
      console.log(`  - ${tableName.padEnd(24)}: ${countRes[0].count} records`);
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
