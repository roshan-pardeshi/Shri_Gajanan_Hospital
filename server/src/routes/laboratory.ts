import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { query } from '../db';
import { optionalAuth, authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// GET all laboratory tests
router.get('/tests', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { includeDrafts, category } = req.query;

    let sql = 'SELECT * FROM laboratory_tests WHERE 1=1';
    const params: any[] = [];

    if (includeDrafts !== 'true') {
      sql += ' AND is_published = TRUE';
    }

    if (category && typeof category === 'string' && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY display_order ASC, name ASC';

    const tests = await query<any[]>(sql, params);

    const formatted = tests.map(t => ({
      ...t,
      indicative_price: t.indicative_price !== null ? Number(t.indicative_price) : null,
      fasting_required: Boolean(t.fasting_required),
      is_available: Boolean(t.is_available),
      is_published: Boolean(t.is_published),
    }));

    return res.json(formatted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch laboratory tests' });
  }
});

// GET single test by ID
router.get('/tests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tests = await query<any[]>('SELECT * FROM laboratory_tests WHERE id = ?', [id]);
    if (tests.length === 0) {
      return res.status(404).json({ error: 'Laboratory test not found' });
    }
    const t = tests[0];
    return res.json({
      ...t,
      indicative_price: t.indicative_price !== null ? Number(t.indicative_price) : null,
      fasting_required: Boolean(t.fasting_required),
      is_available: Boolean(t.is_available),
      is_published: Boolean(t.is_published),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch laboratory test' });
  }
});

// Admin: Add Laboratory Test
router.post('/tests', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      name,
      slug,
      category,
      description,
      sample_type,
      preparation_instructions,
      fasting_required,
      indicative_price,
      turnaround_time,
      is_available,
      is_published,
      display_order,
    } = req.body;

    if (!name || !slug || !category || !description) {
      return res.status(400).json({ error: 'Name, slug, category, and description are required' });
    }

    if (indicative_price !== undefined && indicative_price !== null && indicative_price !== '') {
      const numPrice = Number(indicative_price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ error: 'Test price must be a valid positive number' });
      }
    }

    const id = crypto.randomUUID();

    await query(
      `INSERT INTO laboratory_tests (
        id, name, slug, category, description, sample_type, preparation_instructions,
        fasting_required, indicative_price, turnaround_time, is_available, is_published,
        display_order, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        slug,
        category,
        description,
        sample_type || null,
        preparation_instructions || null,
        fasting_required ? 1 : 0,
        indicative_price !== undefined ? indicative_price : null,
        turnaround_time || 'Within 24 Hours',
        is_available !== false ? 1 : 0,
        is_published !== false ? 1 : 0,
        display_order || 0,
        req.user!.id,
      ]
    );

    const created = await query<any[]>('SELECT * FROM laboratory_tests WHERE id = ?', [id]);
    return res.status(201).json(created[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to add laboratory test' });
  }
});

// Admin: Update Laboratory Test
router.put('/tests/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowed = [
      'name',
      'slug',
      'category',
      'description',
      'sample_type',
      'preparation_instructions',
      'fasting_required',
      'indicative_price',
      'turnaround_time',
      'is_available',
      'is_published',
      'display_order',
    ];

    const fields: string[] = [];
    const values: any[] = [];

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        fields.push(`\`${key}\` = ?`);
        if (typeof updates[key] === 'boolean') {
          values.push(updates[key] ? 1 : 0);
        } else {
          values.push(updates[key]);
        }
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    await query(`UPDATE laboratory_tests SET ${fields.join(', ')} WHERE id = ?`, values);

    const updated = await query<any[]>('SELECT * FROM laboratory_tests WHERE id = ?', [id]);
    return res.json(updated[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update laboratory test' });
  }
});

// Admin: Delete Laboratory Test
router.delete('/tests/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM laboratory_tests WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Laboratory test deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete laboratory test' });
  }
});

// GET laboratory settings
router.get('/settings', async (_req: Request, res: Response) => {
  try {
    const rows = await query<any[]>('SELECT * FROM laboratory_settings LIMIT 1');
    if (rows.length === 0) {
      return res.json({
        lab_name: 'Shri Gajanan Hospital Diagnostic Laboratory',
        location: 'Ground Floor, Diagnostics & Imaging Wing B',
        operating_hours: 'Mon - Sat: 07:30 AM - 07:00 PM | Emergency: 24/7',
        contact_phone: '+91 22 2845 6795',
        general_description: 'Fully automated diagnostic laboratory.',
        accepts_walkins: true,
        appointment_required: false,
      });
    }
    const s = rows[0];
    return res.json({
      ...s,
      accepts_walkins: Boolean(s.accepts_walkins),
      appointment_required: Boolean(s.appointment_required),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch laboratory settings' });
  }
});

// Admin: Update laboratory settings
router.put('/settings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const allowed = [
      'lab_name',
      'location',
      'operating_hours',
      'contact_phone',
      'general_description',
      'accepts_walkins',
      'appointment_required',
    ];

    const fields: string[] = [];
    const values: any[] = [];

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        fields.push(`\`${key}\` = ?`);
        if (typeof updates[key] === 'boolean') {
          values.push(updates[key] ? 1 : 0);
        } else {
          values.push(updates[key]);
        }
      }
    }

    if (fields.length > 0) {
      await query(`UPDATE laboratory_settings SET ${fields.join(', ')}`, values);
    }

    const rows = await query<any[]>('SELECT * FROM laboratory_settings LIMIT 1');
    return res.json(rows[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update laboratory settings' });
  }
});

export default router;
