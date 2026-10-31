-- =========================================================================
-- SmartCare Hospital Portal - Shri Gajanan Multispeciality Hospital
-- Local MySQL Seed Data
-- Database: smart_care_hospital
-- =========================================================================

USE smart_care_hospital;

-- 1. PROFILES & USER ROLES (Default Admin and Demo Patient)
INSERT INTO profiles (
  id, email, password_hash, full_name, mobile_number, date_of_birth, gender, address, role
) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'admin@smartcarehospital.org',
  '$2b$10$6jnEdeqZMRiBoQKoIqiE1.zYAQh6IoBmbY8GY803ppSk4hEKHe3Fi',
  'Dr. Ramesh Shinde (Medical Superintendent)',
  '+91 98200 11223',
  '1975-04-12',
  'Male',
  'Administrative Wing, Shri Gajanan Multispeciality Hospital, Borivali West, Mumbai',
  'admin'
),
(
  'b0000000-0000-0000-0000-000000000002',
  'suresh.patil@example.com',
  '$2b$10$3zToDh0faWg.AGt.hfTP/OLwRkcXVt0mHqn1p4tTZeQjY2nXSEPIa',
  'Suresh Patil',
  '+91 98201 54321',
  '1984-06-15',
  'Male',
  'B-402, Gokul Heights, Borivali West, Mumbai, Maharashtra 400092',
  'patient'
)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  mobile_number = VALUES(mobile_number),
  role = VALUES(role);

INSERT INTO user_roles (id, user_id, role) VALUES
(
  'r0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'admin'
),
(
  'r0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000002',
  'patient'
)
ON DUPLICATE KEY UPDATE role = VALUES(role);

-- 2. SPECIALITIES
INSERT INTO specialities (id, name, slug, description, icon_name, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Cardiology', 'cardiology', 'Comprehensive cardiac care, angiography, angioplasty, pacemaker implantation, and preventative heart wellness.', 'HeartPulse', true),
  ('a1000000-0000-0000-0000-000000000002', 'Orthopaedics & Joint Replacement', 'orthopaedics', 'Advanced joint replacement (knee, hip), trauma surgery, arthroscopy, and spine rehabilitation.', 'Bone', true),
  ('a1000000-0000-0000-0000-000000000003', 'Neurology & Neurosurgery', 'neurology', 'Specialized management for stroke, epilepsy, Parkinson\'s disease, neuro-trauma, and spine disorders.', 'Brain', true),
  ('a1000000-0000-0000-0000-000000000004', 'General & Internal Medicine', 'general-medicine', 'Diagnosis and non-surgical treatment of adult diseases, diabetes management, hypertension, and infectious diseases.', 'Stethoscope', true),
  ('a1000000-0000-0000-0000-000000000005', 'Paediatrics & Neonatology', 'paediatrics', 'Complete healthcare from newborn care (Level III NICU) to adolescent growth and developmental medicine.', 'Baby', true),
  ('a1000000-0000-0000-0000-000000000006', 'Oncology', 'oncology', 'Multidisciplinary cancer care with medical chemotherapy, surgical oncology, and radiation planning.', 'ShieldAlert', true),
  ('a1000000-0000-0000-0000-000000000007', 'Obstetrics & Gynaecology', 'gynaecology', 'High-risk pregnancy management, painless delivery, laparoscopic gynaecological surgeries, and fertility care.', 'UserCheck', true),
  ('a1000000-0000-0000-0000-000000000008', 'Nephrology & Dialysis', 'nephrology', 'Kidney disease management, acute renal care, 24/7 hemodialysis unit, and kidney transplant follow-up.', 'Activity', true)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  icon_name = VALUES(icon_name),
  is_active = VALUES(is_active);

-- 3. DOCTORS
INSERT INTO doctors (
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
    '09:00:00',
    '15:00:00',
    '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]',
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
    '10:00:00',
    '17:00:00',
    '["Mon", "Tue", "Wed", "Thu", "Fri"]',
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
    '09:30:00',
    '16:30:00',
    '["Mon", "Tue", "Wed", "Fri", "Sat"]',
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
    '11:00:00',
    '18:00:00',
    '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]',
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
    '10:00:00',
    '16:00:00',
    '["Tue", "Wed", "Thu", "Fri", "Sat"]',
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
    '08:30:00',
    '14:30:00',
    '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]',
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
    '12:00:00',
    '18:00:00',
    '["Mon", "Wed", "Fri"]',
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
    '09:00:00',
    '15:00:00',
    '["Tue", "Thu", "Sat"]',
    4.87,
    98,
    true
  )
ON DUPLICATE KEY UPDATE
  qualifications = VALUES(qualifications),
  consultation_fee = VALUES(consultation_fee),
  availability_status = VALUES(availability_status),
  photo_url = VALUES(photo_url);

-- 4. HEALTH SCHEMES
INSERT INTO health_schemes (
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
    '["Families identified under Socio-Economic Caste Census (SECC 2011) deprivation criteria in rural and urban areas.", "Active RSBY beneficiary families.", "All senior citizens aged 70 years and above (irrespective of income under expanded Ayushman Vay Vandana card).", "No cap on family size or age of family members."]',
    '["100% Cashless treatment at empaneled hospitals.", "Covers 1,949+ medical procedures including cardiac surgeries, oncology, joint replacement, and neurosurgery.", "Pre-hospitalization expenses up to 3 days and post-hospitalization up to 15 days including medicines and diagnostics.", "All pre-existing conditions covered from day one."]',
    '["Ayushman Card / PM-JAY Card (Physical or ABHA App digital copy)", "Aadhaar Card of the patient (for biometric authentication at hospital Arogya Mitra desk)", "Ration Card / Family Samagra ID establishing relationship"]',
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
    '["Holders of Yellow, Orange (Priority Household), or Antyodaya Anna Yojana (AAY) ration cards in Maharashtra.", "Farmers from 14 agrarian distress districts of Vidarbha and Marathwada holding white ration cards.", "Must possess a valid domicile certificate of Maharashtra or local residence proof.", "No restriction on the family member count."]',
    '["Free end-to-end cashless consultation, surgical intervention, ICU care, medications, and clinical investigations.", "Covers high-end procedures including polytrauma, cardiac surgery, renal transplants, paediatric surgeries, and ICU care.", "Pre-procedure diagnostics and 10 days post-discharge medications."]',
    '["Valid Yellow / Orange / Antyodaya Ration Card", "Aadhaar Card / Voter ID of all admitted family members", "Doctor recommendation / Emergency referral slip from Shri Gajanan Hospital"]',
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
    '["Serving Central Government employees receiving pay from Central Civil Estimates.", "All Central Government pensioners and their dependent family members.", "Members of Parliament, former Governors, and accredited journalists."]',
    '["OPD consultations and in-patient hospitalization at CGHS approved package rates.", "Cashless hospital admission for pensioners and senior beneficiaries upon referral.", "Coverage for life-saving emergency medical interventions without prior referral."]',
    '["Valid Plastic CGHS Card (Individual card for patient)", "Official CGHS Medical Officer referral letter (except in acute emergency cases)", "Government Photo ID (Aadhaar / Voter ID / PAN Card)"]',
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
    'Employees\' State Insurance Scheme (ESIC)',
    'ESIC',
    'Central',
    'Integrated social security and health protection scheme providing full medical care to insured industrial and organized sector workers and their dependents.',
    'Unlimited medical benefit from day one of entering insurable employment',
    '["Employees earning a monthly wage up to ₹21,000 (₹25,000 for persons with disabilities).", "Valid IP (Insured Person) number with up-to-date contribution status."]',
    '["Super-speciality cashless medical treatment for self and registered dependent family members.", "Full cover for cardiac surgery, neurosurgery, organ transplants, and cancer chemotherapy.", "Convalescence allowance during periods of temporary disablement."]',
    '["e-Pehchan Card (ESIC Insured Person card) verified online", "Form 16 or referral slip from the parent ESI Dispensary / Hospital", "Aadhaar card of patient and primary insured person"]',
    'Obtain an online referral from your nearest ESI Dispensary and report to our TPA Desk with your e-Pehchan card.',
    'https://www.esic.gov.in',
    'Under Verification',
    '2026-09-28',
    'Employees\' State Insurance Corporation, Ministry of Labour & Employment',
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
    '["Patients from families living below poverty line (BPL) in any State/UT in India.", "Must not be covered under PM-JAY or any other health insurance scheme."]',
    '["Direct grant disbursement to the hospital for surgical interventions, bone marrow transplants, oncology treatments, and cardiology."]',
    '["Valid BPL Certificate / Income Certificate issued by Revenue Authority", "Medical cost estimate certificate signed by treating Head of Department", "Aadhaar Card and Bank details proof"]',
    'Consult with the Medical Social Work (MSW) department at Shri Gajanan Hospital to initiate an application to the MoHFW Technical Committee.',
    'https://mohfw.gov.in',
    'Accepted',
    '2026-07-15',
    'Ministry of Health and Family Welfare, New Delhi',
    true,
    '011-23061481'
  )
ON DUPLICATE KEY UPDATE
  coverage_amount = VALUES(coverage_amount),
  hospital_acceptance_status = VALUES(hospital_acceptance_status),
  last_verified_date = VALUES(last_verified_date);

-- 5. HOSPITAL SETTINGS
INSERT INTO hospital_settings (
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
ON DUPLICATE KEY UPDATE
  hospital_name = VALUES(hospital_name),
  phone = VALUES(phone),
  emergency_helpline = VALUES(emergency_helpline),
  email = VALUES(email);

-- 6. LABORATORY SETTINGS
INSERT INTO laboratory_settings (
  id, lab_name, location, operating_hours, contact_phone, general_description,
  accepts_walkins, appointment_required
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
ON DUPLICATE KEY UPDATE
  lab_name = VALUES(lab_name),
  location = VALUES(location),
  operating_hours = VALUES(operating_hours),
  contact_phone = VALUES(contact_phone);

-- 7. LABORATORY TESTS
INSERT INTO laboratory_tests (
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
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  indicative_price = VALUES(indicative_price),
  is_available = VALUES(is_available),
  is_published = VALUES(is_published);

-- 8. INITIAL NOTIFICATIONS
INSERT INTO notifications (
  id, user_id, title, message, type, is_read, reference_id, created_at
) VALUES
(
  'n1000000-0000-0000-0000-000000000001',
  NULL,
  'New Appointment Booking Request',
  'Patient Roshan Vijay Pardeshi booked Cardiology consultation with Dr. Rajesh Deshmukh (Ref: SGH-20261028-4449).',
  'appointment_request',
  FALSE,
  'd3df6a39-dba6-4d18-958d-a4e74ad14e81',
  NOW() - INTERVAL 15 MINUTE
),
(
  'n1000000-0000-0000-0000-000000000002',
  NULL,
  'Appointment Cancelled',
  'Patient Suresh Patil cancelled appointment Ref: SGH-20261110-5937 due to personal reasons.',
  'appointment_cancelled',
  FALSE,
  '51293f59-23a2-4384-b473-a44165449c10',
  NOW() - INTERVAL 45 MINUTE
),
(
  'n1000000-0000-0000-0000-000000000003',
  NULL,
  'Appointment Reschedule Request',
  'Patient requested rescheduling for appointment Ref: SGH-202610-8832 with Dr. Anand Joshi.',
  'reschedule_request',
  FALSE,
  NULL,
  NOW() - INTERVAL 2 HOUR
),
(
  'n1000000-0000-0000-0000-000000000004',
  NULL,
  'Government Health Scheme Empanelment',
  'Ayushman Bharat PM-JAY and MJPJAY annual empanelment verified and active for Shri Gajanan Multispeciality Hospital.',
  'general',
  TRUE,
  NULL,
  NOW() - INTERVAL 1 DAY
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  message = VALUES(message),
  type = VALUES(type);

