-- =========================================================================
-- SmartCare Hospital Portal - Shri Gajanan Multispeciality Hospital
-- Local MySQL Database Schema
-- Database: smart_care_hospital
-- =========================================================================

CREATE DATABASE IF NOT EXISTS smart_care_hospital
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_care_hospital;

-- 1. PROFILES TABLE (Users & Patients & Admins)
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  full_name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(50) NOT NULL,
  date_of_birth DATE NULL,
  gender ENUM('Male', 'Female', 'Other', 'Prefer not to say') NULL,
  address TEXT NULL,
  role ENUM('patient', 'admin', 'doctor', 'staff') NOT NULL DEFAULT 'patient',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. USER ROLES TABLE (Role assignments & Admin Verification)
CREATE TABLE IF NOT EXISTS user_roles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('patient', 'admin', 'doctor', 'staff') NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by VARCHAR(36) NULL,
  UNIQUE KEY uk_user_role (user_id, role),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. SPECIALITIES TABLE
CREATE TABLE IF NOT EXISTS specialities (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NULL,
  icon_name VARCHAR(100) DEFAULT 'Activity',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS doctors (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  speciality_id VARCHAR(36) NOT NULL,
  qualifications VARCHAR(255) NOT NULL,
  experience_years INT NOT NULL DEFAULT 1,
  bio TEXT NULL,
  consultation_fee DECIMAL(10,2) DEFAULT 500.00,
  photo_url LONGTEXT NULL,
  availability_status ENUM('Available', 'Not Available', 'On Leave') DEFAULT 'Available',
  slot_duration_minutes INT DEFAULT 30,
  working_hours_start TIME DEFAULT '09:00:00',
  working_hours_end TIME DEFAULT '17:00:00',
  working_days JSON NULL,
  rating DECIMAL(3,2) DEFAULT 4.80,
  review_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (speciality_id) REFERENCES specialities(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. DOCTOR SCHEDULES TABLE (OPD Shifts)
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id VARCHAR(36) PRIMARY KEY,
  doctor_id VARCHAR(36) NOT NULL,
  day_of_week ENUM('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. DOCTOR LEAVE DATES TABLE
CREATE TABLE IF NOT EXISTS doctor_leave_dates (
  id VARCHAR(36) PRIMARY KEY,
  doctor_id VARCHAR(36) NOT NULL,
  leave_date DATE NOT NULL,
  reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_doctor_leave (doctor_id, leave_date),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(36) PRIMARY KEY,
  reference_number VARCHAR(50) NOT NULL UNIQUE,
  patient_id VARCHAR(36) NULL,
  patient_name VARCHAR(255) NULL,
  patient_phone VARCHAR(50) NULL,
  patient_email VARCHAR(255) NULL,
  doctor_id VARCHAR(36) NOT NULL,
  speciality_id VARCHAR(36) NOT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason_for_visit TEXT NOT NULL,
  visit_type ENUM('first_visit', 'follow_up') DEFAULT 'first_visit',
  status ENUM(
    'Pending', 
    'Approved', 
    'Rejected', 
    'Reschedule Requested', 
    'Rescheduled', 
    'Cancelled', 
    'Completed'
  ) NOT NULL DEFAULT 'Pending',
  rejection_reason TEXT NULL,
  cancellation_reason TEXT NULL,
  original_appointment_date DATE NULL,
  original_start_time TIME NULL,
  requested_reschedule_date DATE NULL,
  requested_reschedule_time TIME NULL,
  reschedule_reason TEXT NULL,
  active_slot_key VARCHAR(120) GENERATED ALWAYS AS (
    IF(status NOT IN ('Rejected', 'Cancelled'), CONCAT(doctor_id, '_', appointment_date, '_', start_time), NULL)
  ) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_active_slot (active_slot_key),
  FOREIGN KEY (patient_id) REFERENCES profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
  FOREIGN KEY (speciality_id) REFERENCES specialities(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. APPOINTMENT HISTORY (Audit trail)
CREATE TABLE IF NOT EXISTS appointment_history (
  id VARCHAR(36) PRIMARY KEY,
  appointment_id VARCHAR(36) NOT NULL,
  previous_status VARCHAR(50) NULL,
  new_status VARCHAR(50) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  changed_by VARCHAR(36) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. GOVERNMENT HEALTH SCHEMES TABLE
CREATE TABLE IF NOT EXISTS health_schemes (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  category ENUM('Central', 'Maharashtra State', 'Special Assistance') NOT NULL,
  description TEXT NOT NULL,
  coverage_amount VARCHAR(255) NOT NULL,
  eligibility_criteria JSON NOT NULL,
  benefits JSON NOT NULL,
  required_documents JSON NOT NULL,
  how_to_apply TEXT NOT NULL,
  official_url TEXT NOT NULL,
  hospital_acceptance_status ENUM('Accepted', 'Under Verification', 'Not Empanelled') NOT NULL DEFAULT 'Accepted',
  last_verified_date DATE NOT NULL,
  official_source TEXT NOT NULL,
  is_published BOOLEAN DEFAULT TRUE,
  helpline_number VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM(
    'appointment_request', 
    'appointment_approved', 
    'appointment_rejected', 
    'reschedule_request', 
    'reschedule_approved', 
    'reschedule_rejected', 
    'appointment_cancelled', 
    'general'
  ) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  reference_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. HOSPITAL SETTINGS TABLE
CREATE TABLE IF NOT EXISTS hospital_settings (
  id VARCHAR(36) PRIMARY KEY,
  hospital_name VARCHAR(255) NOT NULL DEFAULT 'SmartCare Hospital - Shri Gajanan Multispeciality',
  tagline TEXT NULL,
  phone VARCHAR(50) DEFAULT '+91 22 2845 6789',
  emergency_helpline VARCHAR(50) DEFAULT '+91 22 2845 9999',
  email VARCHAR(255) DEFAULT 'contact@smartcarehospital.org',
  address TEXT NULL,
  city VARCHAR(100) DEFAULT 'Mumbai',
  state VARCHAR(100) DEFAULT 'Maharashtra',
  pincode VARCHAR(20) DEFAULT '400068',
  operating_hours TEXT NULL,
  slot_duration_minutes INT DEFAULT 30,
  cancellation_window_hours INT DEFAULT 4,
  allow_patient_reschedule BOOLEAN DEFAULT TRUE,
  default_appointment_status VARCHAR(50) DEFAULT 'Pending',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. LABORATORY TESTS TABLE
CREATE TABLE IF NOT EXISTS laboratory_tests (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  sample_type VARCHAR(100) NULL,
  preparation_instructions TEXT NULL,
  fasting_required BOOLEAN NOT NULL DEFAULT FALSE,
  indicative_price DECIMAL(10,2) NULL,
  turnaround_time VARCHAR(100) NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(36) NULL,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_lab_published_avail (is_published, is_available, display_order),
  INDEX idx_lab_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. LABORATORY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS laboratory_settings (
  id VARCHAR(36) PRIMARY KEY,
  lab_name VARCHAR(255) NOT NULL DEFAULT 'Shri Gajanan Hospital Diagnostic Laboratory',
  location VARCHAR(255) NOT NULL,
  operating_hours TEXT NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  general_description TEXT NOT NULL,
  accepts_walkins BOOLEAN NOT NULL DEFAULT TRUE,
  appointment_required BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
