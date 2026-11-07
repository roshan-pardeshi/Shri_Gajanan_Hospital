import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { query } from '../db';
import { optionalAuth, authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Helper to format public patient display name safely (e.g. "Suresh Patil" -> "Suresh P.")
function formatPatientDisplayName(fullName?: string): string {
  if (!fullName || typeof fullName !== 'string') return 'Verified Patient';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

// Helper to sanitize text (strip HTML tags and prevent XSS)
function sanitizeText(str?: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>?/gm, '') // remove HTML tags
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

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

/**
 * GET /api/reviews
 * - Public/Patients: Only returns 'Approved' reviews with privacy-safe patient display names.
 * - Admin: Returns all reviews (Pending, Approved, Rejected) with administrative details & summary metrics.
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { status, doctorId, limit } = req.query;
    const currentUser = req.user;
    const isAdmin = await checkIsAdmin(currentUser?.id);

    let sql = `
      SELECT 
        r.id,
        r.rating,
        r.review_title,
        r.review_message,
        r.status,
        r.created_at,
        r.updated_at,
        r.doctor_id,
        d.name AS doctor_name,
        d.photo_url AS doctor_photo,
        s.name AS speciality_name,
        r.appointment_id,
        a.reference_number AS appointment_reference,
        a.appointment_date,
        p.id AS patient_id,
        p.full_name AS patient_name,
        p.email AS patient_email,
        p.mobile_number AS patient_phone
      FROM patient_reviews r
      INNER JOIN doctors d ON r.doctor_id = d.id
      LEFT JOIN specialities s ON d.speciality_id = s.id
      INNER JOIN profiles p ON r.patient_id = p.id
      INNER JOIN appointments a ON r.appointment_id = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!isAdmin) {
      // Public / Non-admin users ONLY see Approved reviews
      sql += ` AND r.status = 'Approved'`;
    } else {
      // Admin can filter by status if specified
      if (status && typeof status === 'string' && status !== 'all') {
        sql += ` AND r.status = ?`;
        params.push(status);
      }
    }

    if (doctorId && typeof doctorId === 'string') {
      sql += ` AND r.doctor_id = ?`;
      params.push(doctorId);
    }

    sql += ` ORDER BY r.created_at DESC`;

    if (limit && !isNaN(Number(limit))) {
      sql += ` LIMIT ?`;
      params.push(Number(limit));
    }

    const rows = await query<any[]>(sql, params);

    // If Admin, also calculate review statistics
    if (isAdmin) {
      const [statsRows] = await query<any[]>(`
        SELECT 
          COUNT(*) AS total_reviews,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_reviews,
          SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) AS approved_reviews,
          SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_reviews,
          COALESCE(ROUND(AVG(rating), 1), 5.0) AS average_rating
        FROM patient_reviews
      `);

      const stats = statsRows || {
        total_reviews: 0,
        pending_reviews: 0,
        approved_reviews: 0,
        rejected_reviews: 0,
        average_rating: 5.0,
      };

      return res.json({
        reviews: rows,
        stats: {
          total_reviews: Number(stats.total_reviews || 0),
          pending_reviews: Number(stats.pending_reviews || 0),
          approved_reviews: Number(stats.approved_reviews || 0),
          rejected_reviews: Number(stats.rejected_reviews || 0),
          average_rating: Number(stats.average_rating || 5.0),
        },
      });
    }

    // For public visitors: format with safe patient display names and strip private data
    const publicReviews = rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      review_title: r.review_title,
      review_message: r.review_message,
      created_at: r.created_at,
      doctor_id: r.doctor_id,
      doctor_name: r.doctor_name,
      doctor_photo: r.doctor_photo,
      speciality_name: r.speciality_name,
      patient_display_name: formatPatientDisplayName(r.patient_name),
    }));

    return res.json(publicReviews);
  } catch (err: any) {
    console.error('Error fetching reviews:', err);
    return res.status(500).json({ error: 'Failed to retrieve patient reviews' });
  }
});

/**
 * GET /api/reviews/stats
 * Public endpoint for overall rating summary and review counts.
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [rows] = await query<any[]>(`
      SELECT 
        COUNT(*) AS total_approved,
        COALESCE(ROUND(AVG(rating), 1), 5.0) AS average_rating
      FROM patient_reviews
      WHERE status = 'Approved'
    `);

    const totalApproved = Number(rows?.total_approved || 0);
    const averageRating = Number(rows?.average_rating || 5.0);

    return res.json({
      total_approved_reviews: totalApproved,
      average_rating: averageRating,
    });
  } catch (err: any) {
    console.error('Error fetching review stats:', err);
    return res.status(500).json({ error: 'Failed to retrieve review statistics' });
  }
});

/**
 * GET /api/reviews/eligible-appointments
 * Authenticated patient: returns completed appointments eligible for feedback (not yet reviewed).
 */
router.get('/eligible-appointments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.id;
    const patientEmail = req.user?.email || '';

    // Fetch user mobile number
    const [userProfile] = await query<any[]>(
      `SELECT mobile_number FROM profiles WHERE id = ?`,
      [patientId]
    );
    const patientPhone = userProfile?.mobile_number || '';

    const sql = `
      SELECT 
        a.id AS appointment_id,
        a.reference_number,
        a.appointment_date,
        a.start_time,
        a.doctor_id,
        d.name AS doctor_name,
        d.photo_url AS doctor_photo,
        s.name AS speciality_name,
        r.id AS existing_review_id,
        r.status AS existing_review_status
      FROM appointments a
      INNER JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN specialities s ON a.speciality_id = s.id
      LEFT JOIN patient_reviews r ON a.id = r.appointment_id
      WHERE a.status = 'Completed'
        AND (a.patient_id = ? OR a.patient_email = ? OR a.patient_phone = ?)
      ORDER BY a.appointment_date DESC, a.start_time DESC
    `;

    const rows = await query<any[]>(sql, [patientId, patientEmail, patientPhone]);
    return res.json(rows);
  } catch (err: any) {
    console.error('Error fetching eligible appointments:', err);
    return res.status(500).json({ error: 'Failed to retrieve eligible appointments for review' });
  }
});

/**
 * GET /api/reviews/my-reviews
 * Authenticated patient: returns all reviews submitted by the current user.
 */
router.get('/my-reviews', authenticateToken, async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.id;
    const sql = `
      SELECT 
        r.id,
        r.rating,
        r.review_title,
        r.review_message,
        r.status,
        r.created_at,
        r.doctor_id,
        d.name AS doctor_name,
        d.photo_url AS doctor_photo,
        s.name AS speciality_name,
        a.reference_number AS appointment_reference,
        a.appointment_date
      FROM patient_reviews r
      INNER JOIN doctors d ON r.doctor_id = d.id
      LEFT JOIN specialities s ON d.speciality_id = s.id
      INNER JOIN appointments a ON r.appointment_id = a.id
      WHERE r.patient_id = ?
      ORDER BY r.created_at DESC
    `;
    const rows = await query<any[]>(sql, [patientId]);
    return res.json(rows);
  } catch (err: any) {
    console.error('Error fetching patient personal reviews:', err);
    return res.status(500).json({ error: 'Failed to retrieve your reviews' });
  }
});

/**
 * POST /api/reviews
 * Authenticated patient: submit a review for a completed appointment with a doctor.
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.id;
    if (!patientId) {
      return res.status(401).json({ error: 'Authentication required to submit feedback' });
    }

    const { doctor_id, appointment_id, rating, review_title, review_message } = req.body;

    // 1. Validate Doctor
    if (!doctor_id || typeof doctor_id !== 'string') {
      return res.status(400).json({ error: 'Please select a valid doctor' });
    }

    const [doctor] = await query<any[]>(`SELECT id, name FROM doctors WHERE id = ?`, [doctor_id]);
    if (!doctor) {
      return res.status(404).json({ error: 'Selected doctor could not be found' });
    }

    // 2. Validate Rating (1 to 5)
    const numRating = Number(rating);
    if (!numRating || isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Star rating must be between 1 and 5' });
    }

    // 3. Validate and Sanitize Feedback Message
    const cleanMessage = sanitizeText(review_message);
    if (!cleanMessage || cleanMessage.length < 10) {
      return res.status(400).json({ error: 'Feedback message must be at least 10 characters long' });
    }
    if (cleanMessage.length > 2000) {
      return res.status(400).json({ error: 'Feedback message cannot exceed 2000 characters' });
    }

    const cleanTitle = sanitizeText(review_title) || null;

    // 4. Verify Completed Appointment
    // Find patient's details
    const [patientProfile] = await query<any[]>(
      `SELECT full_name, email, mobile_number FROM profiles WHERE id = ?`,
      [patientId]
    );
    const patientName = patientProfile?.full_name || 'Patient';
    const patientEmail = patientProfile?.email || '';
    const patientPhone = patientProfile?.mobile_number || '';

    let targetAppointmentId = appointment_id;

    if (targetAppointmentId) {
      // Check that the specified appointment is Completed, belongs to this patient, and matches doctor_id
      const [apt] = await query<any[]>(
        `SELECT id, status, doctor_id FROM appointments 
         WHERE id = ? 
           AND doctor_id = ?
           AND status = 'Completed'
           AND (patient_id = ? OR patient_email = ? OR patient_phone = ?)`,
        [targetAppointmentId, doctor_id, patientId, patientEmail, patientPhone]
      );

      if (!apt) {
        return res.status(400).json({
          error: 'Review can only be submitted for a completed appointment with this doctor.',
        });
      }
    } else {
      // Find an eligible un-reviewed completed appointment for this patient with this doctor
      const [apt] = await query<any[]>(
        `SELECT a.id FROM appointments a
         WHERE a.doctor_id = ?
           AND a.status = 'Completed'
           AND (a.patient_id = ? OR a.patient_email = ? OR a.patient_phone = ?)
           AND a.id NOT IN (SELECT appointment_id FROM patient_reviews)
         ORDER BY a.appointment_date DESC, a.start_time DESC
         LIMIT 1`,
        [doctor_id, patientId, patientEmail, patientPhone]
      );

      if (!apt) {
        // Check if there are ANY completed appointments with this doctor
        const [anyCompleted] = await query<any[]>(
          `SELECT a.id FROM appointments a
           WHERE a.doctor_id = ?
             AND a.status = 'Completed'
             AND (a.patient_id = ? OR a.patient_email = ? OR a.patient_phone = ?)
           LIMIT 1`,
          [doctor_id, patientId, patientEmail, patientPhone]
        );

        if (!anyCompleted) {
          return res.status(400).json({
            error: `Only patients who have a completed appointment with ${doctor.name} can submit a review.`,
          });
        } else {
          return res.status(400).json({
            error: `You have already submitted feedback for your completed appointment with ${doctor.name}.`,
          });
        }
      }

      targetAppointmentId = apt.id;
    }

    // 5. Prevent Duplicate Review for the same appointment (Database Unique Constraint safeguard)
    const [existing] = await query<any[]>(
      `SELECT id FROM patient_reviews WHERE appointment_id = ?`,
      [targetAppointmentId]
    );
    if (existing) {
      return res.status(400).json({
        error: 'A review has already been submitted for this appointment.',
      });
    }

    // 6. Insert Review into database with status 'Pending'
    const reviewId = crypto.randomUUID();
    await query(
      `INSERT INTO patient_reviews (id, patient_id, doctor_id, appointment_id, rating, review_title, review_message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [reviewId, patientId, doctor_id, targetAppointmentId, numRating, cleanTitle, cleanMessage]
    );

    // 7. Dispatch an administrative notification in the hospital notifications system
    try {
      const notifId = crypto.randomUUID();
      await query(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, reference_id)
         VALUES (?, NULL, ?, ?, 'general', FALSE, ?)`,
        [
          notifId,
          `New Patient Review: ${doctor.name} (${numRating}★)`,
          `Patient ${patientName} submitted feedback for Dr. ${doctor.name}. Awaiting administrator review and approval.`,
          targetAppointmentId,
        ]
      );
    } catch (nErr) {
      console.warn('Could not insert admin review notification:', nErr);
    }

    // Return the exact required user-facing response message
    return res.status(201).json({
      message: 'Thank you! Your feedback has been submitted and is awaiting admin approval.',
      review: {
        id: reviewId,
        patient_id: patientId,
        doctor_id,
        appointment_id: targetAppointmentId,
        rating: numRating,
        review_title: cleanTitle,
        review_message: cleanMessage,
        status: 'Pending',
      },
    });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        error: 'A review has already been submitted for this appointment.',
      });
    }
    console.error('Error submitting review:', err);
    return res.status(500).json({ error: 'Failed to submit patient feedback. Please try again.' });
  }
});

/**
 * PATCH /api/reviews/:id/status
 * Admin only: Approve or Reject a review.
 */
router.patch('/:id/status', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Approved, Rejected, or Pending' });
    }

    const [existing] = await query<any[]>(`SELECT id, status FROM patient_reviews WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await query(`UPDATE patient_reviews SET status = ? WHERE id = ?`, [status, id]);

    const [updated] = await query<any[]>(
      `SELECT r.*, d.name AS doctor_name, p.full_name AS patient_name 
       FROM patient_reviews r
       INNER JOIN doctors d ON r.doctor_id = d.id
       INNER JOIN profiles p ON r.patient_id = p.id
       WHERE r.id = ?`,
      [id]
    );

    return res.json({
      message: `Review ${status.toLowerCase()} successfully`,
      review: updated,
    });
  } catch (err: any) {
    console.error('Error updating review status:', err);
    return res.status(500).json({ error: 'Failed to update review status' });
  }
});

/**
 * DELETE /api/reviews/:id
 * Admin only: Delete a review.
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [existing] = await query<any[]>(`SELECT id FROM patient_reviews WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await query(`DELETE FROM patient_reviews WHERE id = ?`, [id]);

    return res.json({ message: 'Review deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting review:', err);
    return res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
