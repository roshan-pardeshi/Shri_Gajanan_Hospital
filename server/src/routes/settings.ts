import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateEmail, validatePincode } from '../utils/validation';

const router = Router();

// GET hospital settings
router.get('/', async (_req: Request, res: Response) => {
  try {
    const rows = await query<any[]>('SELECT * FROM hospital_settings LIMIT 1');
    if (rows.length === 0) {
      return res.json({
        hospital_name: 'SmartCare Hospital - Shri Gajanan Multispeciality',
        tagline: 'Excellence in Healthcare, Compassion in Healing',
        phone: '+91 22 2845 6789',
        emergency_helpline: '+91 22 2845 9999',
        email: 'contact@smartcarehospital.org',
        address: 'Plot No. 42, Station Road, Near Gajanan Maharaj Mandir, Borivali West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400092',
        operating_hours: '24 Hours Emergency | OPD: Mon - Sat: 08:00 AM - 08:00 PM',
        slot_duration_minutes: 30,
        cancellation_window_hours: 4,
        allow_patient_reschedule: true,
        default_appointment_status: 'Pending',
      });
    }

    const s = rows[0];
    return res.json({
      ...s,
      allow_patient_reschedule: Boolean(s.allow_patient_reschedule),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch settings' });
  }
});

// Admin: Update hospital settings
router.put('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const updates = req.body;

    if (updates.email !== undefined && updates.email !== '') {
      const emailCheck = validateEmail(updates.email, false);
      if (!emailCheck.isValid) {
        return res.status(400).json({ error: emailCheck.error });
      }
      updates.email = emailCheck.value!;
    }

    if (updates.pincode !== undefined && updates.pincode !== '') {
      const pinCheck = validatePincode(updates.pincode, false);
      if (!pinCheck.isValid) {
        return res.status(400).json({ error: pinCheck.error });
      }
      updates.pincode = pinCheck.value!;
    }

    const allowed = [
      'hospital_name',
      'tagline',
      'phone',
      'emergency_helpline',
      'email',
      'address',
      'city',
      'state',
      'pincode',
      'operating_hours',
      'slot_duration_minutes',
      'cancellation_window_hours',
      'allow_patient_reschedule',
      'default_appointment_status',
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
      await query(`UPDATE hospital_settings SET ${fields.join(', ')}`, values);
    }

    const rows = await query<any[]>('SELECT * FROM hospital_settings LIMIT 1');
    return res.json(rows[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update hospital settings' });
  }
});

export default router;
