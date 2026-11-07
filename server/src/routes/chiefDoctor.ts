import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

export const DEFAULT_CHIEF_DOCTOR_PROFILE = {
  id: 'chief-doctor-shri-gajanan-1',
  doctor_id: 'c369ab99-5197-4359-bfd8-cead79d8090e',
  name: 'Dr. Vishal Panditrao Pawar',
  designation: 'Chief Doctor / Medical Director',
  qualifications: 'MBBS, MD (Medicine), DM (Cardiology), FACC',
  speciality: 'Cardiology & Internal Medicine',
  experience_years: 18,
  photo_url: null,
  introduction: 'Dr. Vishal Panditrao Pawar is the Chief Doctor and Medical Director at Shri Gajanan Hospital. With over 18 years of clinical and interventional expertise, he has performed over 6,500+ successful cardiac interventions and pioneered compassionate, patient-centered clinical standards across the region.',
  welcome_message: 'Welcome to Shri Gajanan Hospital. Our paramount commitment is ensuring every patient receives state-of-the-art medical excellence delivered with empathy, dignity, and personal care. We stand by you and your family around the clock for all your healthcare needs.'
};

async function ensureTableAndDefault() {
  await query(`
    CREATE TABLE IF NOT EXISTS chief_doctor_profile (
      id VARCHAR(50) PRIMARY KEY,
      doctor_id VARCHAR(50) NULL,
      name VARCHAR(255) NOT NULL,
      designation VARCHAR(255) NOT NULL DEFAULT 'Chief Doctor / Medical Director',
      qualifications VARCHAR(255) NOT NULL,
      speciality VARCHAR(255) NOT NULL,
      experience_years INT NOT NULL DEFAULT 18,
      photo_url LONGTEXT NULL,
      introduction TEXT NOT NULL,
      welcome_message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const rows = await query<any[]>('SELECT * FROM chief_doctor_profile LIMIT 1');
  if (rows.length === 0) {
    // Try to find existing doctor for Dr. Vishal Pawar
    const docRows = await query<any[]>("SELECT id, photo_url FROM doctors WHERE name LIKE '%Vishal%' LIMIT 1");
    let docId = docRows.length > 0 ? docRows[0].id : null;
    let photo = docRows.length > 0 ? docRows[0].photo_url : null;

    await query(`
      INSERT INTO chief_doctor_profile (
        id, doctor_id, name, designation, qualifications, speciality, experience_years,
        photo_url, introduction, welcome_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      DEFAULT_CHIEF_DOCTOR_PROFILE.id,
      docId,
      DEFAULT_CHIEF_DOCTOR_PROFILE.name,
      DEFAULT_CHIEF_DOCTOR_PROFILE.designation,
      DEFAULT_CHIEF_DOCTOR_PROFILE.qualifications,
      DEFAULT_CHIEF_DOCTOR_PROFILE.speciality,
      DEFAULT_CHIEF_DOCTOR_PROFILE.experience_years,
      photo,
      DEFAULT_CHIEF_DOCTOR_PROFILE.introduction,
      DEFAULT_CHIEF_DOCTOR_PROFILE.welcome_message,
    ]);
  }
}

// GET /api/chief-doctor - Public Chief Doctor Profile
router.get('/', async (_req: Request, res: Response) => {
  try {
    await ensureTableAndDefault();

    const rows = await query<any[]>('SELECT * FROM chief_doctor_profile LIMIT 1');
    if (rows.length === 0) {
      return res.json(DEFAULT_CHIEF_DOCTOR_PROFILE);
    }

    const profile = rows[0];

    // Fetch linked doctor details if available
    let linkedDoctor = null;
    if (profile.doctor_id) {
      const docRows = await query<any[]>(
        `SELECT d.*, s.name AS speciality_name 
         FROM doctors d
         LEFT JOIN specialities s ON d.speciality_id = s.id
         WHERE d.id = ?`,
        [profile.doctor_id]
      );
      if (docRows.length > 0) {
        linkedDoctor = {
          ...docRows[0],
          working_days: typeof docRows[0].working_days === 'string'
            ? JSON.parse(docRows[0].working_days)
            : (docRows[0].working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
          consultation_fee: Number(docRows[0].consultation_fee),
          rating: Number(docRows[0].rating),
          is_active: Boolean(docRows[0].is_active),
        };
      }
    } else {
      // Fallback search for doctor by name if doctor_id wasn't populated
      const fallbackDocRows = await query<any[]>(
        `SELECT d.*, s.name AS speciality_name 
         FROM doctors d
         LEFT JOIN specialities s ON d.speciality_id = s.id
         WHERE d.name LIKE '%Vishal%' LIMIT 1`
      );
      if (fallbackDocRows.length > 0) {
        linkedDoctor = {
          ...fallbackDocRows[0],
          working_days: typeof fallbackDocRows[0].working_days === 'string'
            ? JSON.parse(fallbackDocRows[0].working_days)
            : (fallbackDocRows[0].working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
          consultation_fee: Number(fallbackDocRows[0].consultation_fee),
          rating: Number(fallbackDocRows[0].rating),
          is_active: Boolean(fallbackDocRows[0].is_active),
        };
      }
    }

    return res.json({
      ...profile,
      experience_years: Number(profile.experience_years),
      linked_doctor: linkedDoctor,
    });
  } catch (err: any) {
    console.error('getChiefDoctorProfile error:', err);
    return res.json(DEFAULT_CHIEF_DOCTOR_PROFILE);
  }
});

// PUT /api/chief-doctor - Admin update
router.put('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    await ensureTableAndDefault();

    const {
      name,
      designation,
      qualifications,
      speciality,
      experience_years,
      photo_url,
      introduction,
      welcome_message,
    } = req.body;

    if (!name || !qualifications || !speciality) {
      return res.status(400).json({ error: 'Name, qualifications, and speciality are required.' });
    }

    const rows = await query<any[]>('SELECT * FROM chief_doctor_profile LIMIT 1');
    const profileId = rows.length > 0 ? rows[0].id : DEFAULT_CHIEF_DOCTOR_PROFILE.id;
    let doctorId = rows.length > 0 ? rows[0].doctor_id : null;

    if (!doctorId) {
      // Find doctor if not linked
      const docRows = await query<any[]>("SELECT id FROM doctors WHERE name LIKE '%Vishal%' LIMIT 1");
      if (docRows.length > 0) {
        doctorId = docRows[0].id;
      }
    }

    const expYears = Number(experience_years) || 18;

    await query(
      `UPDATE chief_doctor_profile SET
        name = ?,
        designation = ?,
        qualifications = ?,
        speciality = ?,
        experience_years = ?,
        photo_url = ?,
        introduction = ?,
        welcome_message = ?,
        doctor_id = ?
       WHERE id = ?`,
      [
        name.trim(),
        designation ? designation.trim() : 'Chief Doctor / Medical Director',
        qualifications.trim(),
        speciality.trim(),
        expYears,
        photo_url || null,
        introduction ? introduction.trim() : '',
        welcome_message ? welcome_message.trim() : '',
        doctorId,
        profileId,
      ]
    );

    // Synchronize linked doctor in doctors table to avoid duplicate doctor records
    if (doctorId) {
      try {
        await query(
          `UPDATE doctors SET
            name = ?,
            qualifications = ?,
            experience_years = ?,
            photo_url = COALESCE(?, photo_url)
           WHERE id = ?`,
          [name.trim(), qualifications.trim(), expYears, photo_url || null, doctorId]
        );
      } catch (syncErr) {
        console.warn('Could not sync doctors table:', syncErr);
      }
    }

    // Return updated profile with linked doctor
    const updatedRows = await query<any[]>('SELECT * FROM chief_doctor_profile WHERE id = ?', [profileId]);
    const updated = updatedRows[0];

    let linkedDoctor = null;
    if (updated.doctor_id) {
      const docRows = await query<any[]>(
        `SELECT d.*, s.name AS speciality_name 
         FROM doctors d
         LEFT JOIN specialities s ON d.speciality_id = s.id
         WHERE d.id = ?`,
        [updated.doctor_id]
      );
      if (docRows.length > 0) {
        linkedDoctor = {
          ...docRows[0],
          working_days: typeof docRows[0].working_days === 'string'
            ? JSON.parse(docRows[0].working_days)
            : (docRows[0].working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
          consultation_fee: Number(docRows[0].consultation_fee),
          rating: Number(docRows[0].rating),
          is_active: Boolean(docRows[0].is_active),
        };
      }
    }

    return res.json({
      ...updated,
      experience_years: Number(updated.experience_years),
      linked_doctor: linkedDoctor,
    });
  } catch (err: any) {
    console.error('updateChiefDoctorProfile error:', err);
    return res.status(500).json({ error: err.message || 'Failed to update Chief Doctor Profile' });
  }
});

export default router;

