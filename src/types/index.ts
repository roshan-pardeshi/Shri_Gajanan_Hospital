export type Role = 'patient' | 'admin' | 'doctor' | 'staff';

export type AppointmentStatus = 
  | 'Pending' 
  | 'Approved' 
  | 'Rejected' 
  | 'Reschedule Requested' 
  | 'Rescheduled' 
  | 'Cancelled' 
  | 'Completed';

export type AvailabilityStatus = 'Available' | 'Not Available' | 'On Leave';

export type SchemeEmpanelmentStatus = 'Accepted' | 'Under Verification' | 'Not Empanelled';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  mobile_number: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  address?: string;
  role: Role;
  created_at?: string;
  is_admin_verified?: boolean;
}

export interface Speciality {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  is_active: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  speciality_id: string;
  speciality_name?: string;
  qualifications: string;
  experience_years: number;
  bio: string;
  consultation_fee: number;
  photo_url: string;
  availability_status: AvailabilityStatus;
  slot_duration_minutes: number;
  working_hours_start: string; // e.g. "09:00"
  working_hours_end: string;   // e.g. "17:00"
  working_days: string[];     // ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  leave_dates?: string[];     // YYYY-MM-DD
  rating?: number;
  review_count?: number;
  is_active: boolean;
}

export interface DoctorLeaveDate {
  id: string;
  doctor_id: string;
  leave_date: string; // YYYY-MM-DD
  reason?: string;
  created_at?: string;
}

export interface Appointment {
  id: string;
  reference_number: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  doctor_id: string;
  doctor_name?: string;
  doctor_photo?: string;
  speciality_id: string;
  speciality_name?: string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string;       // e.g. "10:30"
  end_time: string;         // e.g. "11:00"
  reason_for_visit: string;
  visit_type: 'first_visit' | 'follow_up';
  status: AppointmentStatus;
  rejection_reason?: string;
  cancellation_reason?: string;
  original_appointment_date?: string;
  original_start_time?: string;
  requested_reschedule_date?: string;
  requested_reschedule_time?: string;
  reschedule_reason?: string;
  booking_source?: 'ONLINE' | 'OFFLINE';
  patient_age?: number;
  patient_gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  created_at: string;
  updated_at: string;
}

export interface AppointmentHistory {
  id: string;
  appointment_id: string;
  previous_status: AppointmentStatus;
  new_status: AppointmentStatus;
  action_type: 'created' | 'approved' | 'rejected' | 'reschedule_requested' | 'rescheduled' | 'cancelled' | 'completed';
  changed_by: string;
  notes?: string;
  created_at: string;
}

export interface HealthScheme {
  id: string;
  name: string;
  code: string;
  category: 'Central' | 'Maharashtra State' | 'Special Assistance';
  description: string;
  coverage_amount: string;
  eligibility_criteria: string[];
  benefits: string[];
  required_documents: string[];
  how_to_apply: string;
  official_url: string;
  hospital_acceptance_status: SchemeEmpanelmentStatus;
  last_verified_date: string;
  official_source: string;
  is_published: boolean;
  helpline_number?: string;
}

export interface Notification {
  id: string;
  user_id?: string | null;
  title: string;
  message: string;
  type: 
    | 'appointment_request' 
    | 'appointment_approved' 
    | 'appointment_rejected' 
    | 'reschedule_request' 
    | 'reschedule_approved' 
    | 'reschedule_rejected' 
    | 'appointment_cancelled' 
    | 'general';
  is_read: boolean;
  reference_id?: string;
  created_at: string;
}

export interface HospitalSettings {
  id: string;
  hospital_name: string;
  tagline: string;
  phone: string;
  emergency_helpline: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  operating_hours: string;
  slot_duration_minutes: number;
  cancellation_window_hours: number;
  allow_patient_reschedule: boolean;
  default_appointment_status: AppointmentStatus;
}

export interface LaboratoryTest {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  sample_type?: string | null;
  preparation_instructions?: string | null;
  fasting_required: boolean;
  indicative_price?: number | null;
  turnaround_time?: string | null;
  is_available: boolean;
  is_published: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
}

export interface LaboratorySettings {
  id: string;
  lab_name: string;
  location: string;
  operating_hours: string;
  contact_phone: string;
  general_description: string;
  accepts_walkins: boolean;
  appointment_required: boolean;
  updated_at?: string;
}

export interface WebsiteSection {
  id: string;
  name: string;
  description?: string;
  is_visible: boolean;
  display_order?: number;
  updated_at?: string;
}

export type ReviewStatus = 'Pending' | 'Approved' | 'Rejected';

export interface PatientReview {
  id: string;
  patient_id?: string;
  patient_name?: string;
  patient_display_name?: string;
  patient_email?: string;
  patient_phone?: string;
  doctor_id: string;
  doctor_name: string;
  doctor_photo?: string;
  speciality_name?: string;
  appointment_id?: string;
  appointment_reference?: string;
  appointment_date?: string;
  rating: number;
  review_title?: string | null;
  review_message: string;
  status: ReviewStatus;
  created_at: string;
  updated_at?: string;
}

export interface ReviewStats {
  total_reviews?: number;
  pending_reviews?: number;
  approved_reviews?: number;
  rejected_reviews?: number;
  average_rating: number;
  total_approved_reviews?: number;
}

export interface EligibleAppointmentForReview {
  appointment_id: string;
  reference_number: string;
  appointment_date: string;
  start_time: string;
  doctor_id: string;
  doctor_name: string;
  doctor_photo?: string;
  speciality_name?: string;
  existing_review_id?: string | null;
  existing_review_status?: ReviewStatus | null;
}

export interface ChiefDoctorProfile {
  id: string;
  doctor_id?: string | null;
  name: string;
  designation: string;
  qualifications: string;
  speciality: string;
  experience_years: number;
  photo_url?: string | null;
  introduction: string;
  welcome_message: string;
  updated_at?: string;
  linked_doctor?: Doctor | null;
}


