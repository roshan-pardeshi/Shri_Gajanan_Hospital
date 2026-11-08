import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { query, withTransaction } from '../db';
import { optionalAuth, authenticateToken, requireAdmin } from '../middleware/auth';
import { validateName, validateMobile, validateEmail, validateAge, validateRequired } from '../utils/validation';

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

// Helper to format dates cleanly in Asia/Kolkata timezone
function formatToISTDate(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'string') {
    const match = val.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  try {
    const d = new Date(val);
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  } catch {
    return String(val);
  }
}

// GET appointments (Scoped to requester role)
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, status, search, dateScope, date } = req.query;
    const currentUser = req.user;
    const isAdmin = await checkIsAdmin(currentUser?.id);

    let sql = `
      SELECT 
        a.*,
        d.name AS doctor_name,
        d.photo_url AS doctor_photo,
        d.qualifications AS doctor_qualifications,
        s.name AS speciality_name,
        COALESCE(NULLIF(a.patient_name, ''), p.full_name, 'Patient') AS patient_name,
        COALESCE(NULLIF(a.patient_phone, ''), p.mobile_number, '') AS patient_phone,
        COALESCE(NULLIF(a.patient_email, ''), p.email, '') AS patient_email,
        p.age AS patient_age,
        p.gender AS patient_gender
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

    if (date && typeof date === 'string') {
      sql += ` AND a.appointment_date = ?`;
      params.push(date);
    } else if (dateScope === 'today') {
      const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      sql += ` AND a.appointment_date = ?`;
      params.push(todayIST);
    } else if (dateScope === 'previous') {
      const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      sql += ` AND a.appointment_date < ?`;
      params.push(todayIST);
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
      appointment_date: formatToISTDate(r.appointment_date),
      original_appointment_date: formatToISTDate(r.original_appointment_date),
      requested_reschedule_date: formatToISTDate(r.requested_reschedule_date),
      start_time: String(r.start_time).substring(0, 5),
      end_time: String(r.end_time).substring(0, 5),
      requested_reschedule_time: r.requested_reschedule_time ? String(r.requested_reschedule_time).substring(0, 5) : null,
      booking_source: r.booking_source || 'ONLINE',
      patient_age: r.patient_age !== undefined ? r.patient_age : null,
      patient_gender: r.patient_gender !== undefined ? r.patient_gender : null,
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
        COALESCE(p.email, a.patient_email, '') AS patient_email,
        p.age AS patient_age,
        p.gender AS patient_gender
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
      appointment_date: formatToISTDate(apt.appointment_date),
      original_appointment_date: formatToISTDate(apt.original_appointment_date),
      requested_reschedule_date: formatToISTDate(apt.requested_reschedule_date),
      start_time: String(apt.start_time).substring(0, 5),
      end_time: String(apt.end_time).substring(0, 5),
      booking_source: apt.booking_source || 'ONLINE',
      patient_age: apt.patient_age !== undefined ? apt.patient_age : null,
      patient_gender: apt.patient_gender !== undefined ? apt.patient_gender : null,
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

    if (patient_name) {
      const nameCheck = validateName(patient_name, 'Patient full name');
      if (!nameCheck.isValid) {
        return res.status(400).json({ error: nameCheck.error });
      }
    }

    if (patient_phone) {
      const phoneCheck = validateMobile(patient_phone, true);
      if (!phoneCheck.isValid) {
        return res.status(400).json({ error: phoneCheck.error });
      }
    }

    if (patient_email) {
      const emailCheck = validateEmail(patient_email, true);
      if (!emailCheck.isValid) {
        return res.status(400).json({ error: emailCheck.error });
      }
    }

    const reasonCheck = validateRequired(reason_for_visit, 'Reason for visit', 3);
    if (!reasonCheck.isValid) {
      return res.status(400).json({ error: reasonCheck.error });
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
      // Slot is blocked by Pending, Approved, Rescheduled. Completed, Cancelled, and Rejected release the slot.
      const [conflicts]: any = await conn.query(
        `SELECT id FROM appointments 
         WHERE doctor_id = ? 
           AND appointment_date = ? 
           AND start_time = ? 
           AND status NOT IN ('Rejected', 'Cancelled', 'Completed')
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

      // 4. Resolve / Link Patient Profile
      let patientIdToSave: string | null = null;
      if (effectivePatientId) {
        const [userProf]: any = await conn.query('SELECT id FROM profiles WHERE id = ?', [effectivePatientId]);
        if (userProf.length > 0) {
          patientIdToSave = userProf[0].id;
        }
      }

      const cleanPhone = patient_phone ? String(patient_phone).trim() : null;
      const cleanEmail = patient_email ? String(patient_email).trim() : null;
      const cleanName = patient_name ? String(patient_name).trim() : 'Patient';

      if (!patientIdToSave && cleanPhone) {
        const [phoneProf]: any = await conn.query('SELECT id FROM profiles WHERE mobile_number = ? LIMIT 1', [cleanPhone]);
        if (phoneProf.length > 0) {
          patientIdToSave = phoneProf[0].id;
        }
      }

      if (!patientIdToSave && cleanEmail) {
        const [emailProf]: any = await conn.query('SELECT id FROM profiles WHERE email = ? LIMIT 1', [cleanEmail]);
        if (emailProf.length > 0) {
          patientIdToSave = emailProf[0].id;
        }
      }

      // If still not found, create a patient profile in profiles table
      if (!patientIdToSave && (cleanPhone || cleanEmail)) {
        patientIdToSave = crypto.randomUUID();
        const fallbackEmail = cleanEmail || `online.${(cleanPhone || '').replace(/\D/g, '') || Math.floor(100000 + Math.random() * 900000)}@smartcarehospital.org`;
        await conn.query(
          `INSERT INTO profiles (id, email, password_hash, full_name, mobile_number, role)
           VALUES (?, ?, NULL, ?, ?, 'patient')`,
          [patientIdToSave, fallbackEmail, cleanName, cleanPhone]
        );
        await conn.query(
          `INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'patient')`,
          [crypto.randomUUID(), patientIdToSave]
        );
      }

      // 5. Generate reference number
      const dateToken = appointment_date.replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const referenceNumber = `SGH-${dateToken}-${randomSuffix}`;
      const appointmentId = crypto.randomUUID();

      // 6. Insert appointment
      await conn.query(
        `INSERT INTO appointments (
          id, reference_number, patient_id, doctor_id, speciality_id,
          appointment_date, start_time, end_time, reason_for_visit,
          visit_type, status, patient_name, patient_phone, patient_email,
          booking_source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, 'ONLINE')`,
        [
          appointmentId,
          referenceNumber,
          patientIdToSave,
          doctor_id,
          effectiveSpecialityId,
          appointment_date,
          formattedStartTime,
          formattedEndTime,
          reason_for_visit,
          visit_type || 'first_visit',
          cleanName,
          cleanPhone,
          cleanEmail,
        ]
      );

      // 7. Insert audit trail in appointment_history
      await conn.query(
        `INSERT INTO appointment_history (
          id, appointment_id, previous_status, new_status, action_type, changed_by, notes
        ) VALUES (?, ?, NULL, 'Pending', 'created', ?, 'Appointment booked via portal')`,
        [crypto.randomUUID(), appointmentId, patientIdToSave]
      );

      // 8. Create notification for patient
      if (patientIdToSave) {
        await conn.query(
          `INSERT INTO notifications (id, user_id, title, message, type, is_read, reference_id)
           VALUES (?, ?, ?, ?, 'appointment_request', FALSE, ?)`,
          [
            crypto.randomUUID(),
            patientIdToSave,
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

// POST Add Offline / Walk-in Patient Appointment (Admin Only)
router.post('/offline', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      patient_name,
      patient_phone,
      age,
      gender,
      speciality_id,
      doctor_id,
      appointment_date,
      start_time,
      end_time,
      notes,
    } = req.body;

    // 1. Mandatory Fields Validation
    const nameCheck = validateName(patient_name, 'Patient full name');
    if (!nameCheck.isValid) {
      return res.status(400).json({ error: nameCheck.error });
    }
    const cleanName = nameCheck.value!;

    const phoneCheck = validateMobile(patient_phone, true);
    if (!phoneCheck.isValid) {
      return res.status(400).json({ error: phoneCheck.error });
    }
    const cleanPhone = phoneCheck.value!;

    let validatedAge: number | null = null;
    if (age !== undefined && age !== null && age !== '') {
      const ageCheck = validateAge(age, false);
      if (!ageCheck.isValid) {
        return res.status(400).json({ error: ageCheck.error });
      }
      validatedAge = ageCheck.value ?? null;
    }

    let validGender: string | null = null;
    if (gender) {
      const allowedGenders = ['Male', 'Female', 'Other', 'Prefer not to say'];
      if (!allowedGenders.includes(gender)) {
        return res.status(400).json({ error: 'Please select a valid gender option.' });
      }
      validGender = gender;
    }

    if (!speciality_id || !doctor_id || !appointment_date || !start_time) {
      return res.status(400).json({ error: 'Speciality, doctor, appointment date, and time slot are required.' });
    }

    const formattedStartTime = start_time.length === 5 ? `${start_time}:00` : start_time;

    // Execute atomic booking transaction
    const newAppointment = await withTransaction(async (conn) => {
      // 2. Validate Doctor
      const [docs]: any = await conn.query(
        'SELECT id, name, speciality_id, slot_duration_minutes, working_hours_start, working_hours_end, is_active FROM doctors WHERE id = ?',
        [doctor_id]
      );
      if (docs.length === 0 || docs[0].is_active === false) {
        throw new Error('Selected doctor is inactive or not found.');
      }
      const doctor = docs[0];

      // 3. Check doctor leave dates
      const [leaves]: any = await conn.query(
        'SELECT id FROM doctor_leave_dates WHERE doctor_id = ? AND leave_date = ?',
        [doctor_id, appointment_date]
      );
      if (leaves.length > 0) {
        throw new Error(`Dr. ${doctor.name} is on approved leave on ${appointment_date}. Please choose another date or doctor.`);
      }

      // 4. Lock & Check for conflicting active appointment on the exact doctor slot
      // Slot is blocked by Pending, Approved, Rescheduled. Completed, Cancelled, and Rejected release the slot.
      const [conflicts]: any = await conn.query(
        `SELECT id, reference_number FROM appointments 
         WHERE doctor_id = ? 
           AND appointment_date = ? 
           AND start_time = ? 
           AND status NOT IN ('Rejected', 'Cancelled', 'Completed')
         FOR UPDATE`,
        [doctor_id, appointment_date, formattedStartTime]
      );

      if (conflicts.length > 0) {
        throw new Error(`This time slot (${start_time}) is already booked for Dr. ${doctor.name}. Please select an available slot.`);
      }

      // 5. Calculate end time
      let formattedEndTime = end_time;
      if (!formattedEndTime) {
        const [h, m] = start_time.split(':').map(Number);
        const duration = doctor.slot_duration_minutes || 30;
        const totalM = h * 60 + m + duration;
        const endH = String(Math.floor(totalM / 60)).padStart(2, '0');
        const endM = String(totalM % 60).padStart(2, '0');
        formattedEndTime = `${endH}:${endM}:00`;
      } else if (formattedEndTime.length === 5) {
        formattedEndTime = `${formattedEndTime}:00`;
      }

      // 6. Patient Record Handling (Lookup existing or Create)
      let patientId: string | null = null;
      let patientEmail: string | null = null;
      const parsedAge = validatedAge;

      // Look up existing patient profile by mobile number
      const [existingProfiles]: any = await conn.query(
        'SELECT id, email, full_name, age, gender FROM profiles WHERE mobile_number = ? LIMIT 1',
        [cleanPhone]
      );

      if (existingProfiles.length > 0) {
        patientId = existingProfiles[0].id;
        patientEmail = existingProfiles[0].email;
        if (parsedAge !== null || validGender !== null) {
          await conn.query(
            'UPDATE profiles SET age = COALESCE(?, age), gender = COALESCE(?, gender) WHERE id = ?',
            [parsedAge, validGender, patientId]
          );
        }
      } else {
        patientId = crypto.randomUUID();
        const digitsOnly = cleanPhone.replace(/\D/g, '');
        patientEmail = `walkin.${digitsOnly}@smartcarehospital.org`;

        const [emailConflict]: any = await conn.query('SELECT id FROM profiles WHERE email = ?', [patientEmail]);
        if (emailConflict.length > 0) {
          patientEmail = `walkin.${digitsOnly}.${Math.floor(100 + Math.random() * 900)}@smartcarehospital.org`;
        }

        await conn.query(
          `INSERT INTO profiles (id, email, password_hash, full_name, mobile_number, age, gender, role)
           VALUES (?, ?, NULL, ?, ?, ?, ?, 'patient')`,
          [patientId, patientEmail, cleanName, cleanPhone, parsedAge, validGender]
        );

        await conn.query(
          `INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'patient')`,
          [crypto.randomUUID(), patientId]
        );
      }

      // 7. Generate Reference Number
      const dateToken = appointment_date.replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const referenceNumber = `SGH-${dateToken}-${randomSuffix}`;
      const appointmentId = crypto.randomUUID();

      // 8. Insert Appointment with booking_source = 'OFFLINE'
      const reasonText = notes && notes.trim().length > 0 ? notes.trim() : 'Walk-in / Offline Consultation';
      await conn.query(
        `INSERT INTO appointments (
          id, reference_number, patient_id, doctor_id, speciality_id,
          appointment_date, start_time, end_time, reason_for_visit,
          visit_type, status, patient_name, patient_phone, patient_email,
          booking_source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'first_visit', 'Pending', ?, ?, ?, 'OFFLINE')`,
        [
          appointmentId,
          referenceNumber,
          patientId,
          doctor_id,
          speciality_id,
          appointment_date,
          formattedStartTime,
          formattedEndTime,
          reasonText,
          cleanName,
          cleanPhone,
          patientEmail,
        ]
      );

      // 9. Insert Audit Trail
      await conn.query(
        `INSERT INTO appointment_history (
          id, appointment_id, previous_status, new_status, action_type, changed_by, notes
        ) VALUES (?, ?, NULL, 'Pending', 'created', ?, 'Walk-in offline appointment created by administrator')`,
        [crypto.randomUUID(), appointmentId, req.user?.id || null]
      );

      // 10. Notification for Admin Desk
      await conn.query(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, reference_id)
         VALUES (?, NULL, 'Walk-in Offline Patient Registered', ?, 'appointment_request', FALSE, ?)`,
        [
          crypto.randomUUID(),
          `Offline walk-in registered for ${cleanName} with Dr. ${doctor.name} (${referenceNumber}) on ${appointment_date} at ${start_time}.`,
          appointmentId,
        ]
      );

      return {
        id: appointmentId,
        reference_number: referenceNumber,
        patient_id: patientId,
        patient_name: cleanName,
        patient_phone: cleanPhone,
        patient_email: patientEmail,
        patient_age: parsedAge,
        patient_gender: validGender,
        doctor_id,
        doctor_name: doctor.name,
        speciality_id,
        appointment_date,
        start_time: start_time.substring(0, 5),
        end_time: formattedEndTime.substring(0, 5),
        reason_for_visit: reasonText,
        visit_type: 'first_visit',
        status: 'Pending',
        booking_source: 'OFFLINE',
        created_at: new Date().toISOString(),
      };
    });

    return res.status(201).json(newAppointment);
  } catch (err: any) {
    console.error('addOfflineAppointment error:', err);
    return res.status(500).json({ error: err.message || 'Failed to add offline appointment.' });
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
           AND status NOT IN ('Rejected', 'Cancelled', 'Completed')`,
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
