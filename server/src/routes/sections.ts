import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

export interface WebsiteSectionRow {
  id: string;
  name: string;
  description: string;
  is_visible: boolean | number;
  display_order: number;
  updated_at?: string;
}

export const DEFAULT_WEBSITE_SECTIONS: Omit<WebsiteSectionRow, 'updated_at'>[] = [
  {
    id: 'schemes',
    name: 'Government Schemes',
    description: 'Ayushman Bharat PM-JAY & Maharashtra MJPJAY cashless scheme highlights, cards, and pages.',
    is_visible: true,
    display_order: 1,
  },
  {
    id: 'laboratory',
    name: 'Laboratory Services',
    description: 'Diagnostic pathology, blood testing services, test directory, and laboratory desk.',
    is_visible: true,
    display_order: 2,
  },
  {
    id: 'doctors',
    name: 'Doctors',
    description: 'Verified senior specialists, OPD schedules, doctor profiles, and OPD directory.',
    is_visible: true,
    display_order: 3,
  },
  {
    id: 'specialities',
    name: 'Specialities',
    description: 'Clinical departments including Cardiology, Orthopaedics, Neurology, & Oncology.',
    is_visible: true,
    display_order: 4,
  },
  {
    id: 'facilities',
    name: 'Hospital Facilities',
    description: '250-bed inpatient infrastructure, 24/7 Casualty, Dialysis, and modular Operation Theatres.',
    is_visible: true,
    display_order: 5,
  },
  {
    id: 'how_it_works',
    name: 'About Hospital',
    description: 'Hospital overview, patient guidance, and step-by-step appointment booking walkthrough.',
    is_visible: true,
    display_order: 6,
  },
  {
    id: 'health_packages',
    name: 'Health Packages',
    description: 'Preventive health checkup packages and routine wellness screening bundles.',
    is_visible: true,
    display_order: 7,
  },
  {
    id: 'testimonials',
    name: 'Testimonials',
    description: 'Verified patient recovery stories, doctor appreciation, and clinical treatment feedback.',
    is_visible: true,
    display_order: 8,
  },
  {
    id: 'contact',
    name: 'Contact & Helpdesk',
    description: 'Hospital address, emergency contact numbers, Borivali location map, and query form.',
    is_visible: true,
    display_order: 9,
  },
  {
    id: 'quick_access',
    name: 'Quick Portals / Access Cards',
    description: 'Homepage interactive quick portal cards for instant navigation.',
    is_visible: true,
    display_order: 10,
  },
  {
    id: 'chief_doctor',
    name: 'Chief Doctor Profile',
    description: 'Meet Our Chief Doctor & Medical Director profile section on homepage.',
    is_visible: true,
    display_order: 11,
  },
];

async function ensureTableAndDefaults() {
  await query(`
    CREATE TABLE IF NOT EXISTS website_sections (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT NULL,
      is_visible BOOLEAN NOT NULL DEFAULT TRUE,
      display_order INT DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const existing = await query<any[]>('SELECT id FROM website_sections');
  const existingIds = new Set(existing.map((r: any) => r.id));

  for (const item of DEFAULT_WEBSITE_SECTIONS) {
    if (!existingIds.has(item.id)) {
      await query(
        `INSERT INTO website_sections (id, name, description, is_visible, display_order)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
        [item.id, item.name, item.description, item.is_visible ? 1 : 0, item.display_order]
      );
    }
  }
}

// GET all website sections (public for patient-facing frontend)
router.get('/', async (_req: Request, res: Response) => {
  try {
    await ensureTableAndDefaults();
    const rows = await query<any[]>('SELECT * FROM website_sections ORDER BY display_order ASC');
    const formatted = rows.map((r: any) => ({
      ...r,
      is_visible: Boolean(r.is_visible),
    }));
    return res.json(formatted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch website sections' });
  }
});

// PUT update single website section visibility (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_visible } = req.body;

    if (typeof is_visible !== 'boolean') {
      return res.status(400).json({ error: 'is_visible must be a boolean (true/false)' });
    }

    await ensureTableAndDefaults();

    await query(
      'UPDATE website_sections SET is_visible = ?, updated_at = NOW() WHERE id = ?',
      [is_visible ? 1 : 0, id]
    );

    const rows = await query<any[]>('SELECT * FROM website_sections WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Website section not found' });
    }

    return res.json({
      ...rows[0],
      is_visible: Boolean(rows[0].is_visible),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update website section visibility' });
  }
});

export default router;

