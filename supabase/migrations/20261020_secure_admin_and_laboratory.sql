-- =========================================================================
-- SmartCare Hospital Portal - Shri Gajanan Multispeciality Hospital
-- Migration: Secure Admin Access & Laboratory Management
-- File: 20261020_secure_admin_and_laboratory.sql
-- =========================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. HARDENED ADMIN ROLE VERIFICATION & DATABASE-LEVEL SECURITY
-- =========================================================================

-- Ensure user_roles table has RLS enabled
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing user_roles policies if any
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user_roles" ON public.user_roles;

-- Recreate is_admin function checking both user_roles and profiles
-- SECURITY DEFINER with explicit search_path prevents search_path hijacking
-- and prevents infinite recursion while checking permissions.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- RLS Policies on user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins manage user_roles" ON public.user_roles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Prevent Role Escalation on profiles table:
-- Ordinary users updating their own profile must NEVER be able to change their role to 'admin'
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Only an authenticated administrator is authorized to alter role assignments
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access denied: You are not authorized to modify your own role or privileges.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- =========================================================================
-- 2. SECURE ADMIN PROVISIONING UTILITY FUNCTION
-- =========================================================================

-- Administrative utility to provision or promote an administrator securely via SQL Editor or CLI
CREATE OR REPLACE FUNCTION public.provision_admin_user(p_user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(p_user_email);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Auth user with email "%" does not exist in auth.users. Please create user in Supabase Authentication first.', p_user_email;
  END IF;

  -- Ensure profile row exists and set role to admin
  INSERT INTO public.profiles (id, email, full_name, mobile_number, role)
  VALUES (
    v_user_id,
    p_user_email,
    'Hospital Administrator',
    '+91 98200 00000',
    'admin'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

  -- Assign in user_roles table
  INSERT INTO public.user_roles (user_id, role, granted_at)
  VALUES (v_user_id, 'admin', NOW())
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN format('Successfully provisioned administrator privileges for user %s (UUID: %s)', p_user_email, v_user_id);
END;
$$;

-- =========================================================================
-- 3. LABORATORY TESTS TABLE & CONSTRAINTS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.laboratory_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    sample_type TEXT,
    preparation_instructions TEXT,
    fasting_required BOOLEAN NOT NULL DEFAULT FALSE,
    indicative_price NUMERIC(10,2),
    turnaround_time TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Indexes for lightning-fast catalog search & filtering
CREATE INDEX IF NOT EXISTS idx_laboratory_tests_published_available 
  ON public.laboratory_tests (is_published, is_available, display_order);

CREATE INDEX IF NOT EXISTS idx_laboratory_tests_category 
  ON public.laboratory_tests (category);

CREATE INDEX IF NOT EXISTS idx_laboratory_tests_slug 
  ON public.laboratory_tests (slug);

-- Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_lab_test_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lab_test_updated_at ON public.laboratory_tests;
CREATE TRIGGER trg_lab_test_updated_at
  BEFORE UPDATE ON public.laboratory_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_lab_test_updated_at();

-- =========================================================================
-- 4. LABORATORY SETTINGS TABLE
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.laboratory_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_name TEXT NOT NULL DEFAULT 'Shri Gajanan Hospital Diagnostic Laboratory',
    location TEXT NOT NULL DEFAULT 'Ground Floor, Diagnostics & Imaging Wing B',
    operating_hours TEXT NOT NULL DEFAULT 'Sample Collection: Mon - Sat 07:30 AM - 07:00 PM | Emergency Lab: 24/7',
    contact_phone TEXT NOT NULL DEFAULT '+91 22 2845 6795',
    general_description TEXT NOT NULL DEFAULT 'Accredited multi-parameter clinical pathology, hematology, and biochemistry diagnostic services equipped with fully automated chemiluminescence and flow-cytometry analysers.',
    accepts_walkins BOOLEAN NOT NULL DEFAULT TRUE,
    appointment_required BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES FOR LABORATORY TABLES
-- =========================================================================

ALTER TABLE public.laboratory_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratory_settings ENABLE ROW LEVEL SECURITY;

-- Laboratory Tests Policies
DROP POLICY IF EXISTS "Public can view published laboratory tests" ON public.laboratory_tests;
DROP POLICY IF EXISTS "Admins have full access to laboratory tests" ON public.laboratory_tests;
DROP POLICY IF EXISTS "Admins can view all laboratory tests" ON public.laboratory_tests;
DROP POLICY IF EXISTS "Admins can insert laboratory tests" ON public.laboratory_tests;
DROP POLICY IF EXISTS "Admins can update laboratory tests" ON public.laboratory_tests;
DROP POLICY IF EXISTS "Admins can delete laboratory tests" ON public.laboratory_tests;

-- 1) Public users can read ONLY published tests
CREATE POLICY "Public can view published laboratory tests" ON public.laboratory_tests
  FOR SELECT USING (is_published = TRUE);

-- 2) Only verified administrators can view unpublished/draft tests and make mutations
CREATE POLICY "Admins have full access to laboratory tests" ON public.laboratory_tests
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Laboratory Settings Policies
DROP POLICY IF EXISTS "Public can view laboratory settings" ON public.laboratory_settings;
DROP POLICY IF EXISTS "Admins can update laboratory settings" ON public.laboratory_settings;

CREATE POLICY "Public can view laboratory settings" ON public.laboratory_settings
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can update laboratory settings" ON public.laboratory_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =========================================================================
-- 6. SEED VERIFIED LABORATORY TESTS & SETTINGS
-- =========================================================================

-- Seed Hospital Laboratory Settings (Single Default Record)
INSERT INTO public.laboratory_settings (
  id,
  lab_name,
  location,
  operating_hours,
  contact_phone,
  general_description,
  accepts_walkins,
  appointment_required
) VALUES (
  'e1000000-0000-0000-0000-000000000001',
  'Shri Gajanan Hospital Diagnostic Laboratory',
  'Ground Floor, Diagnostics & Imaging Wing B (Near Main OPD)',
  'Routine Sample Collection: Mon - Sat 07:30 AM - 07:00 PM | 24/7 Emergency Diagnostics',
  '+91 22 2845 6795',
  'Fully automated, quality-controlled clinical pathology, hematology, biochemistry, and microbiology laboratory delivering accurate and timely diagnostic reports.',
  true,
  false
)
ON CONFLICT (id) DO UPDATE SET
  lab_name = EXCLUDED.lab_name,
  location = EXCLUDED.location,
  operating_hours = EXCLUDED.operating_hours,
  contact_phone = EXCLUDED.contact_phone;

-- Seed Verified Laboratory Tests (Idempotent by unique slug)
INSERT INTO public.laboratory_tests (
  id, name, slug, category, description, sample_type, preparation_instructions,
  fasting_required, indicative_price, turnaround_time, is_available, is_published, display_order
) VALUES
(
  'e2000000-0000-0000-0000-000000000001',
  'Complete Blood Count (CBC) with Automated Differential',
  'complete-blood-count-cbc',
  'Complete Blood Count (CBC)',
  'Evaluates overall cellular health by measuring red blood cells (RBC), white blood cells (WBC), hemoglobin, hematocrit, and platelet count.',
  'Blood (EDTA Whole Blood)',
  'No special diet required. Stay adequately hydrated before sample collection.',
  false,
  350.00,
  'Within 3-4 Hours',
  true,
  true,
  1
),
(
  'e2000000-0000-0000-0000-000000000002',
  'Hemoglobin (Hb) & Red Cell Indices',
  'hemoglobin-hb-indices',
  'Hemoglobin and blood cell tests',
  'Rapid quantitative hemoglobin concentration with MCV, MCH, and MCHC to detect nutritional or acute anemia.',
  'Blood (EDTA Whole Blood)',
  'No prior fasting needed.',
  false,
  180.00,
  'Within 2 Hours',
  true,
  true,
  2
),
(
  'e2000000-0000-0000-0000-000000000003',
  'Fasting Blood Glucose (FBS)',
  'fasting-blood-glucose-fbs',
  'Blood glucose tests',
  'Measures plasma glucose levels following an overnight fast. Primary screening test for prediabetes and type 1 or type 2 diabetes mellitus.',
  'Blood (Fluoride Plasma)',
  'Requires mandatory 8 to 10 hours overnight fasting. Water intake is permitted. Avoid smoking or morning coffee before sample collection.',
  true,
  120.00,
  'Within 2-3 Hours',
  true,
  true,
  3
),
(
  'e2000000-0000-0000-0000-000000000004',
  'HbA1c (Glycated Hemoglobin) - HPLC Method',
  'hba1c-glycated-hemoglobin',
  'Blood glucose tests',
  'Determines average 3-month blood sugar control using gold-standard HPLC methodology. Essential for monitoring long-term glycemic therapy.',
  'Blood (EDTA Whole Blood)',
  'Fasting is NOT required. Can be drawn at any convenient time of day.',
  false,
  550.00,
  'Within 4-6 Hours',
  true,
  true,
  4
),
(
  'e2000000-0000-0000-0000-000000000005',
  'Postprandial Blood Glucose (PPBS)',
  'postprandial-blood-glucose-ppbs',
  'Blood glucose tests',
  'Assesses glycemic response precisely 2 hours after commencing a meal or prescribed 75g glucose load.',
  'Blood (Fluoride Plasma)',
  'Sample must be collected precisely 2 hours from the start of your regular meal. Note the exact timing.',
  false,
  120.00,
  'Within 2-3 Hours',
  true,
  true,
  5
),
(
  'e2000000-0000-0000-0000-000000000006',
  'Lipid Profile Comprehensive',
  'lipid-profile-comprehensive',
  'Lipid profile',
  'Quantifies Total Cholesterol, HDL (good), LDL (bad), VLDL, and Triglycerides to evaluate cardiovascular risk and atherogenic index.',
  'Blood (Serum)',
  'Requires 10 to 12 hours of overnight fasting. Avoid heavy or fatty meals and alcohol the evening prior.',
  true,
  650.00,
  'Within 5-6 Hours',
  true,
  true,
  6
),
(
  'e2000000-0000-0000-0000-000000000007',
  'Liver Function Test (LFT) with Enzymes & Proteins',
  'liver-function-test-lft',
  'Liver function tests',
  'Comprehensive hepatic evaluation: Total/Direct Bilirubin, SGOT (AST), SGPT (ALT), Alkaline Phosphatase (ALP), Total Protein, Albumin, and A/G ratio.',
  'Blood (Serum)',
  'Overnight fasting of 8-10 hours is recommended for accurate bilirubin and enzyme quantification.',
  true,
  700.00,
  'Within 5-6 Hours',
  true,
  true,
  7
),
(
  'e2000000-0000-0000-0000-000000000008',
  'Kidney Function Test (KFT / RFT) with Electrolytes',
  'kidney-function-test-kft',
  'Kidney function tests',
  'Evaluates renal filtration capacity: Blood Urea Nitrogen (BUN), Serum Creatinine, Uric Acid, Sodium, Potassium, and Chloride.',
  'Blood (Serum)',
  'Fasting of 4-6 hours preferred. Avoid vigorous unaccustomed exercise or high-protein intake right before the test.',
  false,
  750.00,
  'Within 4-5 Hours',
  true,
  true,
  8
),
(
  'e2000000-0000-0000-0000-000000000009',
  'Thyroid Stimulating Hormone (TSH) - Ultra Sensitive',
  'thyroid-stimulating-hormone-tsh',
  'Thyroid function tests',
  'Ultrasensitive 3rd generation ECLIA assay to screen for primary hypothyroidism and hyperthyroidism.',
  'Blood (Serum)',
  'Early morning sample preferred. If taking thyroid medication (e.g., levothyroxine), consult your doctor regarding dose timing.',
  false,
  280.00,
  'Same Day (4 Hours)',
  true,
  true,
  9
),
(
  'e2000000-0000-0000-0000-000000000010',
  'Complete Thyroid Profile (Total T3, Total T4, TSH)',
  'complete-thyroid-profile-t3-t4-tsh',
  'Thyroid function tests',
  'Comprehensive triad assessment of active thyroid hormones and pituitary feedback loop.',
  'Blood (Serum)',
  'Morning collection recommended. Fasting is not strictly mandatory but avoids post-meal lipemia interference.',
  false,
  550.00,
  'Within 6 Hours',
  true,
  true,
  10
),
(
  'e2000000-0000-0000-0000-000000000011',
  'Serum Ferritin & Iron Studies Profile',
  'serum-ferritin-iron-studies',
  'Iron studies',
  'Assesses total iron stores, Serum Iron, Total Iron Binding Capacity (TIBC), and Transferrin Saturation for microcytic anemia differential.',
  'Blood (Serum)',
  'Overnight fasting of 8-10 hours is strongly recommended because serum iron levels exhibit significant diurnal variation.',
  true,
  950.00,
  'Within 8-12 Hours',
  true,
  true,
  11
),
(
  'e2000000-0000-0000-0000-000000000012',
  'Vitamin D (25-Hydroxy) Chemiluminescence',
  'vitamin-d-25-hydroxy',
  'Vitamin tests',
  'High-precision ECLIA assay quantifying 25-OH Vitamin D for bone mineral density, osteopenia, and immunological health.',
  'Blood (Serum)',
  'No fasting required. Avoid heavy vitamin supplement bolus immediately prior to sample collection.',
  false,
  1100.00,
  'Same Day (6-8 Hours)',
  true,
  true,
  12
),
(
  'e2000000-0000-0000-0000-000000000013',
  'Vitamin B12 (Active Cyanocobalamin)',
  'vitamin-b12-active',
  'Vitamin tests',
  'Quantifies circulating Vitamin B12 to investigate megaloblastic anemia, neuropathies, fatigue, and vegan/vegetarian dietary deficiency.',
  'Blood (Serum)',
  'Fasting for 6-8 hours preferred. Inform technician if receiving B12 injections.',
  false,
  850.00,
  'Within 6-8 Hours',
  true,
  true,
  13
),
(
  'e2000000-0000-0000-0000-000000000014',
  'Urine Routine & Microscopic Examination',
  'urine-routine-microscopic',
  'Other laboratory services',
  'Physical, chemical strip (pH, protein, glucose, ketones), and microscopic sediment analysis (pus cells, RBCs, casts, crystals).',
  'Urine (Clean-Catch Midstream)',
  'Collect first-morning clean-catch midstream urine in a sterile container provided by the hospital laboratory.',
  false,
  150.00,
  'Within 2-3 Hours',
  true,
  true,
  14
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  sample_type = EXCLUDED.sample_type,
  preparation_instructions = EXCLUDED.preparation_instructions,
  fasting_required = EXCLUDED.fasting_required,
  indicative_price = EXCLUDED.indicative_price,
  turnaround_time = EXCLUDED.turnaround_time,
  is_available = EXCLUDED.is_available,
  is_published = EXCLUDED.is_published,
  display_order = EXCLUDED.display_order;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
