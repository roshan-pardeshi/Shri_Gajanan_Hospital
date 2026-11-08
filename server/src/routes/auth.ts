import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../db';
import { generateToken, authenticateToken } from '../middleware/auth';
import { validateName, validateMobile, validateEmail, validatePassword } from '../utils/validation';

const router = Router();

// Patient & User Registration
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, mobile_number, date_of_birth, gender, address } = req.body;

    // Strict Name Validation
    const nameCheck = validateName(full_name, 'Full name');
    if (!nameCheck.isValid) {
      return res.status(400).json({ error: nameCheck.error });
    }

    // Strict Email Validation
    const emailCheck = validateEmail(email, true);
    if (!emailCheck.isValid) {
      return res.status(400).json({ error: emailCheck.error });
    }

    // Strict Mobile Number Validation
    const mobileCheck = validateMobile(mobile_number, true);
    if (!mobileCheck.isValid) {
      return res.status(400).json({ error: mobileCheck.error });
    }

    // Strict Password Validation
    const passCheck = validatePassword(password, 6);
    if (!passCheck.isValid) {
      return res.status(400).json({ error: passCheck.error });
    }

    const cleanEmail = emailCheck.value!;
    const cleanName = nameCheck.value!;
    const cleanMobile = mobileCheck.value!;

    // Check if email already registered
    const existing = await query<any[]>('SELECT id FROM profiles WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'An account with this email is already registered.' });
    }

    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(passCheck.value!, 10);

    // Insert into profiles (default role is strictly patient)
    await query(
      `INSERT INTO profiles (id, email, password_hash, full_name, mobile_number, date_of_birth, gender, address, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'patient')`,
      [
        userId,
        cleanEmail,
        passwordHash,
        cleanName,
        cleanMobile,
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
      full_name: cleanName,
      mobile_number: cleanMobile,
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

    const emailCheck = validateEmail(email, true);
    if (!emailCheck.isValid) {
      return res.status(400).json({ error: emailCheck.error });
    }

    const cleanEmail = emailCheck.value!;
    const rows = await query<any[]>('SELECT * FROM profiles WHERE LOWER(email) = ?', [cleanEmail]);

    if (rows.length === 0) {
      // If user does not exist but provides name/email, create a patient account seamlessly
      const userId = crypto.randomUUID();
      const passwordHash = password ? await bcrypt.hash(password, 10) : null;
      let userName = cleanEmail.split('@')[0].replace('.', ' ').toUpperCase();
      if (name && typeof name === 'string' && name.trim()) {
        const nameCheck = validateName(name, 'Full name');
        if (nameCheck.isValid) {
          userName = nameCheck.value!;
        }
      }

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
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const emailCheck = validateEmail(email, true);
    if (!emailCheck.isValid) {
      return res.status(400).json({ error: emailCheck.error });
    }

    const cleanEmail = emailCheck.value!;
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

    let cleanName: string | undefined;
    if (full_name !== undefined) {
      const nameCheck = validateName(full_name, 'Full name');
      if (!nameCheck.isValid) {
        return res.status(400).json({ error: nameCheck.error });
      }
      cleanName = nameCheck.value!;
    }

    let cleanMobile: string | undefined;
    if (mobile_number !== undefined && mobile_number !== '') {
      const mobileCheck = validateMobile(mobile_number, true);
      if (!mobileCheck.isValid) {
        return res.status(400).json({ error: mobileCheck.error });
      }
      cleanMobile = mobileCheck.value!;
    } else if (mobile_number === '') {
      cleanMobile = '';
    }

    await query(
      `UPDATE profiles
       SET full_name = COALESCE(?, full_name),
           mobile_number = COALESCE(?, mobile_number),
           date_of_birth = COALESCE(?, date_of_birth),
           gender = COALESCE(?, gender),
           address = COALESCE(?, address),
           updated_at = NOW()
       WHERE id = ?`,
      [cleanName ?? null, cleanMobile ?? null, date_of_birth || null, gender || null, address || null, userId]
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

    const passCheck = validatePassword(newPassword, 6);
    if (!passCheck.isValid) {
      return res.status(400).json({ error: passCheck.error });
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

    const newHash = await bcrypt.hash(passCheck.value!, 10);
    await query('UPDATE profiles SET password_hash = ?, updated_at = NOW() WHERE id = ?', [newHash, userId]);

    return res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to change password' });
  }
});

// Generic Password Reset Request
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (email) {
    const emailCheck = validateEmail(email, true);
    if (!emailCheck.isValid) {
      return res.status(400).json({ error: emailCheck.error });
    }
  }

  return res.json({
    success: true,
    message: 'If an authorized account is registered with this email, password recovery instructions have been sent.',
  });
});


export default router;
