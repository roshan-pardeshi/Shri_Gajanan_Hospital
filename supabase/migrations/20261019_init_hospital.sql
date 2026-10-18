-- =========================================================================
-- SmartCare Hospital Portal - Shri Gajanan Multispeciality Hospital
-- Supabase PostgreSQL Database Schema & Security Policies (RLS)
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
    address TEXT,
    role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'admin', 'doctor', 'staff')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER ROLES TABLE (Role assignments)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('patient', 'admin', 'doctor', 'staff')),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES public.profiles(id),
    UNIQUE(user_id, role)
);

-- 3. SPECIALITIES TABLE
CREATE TABLE IF NOT EXISTS public.specialities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_name TEXT DEFAULT 'Activity',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    speciality_id UUID REFERENCES public.specialities(id) ON DELETE RESTRICT,
    qualifications TEXT NOT NULL,
    experience_years INTEGER NOT NULL DEFAULT 1,
    bio TEXT,
    consultation_fee NUMERIC(10,2) DEFAULT 500.00,
    photo_url TEXT,
    availability_status TEXT DEFAULT 'Available' CHECK (availability_status IN ('Available', 'Not Available', 'On Leave')),
    slot_duration_minutes INTEGER DEFAULT 30,
    working_hours_start TIME DEFAULT '09:00',
    working_hours_end TIME DEFAULT '17:00',
    working_days TEXT[] DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    rating NUMERIC(3,2) DEFAULT 4.8,
    review_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DOCTOR SCHEDULES TABLE (detailed Day-by-Day OPD shifts)
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DOCTOR LEAVE DATES TABLE
CREATE TABLE IF NOT EXISTS public.doctor_leave_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    leave_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(doctor_id, leave_date)
);

-- 7. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number TEXT NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    speciality_id UUID NOT NULL REFERENCES public.specialities(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason_for_visit TEXT NOT NULL,
    visit_type TEXT DEFAULT 'first_visit' CHECK (visit_type IN ('first_visit', 'follow_up')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN (
        'Pending', 
        'Approved', 
        'Rejected', 
        'Reschedule Requested', 
        'Rescheduled', 
        'Cancelled', 
        'Completed'
    )),
    rejection_reason TEXT,
    cancellation_reason TEXT,
    original_appointment_date DATE,
    original_start_time TIME,
    requested_reschedule_date DATE,
    requested_reschedule_time TIME,
    reschedule_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce NO duplicate bookings for same doctor at same date & time when appointment is active
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_doctor_slot_active 
ON public.appointments (doctor_id, appointment_date, start_time) 
WHERE status NOT IN ('Rejected', 'Cancelled');

-- 8. APPOINTMENT HISTORY (Audit trail)
CREATE TABLE IF NOT EXISTS public.appointment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    action_type TEXT NOT NULL,
    changed_by UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. GOVERNMENT HEALTH SCHEMES TABLE
CREATE TABLE IF NOT EXISTS public.health_schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('Central', 'Maharashtra State', 'Special Assistance')),
    description TEXT NOT NULL,
    coverage_amount TEXT NOT NULL,
    eligibility_criteria TEXT[] NOT NULL DEFAULT '{}',
    benefits TEXT[] NOT NULL DEFAULT '{}',
    required_documents TEXT[] NOT NULL DEFAULT '{}',
    how_to_apply TEXT NOT NULL,
    official_url TEXT NOT NULL,
    hospital_acceptance_status TEXT NOT NULL DEFAULT 'Accepted' CHECK (hospital_acceptance_status IN ('Accepted', 'Under Verification', 'Not Empanelled')),
    last_verified_date DATE NOT NULL DEFAULT CURRENT_DATE,
    official_source TEXT NOT NULL,
    is_published BOOLEAN DEFAULT TRUE,
    helpline_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'appointment_request', 
        'appointment_approved', 
        'appointment_rejected', 
        'reschedule_request', 
        'reschedule_approved', 
        'reschedule_rejected', 
        'appointment_cancelled', 
        'general'
    )),
    is_read BOOLEAN DEFAULT FALSE,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. HOSPITAL SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.hospital_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_name TEXT NOT NULL DEFAULT 'SmartCare Hospital - Shri Gajanan Multispeciality',
    tagline TEXT DEFAULT 'Excellence in Healthcare, Compassion in Healing',
    phone TEXT DEFAULT '+91 22 2845 6789',
    emergency_helpline TEXT DEFAULT '+91 22 2845 9999',
    email TEXT DEFAULT 'contact@smartcarehospital.org',
    address TEXT DEFAULT 'Plot No. 42, Station Road, Near Gajanan Maharaj Mandir',
    city TEXT DEFAULT 'Mumbai',
    state TEXT DEFAULT 'Maharashtra',
    pincode TEXT DEFAULT '400068',
    operating_hours TEXT DEFAULT '24 Hours Emergency | OPD: Mon - Sat: 08:00 AM - 08:00 PM',
    slot_duration_minutes INTEGER DEFAULT 30,
    cancellation_window_hours INTEGER DEFAULT 4,
    allow_patient_reschedule BOOLEAN DEFAULT TRUE,
    default_appointment_status TEXT DEFAULT 'Pending',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- DATABASE FUNCTIONS & CONFLICT SAFE TRANSACTION
-- =========================================================================

-- Safe appointment booking function preventing race condition
CREATE OR REPLACE FUNCTION public.book_appointment_safe(
    p_patient_id UUID,
    p_doctor_id UUID,
    p_speciality_id UUID,
    p_appointment_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_reason_for_visit TEXT,
    p_visit_type TEXT,
    p_reference_number TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conflict_count INTEGER;
    v_appointment_id UUID;
    v_is_leave BOOLEAN;
BEGIN
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
        status
    ) VALUES (
        p_reference_number,
        p_patient_id,
        p_doctor_id,
        p_speciality_id,
        p_appointment_date,
        p_start_time,
        p_end_time,
        p_reason_for_visit,
        p_visit_type,
        'Pending'
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
        p_patient_id,
        'Appointment booked by patient'
    );

    RETURN v_appointment_id;
END;
$$;

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_leave_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_settings ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins have full access to profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 2. Specialities & Doctors Public Read Policies
CREATE POLICY "Public can view active specialities" ON public.specialities
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can view active doctors" ON public.doctors
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can view doctor schedules" ON public.doctor_schedules
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can view doctor leaves" ON public.doctor_leave_dates
    FOR SELECT USING (TRUE);

CREATE POLICY "Public can view published schemes" ON public.health_schemes
    FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Public can view hospital settings" ON public.hospital_settings
    FOR SELECT USING (TRUE);

-- 3. Appointments Policies
CREATE POLICY "Patients can view own appointments" ON public.appointments
    FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can request reschedule or cancel own appointment" ON public.appointments
    FOR UPDATE USING (auth.uid() = patient_id);

CREATE POLICY "Admins have full access to appointments" ON public.appointments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Notifications Policies
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 5. Admin management policies for doctors & schemes
CREATE POLICY "Admins manage doctors" ON public.doctors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins manage health schemes" ON public.health_schemes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
