import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { query } from '../db';
import { optionalAuth, authenticateToken } from '../middleware/auth';

const router = Router();

// GET notifications for user or admin
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || (req.query.userId as string);
    const requestedAdmin = req.query.isAdmin === 'true' || req.user?.role === 'admin';

    let isAdmin = requestedAdmin;
    if (!isAdmin && userId) {
      const adminRoleCheck = await query<any[]>(
        `SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin'
         UNION
         SELECT 1 FROM profiles WHERE id = ? AND role = 'admin'`,
        [userId, userId]
      );
      isAdmin = adminRoleCheck.length > 0;
    }

    let rows: any[] = [];
    if (isAdmin) {
      rows = await query<any[]>(
        `SELECT * FROM notifications 
         WHERE user_id = ? 
            OR user_id IS NULL 
            OR user_id = 'admin'
            OR type IN ('appointment_request', 'reschedule_request', 'appointment_cancelled', 'general')
         ORDER BY created_at DESC LIMIT 50`,
        [userId || 'admin']
      );
    } else if (userId) {
      rows = await query<any[]>(
        `SELECT * FROM notifications 
         WHERE user_id = ?
         ORDER BY created_at DESC LIMIT 50`,
        [userId]
      );
    } else {
      rows = await query<any[]>(
        `SELECT * FROM notifications 
         WHERE user_id IS NULL AND type = 'general'
         ORDER BY created_at DESC LIMIT 20`
      );
    }

    const formatted = rows.map(n => ({
      ...n,
      is_read: Boolean(n.is_read),
    }));

    return res.json(formatted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch notifications' });
  }
});

// POST create notification
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, title, message, type, reference_id } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const id = crypto.randomUUID();
    const isUuid = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const targetUserId = isUuid(user_id) ? user_id : null;

    await query(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, reference_id)
       VALUES (?, ?, ?, ?, ?, FALSE, ?)`,
      [id, targetUserId, title, message, type || 'general', reference_id || null]
    );

    const created = await query<any[]>('SELECT * FROM notifications WHERE id = ?', [id]);
    return res.status(201).json(created[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create notification' });
  }
});

// PUT mark single notification as read
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to mark notification as read' });
  }
});

// PUT mark all as read for user or admin
router.put('/read-all', optionalAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const requestedAdmin = req.query.isAdmin === 'true' || req.body.isAdmin === true || req.user?.role === 'admin';

    let isAdmin = requestedAdmin;
    if (!isAdmin && userId) {
      const adminRoleCheck = await query<any[]>(
        `SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin'
         UNION
         SELECT 1 FROM profiles WHERE id = ? AND role = 'admin'`,
        [userId, userId]
      );
      isAdmin = adminRoleCheck.length > 0;
    }

    if (isAdmin) {
      await query(
        `UPDATE notifications 
         SET is_read = TRUE 
         WHERE user_id = ? 
            OR user_id IS NULL 
            OR user_id = 'admin' 
            OR type IN ('appointment_request', 'reschedule_request', 'appointment_cancelled', 'general')`,
        [userId || 'admin']
      );
    } else if (userId) {
      await query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
    } else {
      await query('UPDATE notifications SET is_read = TRUE WHERE user_id IS NULL');
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to mark all as read' });
  }
});

export default router;
