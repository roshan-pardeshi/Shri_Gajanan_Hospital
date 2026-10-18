import { 
  Appointment, 
  AppointmentStatus, 
  Doctor, 
  HealthScheme, 
  HospitalSettings, 
  Notification, 
  Speciality, 
  UserProfile 
} from '../types';
import { 
  INITIAL_APPOINTMENTS, 
  INITIAL_DOCTORS, 
  INITIAL_HEALTH_SCHEMES, 
  INITIAL_HOSPITAL_SETTINGS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_SPECIALITIES 
} from './mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEYS = {
  SPECIALITIES: 'sgh_specialities',
  DOCTORS: 'sgh_doctors',
  SCHEMES: 'sgh_schemes',
  APPOINTMENTS: 'sgh_appointments',
  SETTINGS: 'sgh_settings',
  NOTIFICATIONS: 'sgh_notifications',
  PROFILES: 'sgh_profiles',
};

// Safe LocalStorage helpers with automatic seed fallback
function loadFromStorage<T>(key: string, defaultData: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(item);
  } catch (err) {
    console.error(`Failed to load ${key} from storage:`, err);
    return defaultData;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save ${key} to storage:`, err);
  }
}

// Data Service Singleton
export const dataService = {
  // -------------------------------------------------------------
  // Specialities
  // -------------------------------------------------------------
  async getSpecialities(): Promise<Speciality[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('specialities')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (!error && data && data.length > 0) return data as Speciality[];
    }
    return loadFromStorage<Speciality[]>(STORAGE_KEYS.SPECIALITIES, INITIAL_SPECIALITIES);
  },

  // -------------------------------------------------------------
  // Doctors
  // -------------------------------------------------------------
  async getDoctors(specialityId?: string, query?: string): Promise<Doctor[]> {
    let list: Doctor[] = [];
    if (isSupabaseConfigured() && supabase) {
      let q = supabase.from('doctors').select('*, specialities(name)').eq('is_active', true);
      if (specialityId) q = q.eq('speciality_id', specialityId);
      const { data, error } = await q;
      if (!error && data && data.length > 0) {
        list = data.map((d: any) => ({
          ...d,
          speciality_name: d.specialities?.name || d.speciality_name
        }));
      }
    }

    if (list.length === 0) {
      list = loadFromStorage<Doctor[]>(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
    }

    if (specialityId) {
      list = list.filter(d => d.speciality_id === specialityId);
    }

    if (query && query.trim() !== '') {
      const qLower = query.toLowerCase();
      list = list.filter(d => 
        d.name.toLowerCase().includes(qLower) || 
        d.speciality_name?.toLowerCase().includes(qLower) ||
        d.qualifications.toLowerCase().includes(qLower)
      );
    }

    return list;
  },

  async getDoctorById(id: string): Promise<Doctor | null> {
    const doctors = await this.getDoctors();
    return doctors.find(d => d.id === id) || null;
  },

  async updateDoctor(id: string, updates: Partial<Doctor>): Promise<Doctor> {
    const doctors = loadFromStorage<Doctor[]>(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
    const index = doctors.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Doctor not found');

    doctors[index] = { ...doctors[index], ...updates };
    saveToStorage(STORAGE_KEYS.DOCTORS, doctors);

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('doctors').update(updates).eq('id', id);
    }

    return doctors[index];
  },

  async addDoctor(newDoctor: Omit<Doctor, 'id'>): Promise<Doctor> {
    const doctors = loadFromStorage<Doctor[]>(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
    const doctor: Doctor = {
      ...newDoctor,
      id: `doc-${Date.now()}`
    };
    doctors.push(doctor);
    saveToStorage(STORAGE_KEYS.DOCTORS, doctors);

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('doctors').insert([doctor]);
    }

    return doctor;
  },

  // -------------------------------------------------------------
  // Slot Computation & Conflict Validation
  // -------------------------------------------------------------
  async getAvailableSlots(doctorId: string, dateStr: string): Promise<{ time: string; isBooked: boolean; isPast: boolean }[]> {
    const doctor = await this.getDoctorById(doctorId);
    if (!doctor) return [];

    const selectedDate = new Date(dateStr + 'T00:00:00');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const selectedDayName = dayNames[selectedDate.getDay()];

    // If doctor does not work on this day
    if (!doctor.working_days.includes(selectedDayName)) {
      return [];
    }

    // If doctor is on leave on this date
    if (doctor.leave_dates && doctor.leave_dates.includes(dateStr)) {
      return [];
    }

    if (doctor.availability_status === 'On Leave' || doctor.availability_status === 'Not Available') {
      return [];
    }

    // Get all active appointments for this doctor on this date
    const allAppointments = await this.getAppointments();
    const bookedAppointments = allAppointments.filter(a => 
      a.doctor_id === doctorId && 
      (a.appointment_date === dateStr || a.requested_reschedule_date === dateStr) &&
      !['Cancelled', 'Rejected'].includes(a.status)
    );

    const bookedTimes = new Set(bookedAppointments.map(a => 
      a.requested_reschedule_date === dateStr && a.requested_reschedule_time 
        ? a.requested_reschedule_time 
        : a.start_time
    ));

    // Generate slots in working hours
    const [startH, startM] = doctor.working_hours_start.split(':').map(Number);
    const [endH, endM] = doctor.working_hours_end.split(':').map(Number);
    const duration = doctor.slot_duration_minutes || 30;

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    const slots: { time: string; isBooked: boolean; isPast: boolean }[] = [];
    const now = new Date();
    const isToday = now.toISOString().split('T')[0] === dateStr;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (let m = startTotal; m + duration <= endTotal; m += duration) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      const isPast = isToday && m <= currentMinutes;
      const isBooked = bookedTimes.has(timeStr);

      slots.push({
        time: timeStr,
        isBooked,
        isPast,
      });
    }

    return slots;
  },

  // -------------------------------------------------------------
  // Appointments Management
  // -------------------------------------------------------------
  async getAppointments(filters?: { patientId?: string; doctorId?: string; status?: string }): Promise<Appointment[]> {
    let list: Appointment[] = [];
    if (isSupabaseConfigured() && supabase) {
      let q = supabase.from('appointments').select('*').order('created_at', { ascending: false });
      if (filters?.patientId) q = q.eq('patient_id', filters.patientId);
      if (filters?.doctorId) q = q.eq('doctor_id', filters.doctorId);
      if (filters?.status) q = q.eq('status', filters.status);
      const { data, error } = await q;
      if (!error && data) list = data as Appointment[];
    }

    if (list.length === 0) {
      list = loadFromStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    }

    if (filters?.patientId) {
      list = list.filter(a => a.patient_id === filters.patientId);
    }
    if (filters?.doctorId) {
      list = list.filter(a => a.doctor_id === filters.doctorId);
    }
    if (filters?.status && filters.status !== 'All') {
      list = list.filter(a => a.status === filters.status);
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async bookAppointment(params: {
    patient_id: string;
    patient_name: string;
    patient_phone: string;
    patient_email?: string;
    doctor_id: string;
    speciality_id: string;
    appointment_date: string;
    start_time: string;
    reason_for_visit: string;
    visit_type?: 'first_visit' | 'follow_up';
  }): Promise<Appointment> {
    const doctor = await this.getDoctorById(params.doctor_id);
    const specialities = await this.getSpecialities();
    const speciality = specialities.find(s => s.id === params.speciality_id);

    // Compute end_time based on doctor's slot duration
    const [h, m] = params.start_time.split(':').map(Number);
    const duration = doctor?.slot_duration_minutes || 30;
    const endTotal = h * 60 + m + duration;
    const endH = Math.floor(endTotal / 60);
    const endMin = endTotal % 60;
    const end_time = `${String(endH).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    // Conflict prevention check
    const currentAppointments = await this.getAppointments();
    const conflict = currentAppointments.find(a => 
      a.doctor_id === params.doctor_id &&
      a.appointment_date === params.appointment_date &&
      a.start_time === params.start_time &&
      !['Rejected', 'Cancelled'].includes(a.status)
    );

    if (conflict) {
      throw new Error(`This slot (${params.start_time} on ${params.appointment_date}) has just been booked. Please choose an alternate slot.`);
    }

    // Generate unique reference number: SGH-YYYYMM-XXXX
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    const reference_number = `SGH-${ym}-${rand}`;

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      reference_number,
      patient_id: params.patient_id,
      patient_name: params.patient_name,
      patient_phone: params.patient_phone,
      patient_email: params.patient_email,
      doctor_id: params.doctor_id,
      doctor_name: doctor?.name,
      doctor_photo: doctor?.photo_url,
      speciality_id: params.speciality_id,
      speciality_name: speciality?.name,
      appointment_date: params.appointment_date,
      start_time: params.start_time,
      end_time,
      reason_for_visit: params.reason_for_visit,
      visit_type: params.visit_type || 'first_visit',
      status: 'Pending',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const appointments = loadFromStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    appointments.unshift(newAppointment);
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments);

    // Create notification
    await this.createNotification({
      user_id: params.patient_id,
      title: 'Appointment Request Submitted',
      message: `Your appointment request ${reference_number} with ${doctor?.name || 'Doctor'} has been submitted and is pending verification.`,
      type: 'appointment_request',
      reference_id: newAppointment.id,
    });

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('appointments').insert([newAppointment]);
    }

    return newAppointment;
  },

  async rescheduleAppointment(
    appointmentId: string, 
    newDate: string, 
    newTime: string, 
    reason: string
  ): Promise<Appointment> {
    const appointments = loadFromStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const index = appointments.findIndex(a => a.id === appointmentId);
    if (index === -1) throw new Error('Appointment not found');

    const appointment = appointments[index];

    // Check slot availability for new date & time
    const conflict = appointments.find(a => 
      a.id !== appointmentId &&
      a.doctor_id === appointment.doctor_id &&
      (a.appointment_date === newDate || a.requested_reschedule_date === newDate) &&
      (a.start_time === newTime || a.requested_reschedule_time === newTime) &&
      !['Rejected', 'Cancelled'].includes(a.status)
    );

    if (conflict) {
      throw new Error('Requested new slot is already booked. Please choose an alternate slot.');
    }

    const updated: Appointment = {
      ...appointment,
      status: 'Reschedule Requested',
      original_appointment_date: appointment.original_appointment_date || appointment.appointment_date,
      original_start_time: appointment.original_start_time || appointment.start_time,
      requested_reschedule_date: newDate,
      requested_reschedule_time: newTime,
      reschedule_reason: reason,
      updated_at: new Date().toISOString(),
    };

    appointments[index] = updated;
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments);

    await this.createNotification({
      user_id: appointment.patient_id,
      title: 'Reschedule Request Received',
      message: `Your request to reschedule appointment ${appointment.reference_number} to ${newDate} at ${newTime} has been submitted for administrator approval.`,
      type: 'reschedule_request',
      reference_id: appointment.id,
    });

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('appointments').update(updated).eq('id', appointmentId);
    }

    return updated;
  },

  async cancelAppointment(appointmentId: string, reason: string): Promise<Appointment> {
    const appointments = loadFromStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const index = appointments.findIndex(a => a.id === appointmentId);
    if (index === -1) throw new Error('Appointment not found');

    const appointment = appointments[index];
    const updated: Appointment = {
      ...appointment,
      status: 'Cancelled',
      cancellation_reason: reason,
      updated_at: new Date().toISOString(),
    };

    appointments[index] = updated;
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments);

    await this.createNotification({
      user_id: appointment.patient_id,
      title: 'Appointment Cancelled',
      message: `Your appointment ${appointment.reference_number} has been cancelled. Slot has been released.`,
      type: 'appointment_cancelled',
      reference_id: appointment.id,
    });

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('appointments').update(updated).eq('id', appointmentId);
    }

    return updated;
  },

  async updateAppointmentStatus(
    appointmentId: string, 
    newStatus: AppointmentStatus, 
    rejectionReason?: string
  ): Promise<Appointment> {
    const appointments = loadFromStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const index = appointments.findIndex(a => a.id === appointmentId);
    if (index === -1) throw new Error('Appointment not found');

    const appointment = appointments[index];
    let updated: Appointment = {
      ...appointment,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'Rejected' && rejectionReason) {
      updated.rejection_reason = rejectionReason;
    }

    // If approving a reschedule request, apply the new date and time
    if (newStatus === 'Approved' && appointment.status === 'Reschedule Requested' && appointment.requested_reschedule_date) {
      updated.appointment_date = appointment.requested_reschedule_date;
      updated.start_time = appointment.requested_reschedule_time || appointment.start_time;
      updated.status = 'Rescheduled';
    }

    appointments[index] = updated;
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments);

    // Notify patient
    let notifTitle = `Appointment ${newStatus}`;
    let notifMsg = `Your appointment ${appointment.reference_number} status has been updated to ${newStatus}.`;
    let notifType: Notification['type'] = 'general';

    if (newStatus === 'Approved' || updated.status === 'Rescheduled') {
      notifTitle = 'Appointment Confirmed';
      notifMsg = `Your appointment ${appointment.reference_number} with ${appointment.doctor_name} on ${updated.appointment_date} at ${updated.start_time} has been approved!`;
      notifType = 'appointment_approved';
    } else if (newStatus === 'Rejected') {
      notifTitle = 'Appointment Declined';
      notifMsg = `Your appointment ${appointment.reference_number} was declined. Reason: ${rejectionReason || 'Doctor unavailable'}.`;
      notifType = 'appointment_rejected';
    }

    await this.createNotification({
      user_id: appointment.patient_id,
      title: notifTitle,
      message: notifMsg,
      type: notifType,
      reference_id: appointment.id,
    });

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('appointments').update(updated).eq('id', appointmentId);
    }

    return updated;
  },

  // -------------------------------------------------------------
  // Health Schemes
  // -------------------------------------------------------------
  async getHealthSchemes(): Promise<HealthScheme[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('health_schemes').select('*').order('name');
      if (!error && data && data.length > 0) return data as HealthScheme[];
    }
    return loadFromStorage<HealthScheme[]>(STORAGE_KEYS.SCHEMES, INITIAL_HEALTH_SCHEMES);
  },

  async updateHealthScheme(id: string, updates: Partial<HealthScheme>): Promise<HealthScheme> {
    const schemes = loadFromStorage<HealthScheme[]>(STORAGE_KEYS.SCHEMES, INITIAL_HEALTH_SCHEMES);
    const index = schemes.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Scheme not found');

    schemes[index] = { ...schemes[index], ...updates };
    saveToStorage(STORAGE_KEYS.SCHEMES, schemes);

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('health_schemes').update(updates).eq('id', id);
    }

    return schemes[index];
  },

  async addHealthScheme(newScheme: Omit<HealthScheme, 'id'>): Promise<HealthScheme> {
    const schemes = loadFromStorage<HealthScheme[]>(STORAGE_KEYS.SCHEMES, INITIAL_HEALTH_SCHEMES);
    const scheme: HealthScheme = {
      ...newScheme,
      id: `scheme-${Date.now()}`
    };
    schemes.push(scheme);
    saveToStorage(STORAGE_KEYS.SCHEMES, schemes);

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('health_schemes').insert([scheme]);
    }

    return scheme;
  },

  // -------------------------------------------------------------
  // Hospital Settings
  // -------------------------------------------------------------
  async getHospitalSettings(): Promise<HospitalSettings> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('hospital_settings').select('*').limit(1).single();
      if (!error && data) return data as HospitalSettings;
    }
    return loadFromStorage<HospitalSettings>(STORAGE_KEYS.SETTINGS, INITIAL_HOSPITAL_SETTINGS);
  },

  async updateHospitalSettings(updates: Partial<HospitalSettings>): Promise<HospitalSettings> {
    const current = loadFromStorage<HospitalSettings>(STORAGE_KEYS.SETTINGS, INITIAL_HOSPITAL_SETTINGS);
    const updated = { ...current, ...updates };
    saveToStorage(STORAGE_KEYS.SETTINGS, updated);

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('hospital_settings').update(updates).eq('id', current.id);
    }

    return updated;
  },

  // -------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------
  async getNotifications(userId: string): Promise<Notification[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) return data as Notification[];
    }
    const notifs = loadFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    return notifs.filter(n => n.user_id === userId || n.user_id === 'all');
  },

  async createNotification(notif: Omit<Notification, 'id' | 'is_read' | 'created_at'>): Promise<Notification> {
    const notifications = loadFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    notifications.unshift(newNotif);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('notifications').insert([newNotif]);
    }

    return newNotif;
  },

  async markNotificationRead(id: string): Promise<void> {
    const notifications = loadFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].is_read = true;
      saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    }

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    const notifications = loadFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    notifications.forEach(n => {
      if (n.user_id === userId || n.user_id === 'all') {
        n.is_read = true;
      }
    });
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
    }
  }
};
