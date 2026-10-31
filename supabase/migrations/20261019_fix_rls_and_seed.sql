-- =========================================================================
-- SmartCare Hospital Portal - Migration: Fix RLS Recursion & Seed Data
-- Migration File: 20261019_fix_rls_and_seed.sql
-- =========================================================================

-- 1. Create SECURITY DEFINER function to check admin role without RLS recursion.
-- Functions marked SECURITY DEFINER with search_path = public bypass RLS
-- when reading profiles, preventing the infinite recursion error (42P17).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Drop the recursive and conflicting policies from initial migration.
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Public can view active doctors" ON public.doctors;
DROP POLICY IF EXISTS "Admins manage doctors" ON public.doctors;
DROP POLICY IF EXISTS "Admins can view all doctors" ON public.doctors;
DROP POLICY IF EXISTS "Admins can insert doctors" ON public.doctors;
DROP POLICY IF EXISTS "Admins can update doctors" ON public.doctors;
DROP POLICY IF EXISTS "Admins can delete doctors" ON public.doctors;

DROP POLICY IF EXISTS "Public can view published schemes" ON public.health_schemes;
DROP POLICY IF EXISTS "Admins manage health schemes" ON public.health_schemes;
DROP POLICY IF EXISTS "Admins can view all schemes" ON public.health_schemes;
DROP POLICY IF EXISTS "Admins can insert schemes" ON public.health_schemes;
DROP POLICY IF EXISTS "Admins can update schemes" ON public.health_schemes;
DROP POLICY IF EXISTS "Admins can delete schemes" ON public.health_schemes;

DROP POLICY IF EXISTS "Patients can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can request reschedule or cancel own appointment" ON public.appointments;
DROP POLICY IF EXISTS "Admins have full access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can update all appointments" ON public.appointments;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

-- 3. Enhance appointments and notifications table to allow guest patient bookings and store contact info
ALTER TABLE public.appointments ALTER COLUMN patient_id DROP NOT NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_phone TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_email TEXT;

ALTER TABLE public.notifications ALTER COLUMN user_id DROP NOT NULL;

-- 4. Recreate Clean, Non-Recursive RLS Policies

-- A. PROFILES
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- B. DOCTORS (Public read for active doctors, admin write)
CREATE POLICY "Public can view active doctors" ON public.doctors
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can view all doctors" ON public.doctors
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert doctors" ON public.doctors
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update doctors" ON public.doctors
    FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete doctors" ON public.doctors
    FOR DELETE USING (public.is_admin());

-- C. HEALTH SCHEMES (Public read for published schemes, admin write)
CREATE POLICY "Public can view published schemes" ON public.health_schemes
    FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Admins can view all schemes" ON public.health_schemes
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert schemes" ON public.health_schemes
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update schemes" ON public.health_schemes
    FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete schemes" ON public.health_schemes
    FOR DELETE USING (public.is_admin());

-- D. APPOINTMENTS (Patients view own, public/patients can insert, admins manage all)
CREATE POLICY "Patients can view own appointments" ON public.appointments
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND patient_id = auth.uid())
        OR public.is_admin()
    );

CREATE POLICY "Anyone can insert appointment" ON public.appointments
    FOR INSERT WITH CHECK (
        (auth.uid() IS NULL)
        OR (patient_id IS NULL)
        OR (patient_id = auth.uid())
        OR public.is_admin()
    );

CREATE POLICY "Patients can update own appointments" ON public.appointments
    FOR UPDATE USING (
        (auth.uid() IS NOT NULL AND patient_id = auth.uid())
        OR public.is_admin()
    );

-- E. NOTIFICATIONS
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR public.is_admin()
    );

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR public.is_admin()
    );

CREATE POLICY "Allow notification inserts" ON public.notifications
    FOR INSERT WITH CHECK (TRUE);

-- F. SPECIALITIES (Public read active, admins manage)
DROP POLICY IF EXISTS "Admins manage specialities" ON public.specialities;
DROP POLICY IF EXISTS "Admins can view all specialities" ON public.specialities;
DROP POLICY IF EXISTS "Admins can insert specialities" ON public.specialities;
DROP POLICY IF EXISTS "Admins can update specialities" ON public.specialities;
DROP POLICY IF EXISTS "Admins can delete specialities" ON public.specialities;
CREATE POLICY "Admins can view all specialities" ON public.specialities FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert specialities" ON public.specialities FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update specialities" ON public.specialities FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete specialities" ON public.specialities FOR DELETE USING (public.is_admin());

-- G. HOSPITAL SETTINGS
DROP POLICY IF EXISTS "Admins can update hospital settings" ON public.hospital_settings;
CREATE POLICY "Admins can update hospital settings" ON public.hospital_settings
    FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- H. APPOINTMENT HISTORY
DROP POLICY IF EXISTS "Patients view own appointment history" ON public.appointment_history;
DROP POLICY IF EXISTS "Allow appointment history inserts" ON public.appointment_history;
CREATE POLICY "Patients view own appointment history" ON public.appointment_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.appointments a
            WHERE a.id = appointment_id
              AND ((auth.uid() IS NOT NULL AND a.patient_id = auth.uid()) OR public.is_admin())
        )
    );
CREATE POLICY "Allow appointment history inserts" ON public.appointment_history
    FOR INSERT WITH CHECK (TRUE);

-- 5. Update book_appointment_safe function to support guest & authenticated bookings
CREATE OR REPLACE FUNCTION public.book_appointment_safe(
    p_patient_id UUID,
    p_doctor_id UUID,
    p_speciality_id UUID,
    p_appointment_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_reason_for_visit TEXT,
    p_visit_type TEXT,
    p_reference_number TEXT,
    p_patient_name TEXT DEFAULT NULL,
    p_patient_phone TEXT DEFAULT NULL,
    p_patient_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conflict_count INTEGER;
    v_appointment_id UUID;
    v_is_leave BOOLEAN;
    v_effective_patient_id UUID := p_patient_id;
BEGIN
    -- If p_patient_id is provided but not in profiles, set it to NULL to prevent FK error
    IF v_effective_patient_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_effective_patient_id) THEN
            v_effective_patient_id := NULL;
        END IF;
    END IF;

    -- Check if doctor is on leave on this date
    SELECT EXISTS (
        SELECT 1 FROM public.doctor_leave_dates
        WHERE doctor_id = p_doctor_id AND leave_date = p_appointment_date
    ) INTO v_is_leave;

    IF v_is_leave THEN
        RAISE EXCEPTION 'Doctor is on leave on the selected date.';
    END IF;

    -- Check for slot collision with existing active appointments
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.appointments
    WHERE doctor_id = p_doctor_id
      AND appointment_date = p_appointment_date
      AND start_time = p_start_time
      AND status NOT IN ('Rejected', 'Cancelled');

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'This time slot is already booked. Please choose another slot.';
    END IF;

    -- Insert new appointment
    INSERT INTO public.appointments (
        reference_number,
        patient_id,
        doctor_id,
        speciality_id,
        appointment_date,
        start_time,
        end_time,
        reason_for_visit,
        visit_type,
        status,
        patient_name,
        patient_phone,
        patient_email
    ) VALUES (
        p_reference_number,
        v_effective_patient_id,
        p_doctor_id,
        p_speciality_id,
        p_appointment_date,
        p_start_time,
        p_end_time,
        p_reason_for_visit,
        p_visit_type,
        'Pending',
        p_patient_name,
        p_patient_phone,
        p_patient_email
    ) RETURNING id INTO v_appointment_id;

    -- Log history
    INSERT INTO public.appointment_history (
        appointment_id,
        previous_status,
        new_status,
        action_type,
        changed_by,
        notes
    ) VALUES (
        v_appointment_id,
        'Pending',
        'Pending',
        'created',
        v_effective_patient_id,
        'Appointment booked'
    );

    RETURN v_appointment_id;
END;
$$;

-- 7. SEED DATA (Idempotent with ON CONFLICT)

-- Specialities
INSERT INTO public.specialities (id, name, slug, description, icon_name, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Cardiology', 'cardiology', 'Comprehensive cardiac care, angiography, angioplasty, pacemaker implantation, and preventative heart wellness.', 'HeartPulse', true),
  ('a1000000-0000-0000-0000-000000000002', 'Orthopaedics & Joint Replacement', 'orthopaedics', 'Advanced joint replacement (knee, hip), trauma surgery, arthroscopy, and spine rehabilitation.', 'Bone', true),
  ('a1000000-0000-0000-0000-000000000003', 'Neurology & Neurosurgery', 'neurology', 'Specialized management for stroke, epilepsy, Parkinson''s disease, neuro-trauma, and spine disorders.', 'Brain', true),
  ('a1000000-0000-0000-0000-000000000004', 'General & Internal Medicine', 'general-medicine', 'Diagnosis and non-surgical treatment of adult diseases, diabetes management, hypertension, and infectious diseases.', 'Stethoscope', true),
  ('a1000000-0000-0000-0000-000000000005', 'Paediatrics & Neonatology', 'paediatrics', 'Complete healthcare from newborn care (Level III NICU) to adolescent growth and developmental medicine.', 'Baby', true),
  ('a1000000-0000-0000-0000-000000000006', 'Oncology', 'oncology', 'Multidisciplinary cancer care with medical chemotherapy, surgical oncology, and radiation planning.', 'ShieldAlert', true),
  ('a1000000-0000-0000-0000-000000000007', 'Obstetrics & Gynaecology', 'gynaecology', 'High-risk pregnancy management, painless delivery, laparoscopic gynaecological surgeries, and fertility care.', 'UserCheck', true),
  ('a1000000-0000-0000-0000-000000000008', 'Nephrology & Dialysis', 'nephrology', 'Kidney disease management, acute renal care, 24/7 hemodialysis unit, and kidney transplant follow-up.', 'Activity', true)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  is_active = EXCLUDED.is_active;

-- Doctors
INSERT INTO public.doctors (
  id, name, speciality_id, qualifications, experience_years, bio, consultation_fee,
  photo_url, availability_status, slot_duration_minutes, working_hours_start,
  working_hours_end, working_days, rating, review_count, is_active
) VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'Dr. Rajesh Deshmukh',
    'a1000000-0000-0000-0000-000000000001',
    'MBBS, MD (Medicine), DM (Cardiology), FACC',
    18,
    'Senior Consultant Interventional Cardiologist with over 18 years of clinical expertise. Performed over 6,500+ successful coronary angioplasties and complex pacemaker implants.',
    900.00,
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600',
    'Available',
    30,
    '09:00',
    '15:00',
    ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    4.90,
    248,
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'Dr. Priya Kulkarni',
    'a1000000-0000-0000-0000-000000000007',
    'MBBS, MS (OBGYN), DNB, Fellow in Fetal Medicine',
    14,
    'Renowned Obstetrician & High-Risk Pregnancy Specialist. Expert in painless normal deliveries and minimally invasive robotic gynaecological surgery.',
    750.00,
    'https://images.unsplash.com/photo-1594824813633-4f98114674fe?auto=format&fit=crop&q=80&w=600',
    'Available',
    30,
    '10:00',
    '17:00',
    ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    4.95,
    312,
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'Dr. Anand Joshi',
    'a1000000-0000-0000-0000-000000000002',
    'MBBS, MS (Orthopaedics), M.Ch (Ortho - UK), FIJR',
    16,
    'Chief Joint Replacement and Arthroscopy Surgeon. Specialized in computer-navigated total knee and total hip arthroplasty with rapid post-op recovery protocol.',
    850.00,
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=600',
    'Available',
    30,
    '09:30',
    '16:30',
    ARRAY['Mon', 'Tue', 'Wed', 'Fri', 'Sat'],
    4.88,
    194,
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000004',
    'Dr. Meera Iyer',
    'a1000000-0000-0000-0000-000000000005',
    'MBBS, MD (Paediatrics), Fellowship in Neonatology (IAP)',
    12,
    'Caring paediatrician and neonatal intensivist passionate about child wellness, preventive immunization, infant nutrition, and developmental milestones.',
    650.00,
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=600',
    'Available',
    20,
    '11:00',
    '18:00',
    ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    4.92,
    276,
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000005',
    'Dr. Vikramaditya Shinde',
    'a1000000-0000-0000-0000-000000000003',
    'MBBS, MS (Gen Surgery), M.Ch (Neurosurgery - AIIMS)',
    20,
    'Former AIIMS senior neurosurgeon specializing in minimally invasive brain and spine surgery, stroke thrombolysis, and cranial endoscopic procedures.',
    1000.00,
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=600',
    'Available',
    30,
    '10:00',
    '16:00',
    ARRAY['Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    4.85,
    165,
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000006',
    'Dr. Sunita Patil',
    'a1000000-0000-0000-0000-000000000004',
    'MBBS, MD (General Medicine), PG Dip in Diabetology',
    15,
    'Dedicated physician specializing in chronic lifestyle diseases, diabetes control, geriatric care, thyroid disorders, and complex internal diagnostics.',
    600.00,
    'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=600',
    'Available',
    30,
    '08:30',
    '14:30',
    ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    4.90,
    320,
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000007',
    'Dr. Arvind Mahajan',
    'a1000000-0000-0000-0000-000000000006',
    'MBBS, MD, DM (Medical Oncology - Tata Memorial), ECMO',
    17,
    'Senior Medical Oncologist with expertise in targeted biological therapy, immunotherapy, and breast, lung, and gastrointestinal cancers.',
    1100.00,
    'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?auto=format&fit=crop&q=80&w=600',
    'Available',
    30,
    '12:00',
    '18:00',
    ARRAY['Mon', 'Wed', 'Fri'],
    4.96,
    142,
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000008',
    'Dr. Snehal Kute',
    'a1000000-0000-0000-0000-000000000008',
    'MBBS, MD (Medicine), DNB (Nephrology), FISN',
    11,
    'Nephrologist overseeing our advanced 24-bed hemodialysis center. Experienced in kidney transplant immunology, glomerulonephritis, and hypertension.',
    800.00,
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=600',
    'Available',
    30,
    '09:00',
    '15:00',
    ARRAY['Tue', 'Thu', 'Sat'],
    4.87,
    98,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  qualifications = EXCLUDED.qualifications,
  consultation_fee = EXCLUDED.consultation_fee,
  availability_status = EXCLUDED.availability_status;

-- Health Schemes
INSERT INTO public.health_schemes (
  id, name, code, category, description, coverage_amount,
  eligibility_criteria, benefits, required_documents, how_to_apply,
  official_url, hospital_acceptance_status, last_verified_date, official_source,
  is_published, helpline_number
) VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'Ayushman Bharat PM-JAY (Pradhan Mantri Jan Arogya Yojana)',
    'PM-JAY',
    'Central',
    'The world’s largest government-funded health assurance scheme providing comprehensive cashless secondary and tertiary hospitalization care across empaneled public and private hospitals.',
    '₹5,00,000 per family per year on a family floater basis',
    ARRAY[
      'Families identified under Socio-Economic Caste Census (SECC 2011) deprivation criteria in rural and urban areas.',
      'Active RSBY beneficiary families.',
      'All senior citizens aged 70 years and above (irrespective of income under expanded Ayushman Vay Vandana card).',
      'No cap on family size or age of family members.'
    ],
    ARRAY[
      '100% Cashless treatment at empaneled hospitals.',
      'Covers 1,949+ medical procedures including cardiac surgeries, oncology, joint replacement, and neurosurgery.',
      'Pre-hospitalization expenses up to 3 days and post-hospitalization up to 15 days including medicines and diagnostics.',
      'All pre-existing conditions covered from day one.'
    ],
    ARRAY[
      'Ayushman Card / PM-JAY Card (Physical or ABHA App digital copy)',
      'Aadhaar Card of the patient (for biometric authentication at hospital Arogya Mitra desk)',
      'Ration Card / Family Samagra ID establishing relationship'
    ],
    'Visit the hospital’s dedicated Ayushman Arogya Mitra Helpdesk in the Ground Floor Reception with your Aadhaar and Ration Card, or verify eligibility online at beneficiary.nha.gov.in using your mobile number.',
    'https://beneficiary.nha.gov.in',
    'Accepted',
    '2026-09-15',
    'National Health Authority (NHA), Government of India',
    true,
    '14555'
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)',
    'MJPJAY',
    'Maharashtra State',
    'Flagship health insurance scheme of the Government of Maharashtra providing universal health protection to state residents against catastrophic health expenditures.',
    'Up to ₹5,00,000 per family per year across 1,356 specified medical and surgical treatments',
    ARRAY[
      'Holders of Yellow, Orange (Priority Household), or Antyodaya Anna Yojana (AAY) ration cards in Maharashtra.',
      'Farmers from 14 agrarian distress districts of Vidarbha and Marathwada holding white ration cards.',
      'Must possess a valid domicile certificate of Maharashtra or local residence proof.',
      'No restriction on the family member count.'
    ],
    ARRAY[
      'Free end-to-end cashless consultation, surgical intervention, ICU care, medications, and clinical investigations.',
      'Covers high-end procedures including polytrauma, cardiac surgery, renal transplants, paediatric surgeries, and ICU care.',
      'Pre-procedure diagnostics and 10 days post-discharge medications.'
    ],
    ARRAY[
      'Valid Yellow / Orange / Antyodaya Ration Card',
      'Aadhaar Card / Voter ID of all admitted family members',
      'Doctor recommendation / Emergency referral slip from Shri Gajanan Hospital'
    ],
    'Report to our MJPJAY Helpdesk located near Casualty / Emergency. Our hospital Arogyamitra will inspect your ration card, assist in biometric verification, and generate pre-authorization instantly.',
    'https://www.jeevandayee.gov.in',
    'Accepted',
    '2026-10-01',
    'State Health Assurance Society (SHAS), Public Health Department, Govt. of Maharashtra',
    true,
    '155388 / 1800 233 2200'
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'Central Government Health Scheme (CGHS)',
    'CGHS',
    'Central',
    'Comprehensive healthcare facility for Central Government employees, pensioners, and their dependents residing in CGHS-covered cities.',
    'Comprehensive reimbursement or cashless facility as per CGHS prescribed package rates',
    ARRAY[
      'Serving Central Government employees receiving pay from Central Civil Estimates.',
      'All Central Government pensioners and their dependent family members.',
      'Members of Parliament, former Governors, and accredited journalists.'
    ],
    ARRAY[
      'OPD consultations and in-patient hospitalization at CGHS approved package rates.',
      'Cashless hospital admission for pensioners and senior beneficiaries upon referral.',
      'Coverage for life-saving emergency medical interventions without prior referral.'
    ],
    ARRAY[
      'Valid Plastic CGHS Card (Individual card for patient)',
      'Official CGHS Medical Officer referral letter (except in acute emergency cases)',
      'Government Photo ID (Aadhaar / Voter ID / PAN Card)'
    ],
    'Submit the CGHS referral letter along with your valid CGHS plastic card at our TPA / Institutional Desk in Wing B.',
    'https://cghs.nic.in',
    'Accepted',
    '2026-08-20',
    'Ministry of Health & Family Welfare (MoHFW), Govt. of India',
    true,
    '1800 208 8900'
  ),
  (
    'c1000000-0000-0000-0000-000000000004',
    'Employees'' State Insurance Scheme (ESIC)',
    'ESIC',
    'Central',
    'Integrated social security and health protection scheme providing full medical care to insured industrial and organized sector workers and their dependents.',
    'Unlimited medical benefit from day one of entering insurable employment',
    ARRAY[
      'Employees earning a monthly wage up to ₹21,000 (₹25,000 for persons with disabilities).',
      'Valid IP (Insured Person) number with up-to-date contribution status.'
    ],
    ARRAY[
      'Super-speciality cashless medical treatment for self and registered dependent family members.',
      'Full cover for cardiac surgery, neurosurgery, organ transplants, and cancer chemotherapy.',
      'Convalescence allowance during periods of temporary disablement.'
    ],
    ARRAY[
      'e-Pehchan Card (ESIC Insured Person card) verified online',
      'Form 16 or referral slip from the parent ESI Dispensary / Hospital',
      'Aadhaar card of patient and primary insured person'
    ],
    'Obtain an online referral from your nearest ESI Dispensary and report to our TPA Desk with your e-Pehchan card.',
    'https://www.esic.gov.in',
    'Under Verification',
    '2026-09-28',
    'Employees'' State Insurance Corporation, Ministry of Labour & Employment',
    true,
    '1800 11 2526'
  ),
  (
    'c1000000-0000-0000-0000-000000000005',
    'Rashtriya Arogya Nidhi (RAN)',
    'RAN',
    'Special Assistance',
    'Financial assistance scheme for poor patients living below the poverty line (BPL) who are suffering from major life-threatening diseases for treatment at designated super-speciality hospitals.',
    'One-time financial grant up to ₹15,00,000 for life-threatening diseases',
    ARRAY[
      'Patients from families living below poverty line (BPL) in any State/UT in India.',
      'Must not be covered under PM-JAY or any other health insurance scheme.'
    ],
    ARRAY[
      'Direct grant disbursement to the hospital for surgical interventions, bone marrow transplants, oncology treatments, and cardiology.'
    ],
    ARRAY[
      'Valid BPL Certificate / Income Certificate issued by Revenue Authority',
      'Medical cost estimate certificate signed by treating Head of Department',
      'Aadhaar Card and Bank details proof'
    ],
    'Consult with the Medical Social Work (MSW) department at Shri Gajanan Hospital to initiate an application to the MoHFW Technical Committee.',
    'https://mohfw.gov.in',
    'Accepted',
    '2026-07-15',
    'Ministry of Health and Family Welfare, New Delhi',
    true,
    '011-23061481'
  )
ON CONFLICT (code) DO UPDATE SET
  coverage_amount = EXCLUDED.coverage_amount,
  hospital_acceptance_status = EXCLUDED.hospital_acceptance_status,
  last_verified_date = EXCLUDED.last_verified_date;

-- Hospital Settings
INSERT INTO public.hospital_settings (
  id, hospital_name, tagline, phone, emergency_helpline, email,
  address, city, state, pincode, operating_hours, slot_duration_minutes,
  cancellation_window_hours, allow_patient_reschedule, default_appointment_status
) VALUES (
  'd1000000-0000-0000-0000-000000000001',
  'SmartCare Hospital - Shri Gajanan Multispeciality',
  'Excellence in Healthcare, Compassion in Healing',
  '+91 22 2845 6789',
  '+91 22 2845 9999',
  'contact@smartcarehospital.org',
  'Plot No. 42, Station Road, Near Gajanan Maharaj Mandir, Borivali West',
  'Mumbai',
  'Maharashtra',
  '400092',
  '24 Hours Emergency | OPD: Mon - Sat: 08:00 AM - 08:00 PM',
  30,
  4,
  true,
  'Pending'
)
ON CONFLICT (id) DO NOTHING;

-- Force PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';
