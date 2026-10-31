import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { query } from '../db';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// GET all doctors (with joined speciality name)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { specialityId, query: searchQuery, includeInactive } = req.query;

    let sql = `
      SELECT 
        d.*,
        s.name AS speciality_name
      FROM doctors d
      LEFT JOIN specialities s ON d.speciality_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (includeInactive !== 'true') {
      sql += ` AND d.is_active = TRUE`;
    }

    if (specialityId && typeof specialityId === 'string') {
      sql += ` AND d.speciality_id = ?`;
      params.push(specialityId);
    }

    if (searchQuery && typeof searchQuery === 'string') {
      sql += ` AND (d.name LIKE ? OR s.name LIKE ? OR d.qualifications LIKE ?)`;
      const term = `%${searchQuery.trim()}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY d.rating DESC, d.name ASC`;

    const doctors = await query<any[]>(sql, params);

    // Parse JSON fields if necessary
    const formatted = doctors.map(d => ({
      ...d,
      working_days: typeof d.working_days === 'string' ? JSON.parse(d.working_days) : (d.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
      consultation_fee: Number(d.consultation_fee),
      rating: Number(d.rating),
      is_active: Boolean(d.is_active),
    }));

    return res.json(formatted);
  } catch (err: any) {
    console.error('getDoctors error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch doctors' });
  }
});

// GET doctor by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctors = await query<any[]>(
      `SELECT d.*, s.name AS speciality_name
       FROM doctors d
       LEFT JOIN specialities s ON d.speciality_id = s.id
       WHERE d.id = ?`,
      [id]
    );

    if (doctors.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const d = doctors[0];
    return res.json({
      ...d,
      working_days: typeof d.working_days === 'string' ? JSON.parse(d.working_days) : (d.working_days || []),
      consultation_fee: Number(d.consultation_fee),
      rating: Number(d.rating),
      is_active: Boolean(d.is_active),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch doctor' });
  }
});

// GET available time slots for doctor on date
router.get('/:id/slots', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dateStr = req.query.date as string;

    if (!dateStr) {
      return res.status(400).json({ error: 'Date query parameter is required (YYYY-MM-DD)' });
    }

    // 1. Check if doctor is on leave
    const leaves = await query<any[]>(
      'SELECT id FROM doctor_leave_dates WHERE doctor_id = ? AND leave_date = ?',
      [id, dateStr]
    );

    if (leaves.length > 0) {
      return res.json({ onLeave: true, slots: [] });
    }

    // 2. Fetch doctor working hours
    const docRows = await query<any[]>('SELECT * FROM doctors WHERE id = ?', [id]);
    if (docRows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const doctor = docRows[0];
    const duration = doctor.slot_duration_minutes || 30;
    const startStr = doctor.working_hours_start || '09:00:00';
    const endStr = doctor.working_hours_end || '17:00:00';

    // 3. Fetch active booked appointments on this date
    const bookedRows = await query<any[]>(
      `SELECT start_time FROM appointments
       WHERE doctor_id = ? 
         AND appointment_date = ? 
         AND status NOT IN ('Rejected', 'Cancelled')`,
      [id, dateStr]
    );

    const bookedTimes = new Set(
      bookedRows.map((r: any) => {
        const timeVal = String(r.start_time);
        return timeVal.substring(0, 5); // "HH:MM"
      })
    );

    // 4. Generate slots
    const slots: { time: string; isBooked: boolean; isPast: boolean }[] = [];
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isToday = dateStr === todayStr;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let cursor = startH * 60 + startM;
    const endLimit = endH * 60 + endM;

    while (cursor + duration <= endLimit) {
      const h = Math.floor(cursor / 60);
      const m = cursor % 60;
      const timeFormatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      const isBooked = bookedTimes.has(timeFormatted);
      const isPast = isToday && cursor <= currentMinutes;

      slots.push({
        time: timeFormatted,
        isBooked,
        isPast,
      });

      cursor += duration;
    }

    return res.json({ onLeave: false, slots });
  } catch (err: any) {
    console.error('getSlots error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch doctor slots' });
  }
});

// Admin: Add Doctor
router.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      name,
      speciality_id,
      qualifications,
      experience_years,
      bio,
      consultation_fee,
      photo_url,
      availability_status,
      slot_duration_minutes,
      working_hours_start,
      working_hours_end,
      working_days,
    } = req.body;

    if (!name || !speciality_id || !qualifications) {
      return res.status(400).json({ error: 'Name, speciality, and qualifications are required' });
    }

    const doctorId = crypto.randomUUID();

    await query(
      `INSERT INTO doctors (
        id, name, speciality_id, qualifications, experience_years, bio, consultation_fee,
        photo_url, availability_status, slot_duration_minutes, working_hours_start,
        working_hours_end, working_days, rating, review_count, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 4.90, 0, TRUE)`,
      [
        doctorId,
        name,
        speciality_id,
        qualifications,
        experience_years || 1,
        bio || '',
        consultation_fee || 500,
        photo_url || null,
        availability_status || 'Available',
        slot_duration_minutes || 30,
        working_hours_start || '09:00:00',
        working_hours_end || '17:00:00',
        JSON.stringify(working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
      ]
    );

    const doc = await query<any[]>(
      `SELECT d.*, s.name AS speciality_name
       FROM doctors d
       LEFT JOIN specialities s ON d.speciality_id = s.id
       WHERE d.id = ?`,
      [doctorId]
    );

    return res.status(201).json(doc[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to add doctor' });
  }
});

// Admin: Update Doctor
router.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'name',
      'speciality_id',
      'qualifications',
      'experience_years',
      'bio',
      'consultation_fee',
      'photo_url',
      'availability_status',
      'slot_duration_minutes',
      'working_hours_start',
      'working_hours_end',
      'working_days',
      'is_active',
    ];

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        fieldsToUpdate.push(`\`${key}\` = ?`);
        if (key === 'working_days' && Array.isArray(updates[key])) {
          values.push(JSON.stringify(updates[key]));
        } else {
          values.push(updates[key]);
        }
      }
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: 'No valid update fields provided' });
    }

    values.push(id);
    await query(`UPDATE doctors SET ${fieldsToUpdate.join(', ')} WHERE id = ?`, values);

    const doc = await query<any[]>(
      `SELECT d.*, s.name AS speciality_name
       FROM doctors d
       LEFT JOIN specialities s ON d.speciality_id = s.id
       WHERE d.id = ?`,
      [id]
    );

    return res.json(doc[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update doctor' });
  }
});

// Admin: Soft Delete Doctor
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query('UPDATE doctors SET is_active = FALSE WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Doctor deactivated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete doctor' });
  }
});

export default router;
