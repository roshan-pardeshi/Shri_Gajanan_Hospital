import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, testConnection, dbConfig } from './db';

async function setAdminPassword() {
  const args = process.argv.slice(2);
  const newPassword = args[0] || 'admin123';
  const adminEmail = (args[1] || 'admin@smartcarehospital.org').trim().toLowerCase();

  console.log('=====================================================');
  console.log('SmartCare Hospital - Set Administrator Password');
  console.log('=====================================================');

  const check = await testConnection();
  if (!check.success) {
    console.error('❌ Could not connect to MySQL database:', check.message);
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 10);

  // Check if admin user exists in profiles
  const existing = await query<any[]>('SELECT * FROM profiles WHERE LOWER(email) = ?', [adminEmail]);

  if (existing.length > 0) {
    const adminUser = existing[0];
    await query(
      'UPDATE profiles SET password_hash = ?, role = "admin", updated_at = NOW() WHERE id = ?',
      [hash, adminUser.id]
    );

    // Ensure user_roles has admin entry
    await query(
      'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, "admin") ON DUPLICATE KEY UPDATE role = "admin"',
      [crypto.randomUUID(), adminUser.id]
    );

    console.log(`✅ Administrator password for "${adminEmail}" has been updated successfully!`);
    console.log(`🔑 New Password: ${newPassword}`);
    console.log(`🔗 Admin Login URL: http://localhost:5173/admin/login`);
  } else {
    // Create new admin user
    const adminId = crypto.randomUUID();
    await query(
      `INSERT INTO profiles (id, email, password_hash, full_name, mobile_number, role)
       VALUES (?, ?, ?, 'Hospital Administrator', '+91 98200 11223', 'admin')`,
      [adminId, adminEmail, hash]
    );

    await query(
      'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, "admin")',
      [crypto.randomUUID(), adminId]
    );

    console.log(`✅ New Administrator account created successfully!`);
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${newPassword}`);
  }

  console.log('=====================================================');
  process.exit(0);
}

setAdminPassword();
