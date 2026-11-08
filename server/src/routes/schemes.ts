import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { query } from '../db';
import { optionalAuth, authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// GET all schemes
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { includeUnpublished } = req.query;

    let sql = 'SELECT * FROM health_schemes WHERE 1=1';
    if (includeUnpublished !== 'true') {
      sql += ' AND is_published = TRUE';
    }
    sql += ' ORDER BY name ASC';

    const rows = await query<any[]>(sql);

    const formatted = rows.map(s => ({
      ...s,
      eligibility_criteria: typeof s.eligibility_criteria === 'string' ? JSON.parse(s.eligibility_criteria) : (s.eligibility_criteria || []),
      benefits: typeof s.benefits === 'string' ? JSON.parse(s.benefits) : (s.benefits || []),
      required_documents: typeof s.required_documents === 'string' ? JSON.parse(s.required_documents) : (s.required_documents || []),
      is_published: Boolean(s.is_published),
      last_verified_date: s.last_verified_date ? new Date(s.last_verified_date).toISOString().split('T')[0] : s.last_verified_date,
    }));

    return res.json(formatted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch health schemes' });
  }
});

// GET scheme by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rows = await query<any[]>('SELECT * FROM health_schemes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Scheme not found' });
    }
    const s = rows[0];
    return res.json({
      ...s,
      eligibility_criteria: typeof s.eligibility_criteria === 'string' ? JSON.parse(s.eligibility_criteria) : (s.eligibility_criteria || []),
      benefits: typeof s.benefits === 'string' ? JSON.parse(s.benefits) : (s.benefits || []),
      required_documents: typeof s.required_documents === 'string' ? JSON.parse(s.required_documents) : (s.required_documents || []),
      is_published: Boolean(s.is_published),
      last_verified_date: s.last_verified_date ? new Date(s.last_verified_date).toISOString().split('T')[0] : s.last_verified_date,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch health scheme' });
  }
});

// Admin: Add Scheme
router.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      name,
      code,
      category,
      description,
      coverage_amount,
      eligibility_criteria,
      benefits,
      required_documents,
      how_to_apply,
      official_url,
      hospital_acceptance_status,
      last_verified_date,
      official_source,
      is_published,
      helpline_number,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Health scheme name is required.' });
    }

    const id = crypto.randomUUID();

    await query(
      `INSERT INTO health_schemes (
        id, name, code, category, description, coverage_amount,
        eligibility_criteria, benefits, required_documents, how_to_apply,
        official_url, hospital_acceptance_status, last_verified_date,
        official_source, is_published, helpline_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        code,
        category,
        description,
        coverage_amount,
        JSON.stringify(eligibility_criteria || []),
        JSON.stringify(benefits || []),
        JSON.stringify(required_documents || []),
        how_to_apply || '',
        official_url || '',
        hospital_acceptance_status || 'Accepted',
        last_verified_date || new Date().toISOString().split('T')[0],
        official_source || '',
        is_published !== false ? 1 : 0,
        helpline_number || null,
      ]
    );

    const created = await query<any[]>('SELECT * FROM health_schemes WHERE id = ?', [id]);
    return res.status(201).json(created[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to add health scheme' });
  }
});

// Admin: Update Scheme
router.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowed = [
      'name',
      'code',
      'category',
      'description',
      'coverage_amount',
      'eligibility_criteria',
      'benefits',
      'required_documents',
      'how_to_apply',
      'official_url',
      'hospital_acceptance_status',
      'last_verified_date',
      'official_source',
      'is_published',
      'helpline_number',
    ];

    const fields: string[] = [];
    const values: any[] = [];

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        fields.push(`\`${key}\` = ?`);
        if (['eligibility_criteria', 'benefits', 'required_documents'].includes(key)) {
          values.push(JSON.stringify(updates[key]));
        } else if (key === 'is_published') {
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
    await query(`UPDATE health_schemes SET ${fields.join(', ')} WHERE id = ?`, values);

    const rows = await query<any[]>('SELECT * FROM health_schemes WHERE id = ?', [id]);
    return res.json(rows[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update health scheme' });
  }
});

// Admin: Delete Scheme
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Valid scheme ID is required' });
    }

    // 1. Verify scheme exists in database
    const existing = await query<any[]>('SELECT id, name FROM health_schemes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Health scheme not found or already deleted' });
    }

    // 2. Check relational references in database foreign keys
    try {
      const fkUsage = await query<any[]>(
        `SELECT TABLE_NAME, COLUMN_NAME 
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE REFERENCED_TABLE_NAME = 'health_schemes' 
           AND TABLE_SCHEMA = DATABASE()`
      );

      for (const fk of fkUsage) {
        const rows = await query<any[]>(
          `SELECT COUNT(*) as count FROM \`${fk.TABLE_NAME}\` WHERE \`${fk.COLUMN_NAME}\` = ?`,
          [id]
        );
        if (rows[0]?.count > 0) {
          return res.status(409).json({
            error: `This health scheme cannot be permanently deleted because it has associated records in ${fk.TABLE_NAME}. You can mark it 'Not Empanelled' or 'Under Verification' instead.`
          });
        }
      }
    } catch (schemaErr) {
      console.warn('Foreign key inspection warning:', schemaErr);
    }

    // 3. Check potential historical application or patient eligibility records
    try {
      const checkTables = ['scheme_applications', 'patient_schemes', 'patient_eligibility_records', 'scheme_eligibility'];
      for (const tableName of checkTables) {
        const hasTable = await query<any[]>(
          `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
          [tableName]
        );
        if (hasTable.length > 0) {
          const refs = await query<any[]>(`SELECT COUNT(*) as count FROM \`${tableName}\` WHERE scheme_id = ?`, [id]);
          if (refs[0]?.count > 0) {
            return res.status(409).json({
              error: 'This health scheme cannot be permanently deleted because it has associated historical patient or application records. You can archive or mark it Under Verification instead.'
            });
          }
        }
      }
    } catch (tblErr) {
      console.warn('Table reference inspection warning:', tblErr);
    }

    // 4. Safe delete
    await query('DELETE FROM health_schemes WHERE id = ?', [id]);
    return res.json({ success: true, message: `Health scheme "${existing[0].name}" deleted successfully` });
  } catch (err: any) {
    if (err.errno === 1451 || err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({
        error: 'This health scheme is referenced by existing patient records and cannot be permanently deleted. You can mark it Under Verification or unpublish it instead.'
      });
    }
    return res.status(500).json({ error: err.message || 'Failed to delete health scheme' });
  }
});

export default router;
