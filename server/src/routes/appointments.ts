import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { query, withTransaction } from '../db';
import { optionalAuth, authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Helper to check if requester is admin
async function checkIsAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false;
  const rows = await query<any[]>(
    `SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin'
     UNION
     SELECT 1 FROM profiles WHERE id = ? AND role = 'admin'`,
    [userId, userId]
  );
  return rows.length > 0;
}

// GET appointments (Scoped to requester role)
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, status, search } = req.query;
    const currentUser = req.user;
    const isAdmin = await checkIsAdmin(currentUser?.id);

    let sql = `
      SELECT 
        a.*,
        d.name AS doctor_name,
        d.photo_url AS doctor_photo,
        d.qualifications AS doctor_qualifications,
        s.name AS speciality_name,
        COALESCE(p.full_name, a.patient_name, 'Patient') AS patient_name,
        COALESCE(p.mobile_number, a.patient_phone, '') AS patient_phone,
        COALESCE(p.email, a.patient_email, '') AS patient_email
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN specialities s ON a.speciality_id = s.id
      LEFT JOIN profiles p ON a.patient_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Security Scoping:
    // If NOT an admin, patients can ONLY see their own records.
    if (!isAdmin) {
      if (!currentUser?.id && !patientId) {
        // Unauthenticated guest cannot view arbitrary appointment lists
        return res.json([]);
      }
      const targetUserId = currentUser?.id || (patientId as string);
      sql += ` AND (a.patient_id = ? OR a.patient_email = ?)`;
      params.push(targetUserId, currentUser?.email || '');
    } else {
      // Admin may filter by patientId or doctorId
      if (patientId && typeof patientId === 'string') {
        sql += ` AND a.patient_id = ?`;
        params.push(patientId);
      }
      if (doctorId && typeof doctorId === 'string') {
        sql += ` AND a.doctor_id = ?`;
        params.push(doctorId);
      }
    }

    if (status && typeof status === 'string' && status !== 'all') {
      sql += ` AND a.status = ?`;
      params.push(status);
    }

    if (search && typeof search === 'string') {
      sql += ` AND (a.reference_number LIKE ? OR d.name LIKE ? OR a.patient_name LIKE ? OR a.patient_phone LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY a.appointment_date DESC, a.start_time DESC`;

    const rows = await query<any[]>(sql, params);

    // Format dates & times cleanly for frontend
    const formatted = rows.map(r => ({
      ...r,
      appointment_date: r.appointment_date ? new Date(r.appointment_date).toISOString().split('T')[0] : r.appointment_date,
      original_appointment_date: r.original_appointment_date ? new Date(r.original_appointment_date).toISOString().split('T')[0] : r.original_appointment_date,
      requested_reschedule_date: r.requested_reschedule_date ? new Date(r.requested_reschedule_date).toISOString().split('T')[0] : r.requested_reschedule_date,
      start_time: String(r.start_time).substring(0, 5),
      end_time: String(r.end_time).substring(0, 5),
      requested_reschedule_time: r.requested_reschedule_time ? String(r.requested_reschedule_time).substring(0, 5) : null,
    }));

    return res.json(formatted);
  } catch (err: any) {
    console.error('getAppointments error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch appointments' });
  }
});

// GET single appointment by ID
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const isAdmin = await checkIsAdmin(currentUser?.id);

    const rows = await query<any[]>(
      `SELECT 
        a.*,
        d.name AS doctor_name,
        d.photo_url AS doctor_photo,
        d.qualifications AS doctor_qualifications,
        s.name AS speciality_name,
        COALESCE(p.full_name, a.patient_name, 'Patient') AS patient_name,
        COALESCE(p.mobile_number, a.patient_phone, '') AS patient_phone,
        COALESCE(p.email, a.patient_email, '') AS patient_email
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN specialities s ON a.speciality_id = s.id
      LEFT JOIN profiles p ON a.patient_id = p.id
      WHERE a.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const apt = rows[0];

    // Enforce patient privacy: only admin or the patient who owns the booking can view it
    if (!isAdmin && currentUser) {
      if (apt.patient_id && apt.patient_id !== currentUser.id && apt.patient_email !== currentUser.email) {
        return res.status(403).json({ error: 'Unauthorized to view this appointment' });
      }
    }

    return res.json({
      ...apt,
      appointment_date: apt.appointment_date ? new Date(apt.appointment_date).toISOString().split('T')[0] : apt.appointment_date,
      start_time: String(apt.start_time).substring(0, 5),
      end_time: String(apt.end_time).substring(0, 5),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch appointment' });
  }
});

// POST book appointment (Transaction-safe with conflict and leave checks)
router.post('/book', optionalAuth, async (req: Request, res: Response) => {
  try {
    const {
      doctor_id,
      speciality_id,
      appointment_date,
      start_time,
      end_time,
      reason_for_visit,
      visit_type,
      patient_id,
      patient_name,
      patient_phone,
      patient_email,
    } = req.body;

    if (!doctor_id || !appointment_date || !start_time || !reason_for_visit) {
      return res.status(400).json({ error: 'Missing mandatory appointment booking details.' });
    }

    const effectivePatientId = req.user?.id || patient_id || null;
    const formattedStartTime = start_time.length === 5 ? `${start_time}:00` : start_time;
    const formattedEndTime = (end_time || '').length === 5 ? `${end_time}:00` : (end_time || '10:00:00');

    // Execute atomic booking transaction
    const newAppointment = await withTransaction(async (conn) => {
      // 1. Check if doctor is on leave
      const [leaves]: any = await conn.query(
        'SELECT id FROM doctor_leave_dates WHERE doctor_id = ? AND leave_date = ?',
        [doctor_id, appointment_date]
      );
      if (leaves.length > 0) {
        throw new Error('Doctor is on leave on the selected date. Please choose another date.');
      }

      // 2. Lock & Check for conflicting active appointment on the exact doctor slot
      const [conflicts]: any = await conn.query(
        `SELECT id FROM appointments 
         WHERE doctor_id = ? 
           AND appointment_date = ? 
           AND start_time = ? 
           AND status NOT IN ('Rejected', 'Cancelled')
         FOR UPDATE`,
        [doctor_id, appointment_date, formattedStartTime]
      );

      if (conflicts.length > 0) {
        throw new Error('This time slot is already booked. Please choose another slot.');
      }

      // 3. Resolve speciality if not provided
      let effectiveSpecialityId = speciality_id;
      if (!effectiveSpecialityId) {
        const [docs]: any = await conn.query('SELECT speciality_id FROM doctors WHERE id = ?', [doctor_id]);
        if (docs.length > 0) {
          effectiveSpecialityId = docs[0].speciality_id;
        }
      }

      // 4. Generate reference number
      const dateToken = appointment_date.replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const referenceNumber = `SGH-${dateToken}-${randomSuffix}`;
      const appointmentId = crypto.randomUUID();

      // 5. Insert appointment
      await conn.query(
        `INSERT INTO appointments (
          id, reference_number, patient_id, doctor_id, speciality_id,
          appointment_date, start_time, end_time, reason_for_visit,
          visit_type, status, patient_name, patient_phone, patient_email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?)`,
        [
          appointmentId,
          referenceNumber,
          effectivePatientId,
          doctor_id,
          effectiveSpecialityId,
          appointment_date,
          formattedStartTime,
          formattedEndTime,
          reason_for_visit,
          visit_type || 'first_visit',
          patient_name || null,
          patient_phone || null,
          patient_email || null,
        ]
      );

      // 6. Insert audit trail in appointment_history
      await conn.query(
        `INSERT INTO appointment_history (
          id, appointment_id, previous_status, new_status, action_type, changed_by, notes
        ) VALUES (?, ?, NULL, 'Pending', 'created', ?, 'Appointment booked via portal')`,
        [crypto.randomUUID(), appointmentId, effectivePatientId]
      );

      // 7. Create notification
      if (effectivePatientId) {
        await conn.query(
          `INSERT INTO notifications (id, user_id, title, message, type, is_read, reference_id)
           VALUES (?, ?, ?, ?, 'appointment_request', FALSE, ?)`,
          [
            crypto.randomUUID(),
            effectivePatientId,
            'Appointment Booking Received',
            `Your appointment request (${referenceNumber}) has been received and is pending confirmation.`,
            appointmentId,
          ]
        );
      }

      // Notification for Hospital Administrator
      await conn.query(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, reference_id)
         VALUES (?, NULL, ?, ?, 'appointment_request', FALSE, ?)`,
        [
          crypto.randomUUID(),
          'New Appointment Booking Request',
          `New appointment request (${referenceNumber}) received for ${patient_name || 'Patient'} on ${appointment_date} at ${start_time}.`,
          appointmentId,
        ]
      );

      // Fetch newly created record with joins
      const [rows]: any = await conn.query(
        `SELECT 
          a.*,
          d.name AS doctor_name,
          d.photo_url AS doctor_photo,
          s.name AS speciality_name
        FROM appointments a
        LEFT JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN specialities s ON a.speciality_id = s.id
        WHERE a.id = ?`,
        [appointmentId]
      );

      return rows[0];
    });

    return res.status(201).json(newAppointment);
  } catch (err: any) {
    console.error('bookAppointment error:', err);
    return res.status(400).json({ error: err.message || 'Failed to book appointment' });
  }
});

// PUT reschedule appointment
router.put('/:id/reschedule', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newDate, newTime, reason } = req.body;
    const currentUser = req.user;
    const isAdmin = await checkIsAdmin(currentUser?.id);

    const formattedTime = newTime.length === 5 ? `${newTime}:00` : newTime;

    const updated = await withTransaction(async (conn) => {
      const [apts]: any = await conn.query('SELECT * FROM appointments WHERE id = ?', [id]);
      if (apts.length === 0) {
        throw new Error('Appointment not found');
      }
      const apt = apts[0];

      // Check conflict on requested slot
      const [conflicts]: any = await conn.query(
        `SELECT id FROM appointments 
         WHERE doctor_id = ? 
           AND appointment_date = ? 
           AND start_time = ? 
           AND id != ?
           AND status NOT IN ('Rejected', 'Cancelled')`,
        [apt.doctor_id, newDate, formattedTime, id]
      );

      if (conflicts.length > 0) {
        throw new Error('The requested time slot is already occupied. Please pick another slot.');
      }

      if (isAdmin) {
        // Direct reschedule approval by administrator
        await conn.query(
          `UPDATE appointments
           SET original_appointment_date = COALESCE(original_appointment_date, appointment_date),
               original_start_time = COALESCE(original_start_time, start_time),
               appointment_date = ?,
               start_time = ?,
               status = 'Rescheduled',
               requested_reschedule_date = NULL,
               requested_reschedule_time = NULL,
               reschedule_reason = ?,
               updated_at = NOW()
           WHERE id = ?`,
          [newDate, formattedTime, reason || null, id]
        );

        await conn.query(
          `INSERT INTO appointment_history (id, appointment_id, previous_status, new_status, action_type, changed_by, notes)
           VALUES (?, ?, ?, 'Rescheduled', 'rescheduled', ?, ?)`,
          [crypto.randomUUID(), id, apt.status, currentUser?.id || null, `Rescheduled by admin: ${reason || 'Approved'}`]
        );
      } else {
        // Patient request for rescheduling
        await conn.query(
          `UPDATE appointments
           SET status = 'Reschedule Requested',
               requested_reschedule_date = ?,
               requested_reschedule_time = ?,
               reschedule_reason = ?,
               updated_at = NOW()
           WHERE id = ?`,
          [newDate, formattedTime, reason || 'Patient requested new time', id]
        );

        await conn.query(
          `INSERT INTO appointment_history (id, appointment_id, previous_status, new_status, action_type, changed_by, notes)
           VALUES (?, ?, ?, 'Reschedule Requested', 'reschedule_requested', ?, ?)`,
          [crypto.randomUUID(), id, apt.status, currentUser?.id || null, reason || 'Patient requested reschedule']
        );

        // Notification for Hospital Administrator
        await conn.query(
          `INSERT INTO notifications (id, user_id, title, message, type, is_read, reference_id)
           VALUES (?, NULL, 'Appointment Reschedule Request', ?, 'reschedule_request', FALSE, ?)`,
          [
            crypto.randomUUID(),
            `Patient requested rescheduling for appointment ${apt.reference_number} to ${newDate} at ${formattedTime}.`,
            id,
          ]
        );
      }

      const [resRows]: any = await conn.query(
        `SELECT a.*, d.name AS doctor_name, s.name AS speciality_name
         FROM appointments a
         LEFT JOIN doctors d ON a.doctor_id = d.id
         LEFT JOIN specialities s ON a.speciality_id = s.id
         WHERE a.id = ?`,
        [id]
      );

      return resRows[0];
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to reschedule appointment' });
  }
});

// PUT cancel appointment
router.put('/:id/cancel', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const currentUser = req.user;

    const cancelled = await withTransaction(async (conn) => {
      const [apts]: any = await conn.query('SELECT * FROM appointments WHERE id = ?', [id]);
      if (apts.length === 0) {
        throw new Error('Appointment not found');
      }
      const apt = apts[0];

      await conn.query(
        `UPDATE appointments
         SET status = 'Cancelled',
             cancellation_reason = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [reason || 'Cancelled by patient', id]
      );

      await conn.query(
        `INSERT INTO appointment_history (id, appointment_id, previous_status, new_status, action_type, changed_by, notes)
         VALUES (?, ?, ?, 'Cancelled', 'cancelled', ?, ?)`,
        [crypto.randomUUID(), id, apt.status, currentUser?.id || null, reason || 'Appointment cancelled']
      );

      // Notification for Hospital Administrator
      await conn.query(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, reference_id)
         VALUES (?, NULL, 'Appointment Cancelled', ?, 'appointment_cancelled', FALSE, ?)`,
        [
          crypto.randomUUID(),
          `Appointment ${apt.reference_number} was cancelled. Reason: ${reason || 'Cancelled by patient'}.`,
          id,
        ]
      );

      const [resRows]: any = await conn.query('SELECT * FROM appointments WHERE id = ?', [id]);
      return resRows[0];
    });

    return res.json(cancelled);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to cancel appointment' });
  }
});

// PUT update status (Admin only: Approved, Rejected, Completed)
router.put('/:id/status', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason, notes } = req.body;
    const adminId = req.user!.id;

    const validStatuses = ['Pending', 'Approved', 'Rejected', 'Reschedule Requested', 'Rescheduled', 'Cancelled', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    const updated = await withTransaction(async (conn) => {
      const [apts]: any = await conn.query('SELECT * FROM appointments WHERE id = ?', [id]);
      if (apts.length === 0) {
        throw new Error('Appointment not found');
      }
      const apt = apts[0];

      await conn.query(
        `UPDATE appointments
         SET status = ?,
             rejection_reason = COALESCE(?, rejection_reason),
             updated_at = NOW()
         WHERE id = ?`,
        [status, rejection_reason || null, id]
      );

      await conn.query(
        `INSERT INTO appointment_history (id, appointment_id, previous_status, new_status, action_type, changed_by, notes)
         VALUES (?, ?, ?, ?, 'status_change', ?, ?)`,
        [crypto.randomUUID(), id, apt.status, status, adminId, notes || `Status changed to ${status}`]
      );

      // Create notification for patient
      if (apt.patient_id) {
        await conn.query(
          `INSERT INTO notifications (id, user_id, title, message, type, is_read, reference_id)
           VALUES (?, ?, ?, ?, ?, FALSE, ?)`,
          [
            crypto.randomUUID(),
            apt.patient_id,
            `Appointment ${status}`,
            `Your appointment ${apt.reference_number} has been updated to "${status}".`,
            status === 'Approved' ? 'appointment_approved' : status === 'Rejected' ? 'appointment_rejected' : 'general',
            id,
          ]
        );
      }

      const [resRows]: any = await conn.query(
        `SELECT a.*, d.name AS doctor_name, s.name AS speciality_name
         FROM appointments a
         LEFT JOIN doctors d ON a.doctor_id = d.id
         LEFT JOIN specialities s ON a.speciality_id = s.id
         WHERE a.id = ?`,
        [id]
      );
      return resRows[0];
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update appointment status' });
  }
});

export default router;
