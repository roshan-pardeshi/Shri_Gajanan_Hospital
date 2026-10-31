import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { query } from '../db';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// GET all active specialities
router.get('/', async (_req: Request, res: Response) => {
  try {
    const specialities = await query<any[]>(
      'SELECT * FROM specialities WHERE is_active = TRUE ORDER BY name ASC'
    );
    return res.json(specialities);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch specialities' });
  }
});

// Admin: Add Speciality
router.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, slug, description, icon_name } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'Speciality name and slug are required' });
    }

    const id = crypto.randomUUID();
    await query(
      'INSERT INTO specialities (id, name, slug, description, icon_name, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
      [id, name, slug, description || '', icon_name || 'Activity']
    );

    const created = await query<any[]>('SELECT * FROM specialities WHERE id = ?', [id]);
    return res.status(201).json(created[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to add speciality' });
  }
});

export default router;
