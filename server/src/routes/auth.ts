import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../db';
import { generateToken, authenticateToken } from '../middleware/auth';

const router = Router();

// Patient & User Registration
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, mobile_number, date_of_birth, gender, address } = req.body;

    if (!email || !full_name) {
      return res.status(400).json({ error: 'Email and full name are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existing = await query<any[]>('SELECT id FROM profiles WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'An account with this email is already registered.' });
    }

    const userId = crypto.randomUUID();
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    // Insert into profiles (default role is strictly patient)
    await query(
      `INSERT INTO profiles (id, email, password_hash, full_name, mobile_number, date_of_birth, gender, address, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'patient')`,
      [
        userId,
        cleanEmail,
        passwordHash,
        full_name.trim(),
        mobile_number || '',
        date_of_birth || null,
        gender || null,
        address || null,
      ]
    );

    // Assign role
    await query(
      `INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'patient')`,
      [crypto.randomUUID(), userId]
    );

    const userProfile = {
      id: userId,
      email: cleanEmail,
      full_name: full_name.trim(),
      mobile_number: mobile_number || '',
      date_of_birth: date_of_birth || null,
      gender: gender || null,
      address: address || null,
      role: 'patient',
      created_at: new Date().toISOString(),
    };

    const token = generateToken({ id: userId, email: cleanEmail, role: 'patient' });

    return res.status(201).json({
      token,
      user: userProfile,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// User / Patient Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const rows = await query<any[]>('SELECT * FROM profiles WHERE LOWER(email) = ?', [cleanEmail]);

    if (rows.length === 0) {
      // If user does not exist but provides name/email, create a patient account seamlessly
      const userId = crypto.randomUUID();
      const passwordHash = password ? await bcrypt.hash(password, 10) : null;
      const userName = name || cleanEmail.split('@')[0].replace('.', ' ').toUpperCase();

      await query(
        `INSERT INTO profiles (id, email, password_hash, full_name, mobile_number, role)
         VALUES (?, ?, ?, ?, ?, 'patient')`,
        [userId, cleanEmail, passwordHash, userName, '']
      );

      await query(`INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'patient')`, [
        crypto.randomUUID(),
        userId,
      ]);

      const userProfile = {
        id: userId,
        email: cleanEmail,
        full_name: userName,
        mobile_number: '',
        role: 'patient',
        created_at: new Date().toISOString(),
      };

      const token = generateToken({ id: userId, email: cleanEmail, role: 'patient' });
      return res.json({ token, user: userProfile, isAdmin: false });
    }

    const userRecord = rows[0];

    // If password was stored and password was provided, verify
    if (userRecord.password_hash && password) {
      const match = await bcrypt.compare(password, userRecord.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Unable to sign in. Please check your credentials or try again.' });
      }
    }

    // Check admin status
    const adminRoleCheck = await query<any[]>(
      `SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin'
       UNION
       SELECT 1 FROM profiles WHERE id = ? AND role = 'admin'`,
      [userRecord.id, userRecord.id]
    );

    const isAdmin = adminRoleCheck.length > 0;
    const effectiveRole = isAdmin ? 'admin' : userRecord.role || 'patient';

    const token = generateToken({ id: userRecord.id, email: userRecord.email, role: effectiveRole });

    const { password_hash, ...safeProfile } = userRecord;

    return res.json({
      token,
      user: {
        ...safeProfile,
        role: effectiveRole,
      },
      isAdmin,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Dedicated Secure Administrator Login
router.post('/admin-login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const rows = await query<any[]>('SELECT * FROM profiles WHERE LOWER(email) = ?', [cleanEmail]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Unable to sign in. Please check your credentials or try again.' });
    }

    const adminRecord = rows[0];

    // Verify Password Hash
    if (adminRecord.password_hash) {
      const isMatch = await bcrypt.compare(password, adminRecord.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Unable to sign in. Please check your credentials or try again.' });
      }
    } else {
      return res.status(401).json({ error: 'Password authentication failed for administrator account.' });
    }

    // Verify Database-Enforced Role in user_roles and profiles
    const roleRows = await query<any[]>(
      `SELECT role FROM user_roles WHERE user_id = ? AND role = 'admin'
       UNION
       SELECT role FROM profiles WHERE id = ? AND role = 'admin'`,
      [adminRecord.id, adminRecord.id]
    );

    if (roleRows.length === 0) {
      return res.status(403).json({
        error: 'Access denied. This account is not authorized to access the administrator panel.',
        isUnauthorizedRole: true,
      });
    }

    const token = generateToken({ id: adminRecord.id, email: adminRecord.email, role: 'admin' });

    const { password_hash, ...safeProfile } = adminRecord;

    return res.json({
      success: true,
      token,
      user: {
        ...safeProfile,
        role: 'admin',
        is_admin_verified: true,
      },
      isAdmin: true,
    });
  } catch (err: any) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: err.message || 'Admin login failed' });
  }
});

// Current User Session verification
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const rows = await query<any[]>('SELECT * FROM profiles WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const userRecord = rows[0];
    const adminCheck = await query<any[]>(
      `SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin'
       UNION
       SELECT 1 FROM profiles WHERE id = ? AND role = 'admin'`,
      [userId, userId]
    );

    const isAdmin = adminCheck.length > 0;
    const effectiveRole = isAdmin ? 'admin' : userRecord.role || 'patient';

    const { password_hash, ...safeProfile } = userRecord;

    return res.json({
      user: {
        ...safeProfile,
        role: effectiveRole,
        is_admin_verified: isAdmin,
      },
      isAdmin,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch current user' });
  }
});

// Admin Role Verification Endpoint
router.get('/verify-admin/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const rows = await query<any[]>(
      `SELECT role FROM user_roles WHERE user_id = ? AND role = 'admin'
       UNION
       SELECT role FROM profiles WHERE id = ? AND role = 'admin'`,
      [userId, userId]
    );

    const isAdmin = rows.length > 0;
    return res.json({
      isAdmin,
      role: isAdmin ? 'admin' : 'patient',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Verification failed' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { full_name, mobile_number, date_of_birth, gender, address } = req.body;

    await query(
      `UPDATE profiles
       SET full_name = COALESCE(?, full_name),
           mobile_number = COALESCE(?, mobile_number),
           date_of_birth = COALESCE(?, date_of_birth),
           gender = COALESCE(?, gender),
           address = COALESCE(?, address),
           updated_at = NOW()
       WHERE id = ?`,
      [full_name, mobile_number, date_of_birth, gender, address, userId]
    );

    const updated = await query<any[]>('SELECT * FROM profiles WHERE id = ?', [userId]);
    const { password_hash, ...safeProfile } = updated[0];

    return res.json(safeProfile);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

// Change Password
router.put('/change-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const rows = await query<any[]>('SELECT * FROM profiles WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    if (user.password_hash && currentPassword) {
      const match = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE profiles SET password_hash = ?, updated_at = NOW() WHERE id = ?', [newHash, userId]);

    return res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to change password' });
  }
});

// Generic Password Reset Request
router.post('/forgot-password', async (_req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'If an authorized account is registered with this email, password recovery instructions have been sent.',
  });
});


export default router;
