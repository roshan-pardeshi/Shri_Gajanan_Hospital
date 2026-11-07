import { 
  Appointment, 
  Doctor, 
  HealthScheme, 
  HospitalSettings, 
  Notification, 
  Speciality, 
  LaboratoryTest,
  LaboratorySettings,
  WebsiteSection,
  PatientReview,
  ReviewStats,
  EligibleAppointmentForReview,
  ReviewStatus,
  ChiefDoctorProfile
} from '../types';
import { 
  INITIAL_APPOINTMENTS, 
  INITIAL_DOCTORS, 
  INITIAL_HEALTH_SCHEMES, 
  INITIAL_HOSPITAL_SETTINGS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_SPECIALITIES,
  INITIAL_LABORATORY_TESTS,
  INITIAL_LABORATORY_SETTINGS,
  INITIAL_WEBSITE_SECTIONS,
  INITIAL_CHIEF_DOCTOR_PROFILE
} from './mockData';
import { api } from './apiClient';

// Helper to check valid UUID v4
export const isUUID = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

// Data Service Singleton connecting directly to MySQL Backend API
export const dataService = {
  // -------------------------------------------------------------
  // Specialities
  // -------------------------------------------------------------
  async getSpecialities(): Promise<Speciality[]> {
    try {
      const data = await api.get<Speciality[]>('/specialities');
      if (data && data.length > 0) return data;
    } catch (err) {
      console.warn('API getSpecialities fallback:', err);
    }
    return INITIAL_SPECIALITIES;
  },

  // -------------------------------------------------------------
  // Doctors
  // -------------------------------------------------------------
  async getDoctors(specialityId?: string, query?: string): Promise<Doctor[]> {
    try {
      const params = new URLSearchParams();
      if (specialityId) params.append('specialityId', specialityId);
      if (query) params.append('query', query);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const data = await api.get<Doctor[]>(`/doctors${queryString}`);
      if (data) return data;
    } catch (err) {
      console.warn('API getDoctors fallback:', err);
    }

    let filtered = INITIAL_DOCTORS;
    if (specialityId) {
      filtered = filtered.filter(d => d.speciality_id === specialityId);
    }
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.qualifications.toLowerCase().includes(q) ||
        (d.speciality_name && d.speciality_name.toLowerCase().includes(q))
      );
    }
    return filtered;
  },

  async getDoctorById(id: string): Promise<Doctor | null> {
    try {
      const doc = await api.get<Doctor>(`/doctors/${id}`);
      if (doc) return doc;
    } catch (err) {
      console.warn('API getDoctorById fallback:', err);
    }
    return INITIAL_DOCTORS.find(d => d.id === id) || null;
  },

  async deleteDoctor(id: string): Promise<boolean> {
    try {
      await api.delete(`/doctors/${id}`);
      return true;
    } catch (err: any) {
      console.error('API deleteDoctor error:', err);
      throw new Error(err.message || 'Failed to delete doctor');
    }
  },

  async updateDoctor(id: string, updates: Partial<Doctor>): Promise<Doctor> {
    try {
      const updated = await api.put<Doctor>(`/doctors/${id}`, updates);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('doctors-updated', { detail: updated }));
        window.dispatchEvent(new CustomEvent('doctor-availability-changed', { detail: updated }));
      }
      return updated;
    } catch (err: any) {
      console.error('API updateDoctor error:', err);
      throw new Error(err.message || 'Failed to update doctor');
    }
  },

  async addDoctor(newDoctor: Omit<Doctor, 'id'>): Promise<Doctor> {
    try {
      const created = await api.post<Doctor>('/doctors', newDoctor);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('doctors-updated', { detail: created }));
        window.dispatchEvent(new CustomEvent('doctor-availability-changed', { detail: created }));
      }
      return created;
    } catch (err: any) {
      console.error('API addDoctor error:', err);
      throw new Error(err.message || 'Failed to add doctor');
    }
  },

  async getAvailableSlots(doctorId: string, dateStr: string): Promise<{ time: string; isBooked: boolean; isPast: boolean }[]> {
    try {
      const res = await api.get<{ onLeave: boolean; slots: { time: string; isBooked: boolean; isPast: boolean }[] }>(
        `/doctors/${doctorId}/slots?date=${dateStr}`
      );
      if (res && Array.isArray(res.slots)) {
        return res.slots;
      }
    } catch (err) {
      console.warn('API getAvailableSlots fallback:', err);
    }

    // Default fallback OPD slots
    const defaultTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
    return defaultTimes.map(time => ({
      time,
      isBooked: false,
      isPast: false,
    }));
  },

  async getDoctorSlotSchedule(doctorId: string, dateStr: string): Promise<{ onLeave: boolean; slots: { time: string; isBooked: boolean; isPast: boolean }[] }> {
    try {
      const res = await api.get<{ onLeave: boolean; slots: { time: string; isBooked: boolean; isPast: boolean }[] }>(
        `/doctors/${doctorId}/slots?date=${dateStr}`
      );
      if (res) {
        return {
          onLeave: Boolean(res.onLeave),
          slots: Array.isArray(res.slots) ? res.slots : [],
        };
      }
    } catch (err) {
      console.warn('API getDoctorSlotSchedule fallback:', err);
    }
    return { onLeave: false, slots: [] };
  },

  // -------------------------------------------------------------
  // Appointments
  // -------------------------------------------------------------
  async getAppointments(filters?: { patientId?: string; doctorId?: string; status?: string; dateScope?: string; date?: string }): Promise<Appointment[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.patientId) params.append('patientId', filters.patientId);
      if (filters?.doctorId) params.append('doctorId', filters.doctorId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.dateScope) params.append('dateScope', filters.dateScope);
      if (filters?.date) params.append('date', filters.date);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const appointments = await api.get<Appointment[]>(`/appointments${queryString}`);
      if (appointments) return appointments;
    } catch (err) {
      console.warn('API getAppointments fallback:', err);
    }
    return INITIAL_APPOINTMENTS;
  },

  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    try {
      const apt = await api.get<Appointment>(`/appointments/${appointmentId}`);
      if (apt) return apt;
    } catch (err) {
      console.warn('API getAppointmentById fallback:', err);
    }
    return INITIAL_APPOINTMENTS.find(a => a.id === appointmentId) || null;
  },

  async bookAppointment(params: {
    doctorId?: string;
    doctor_id?: string;
    specialityId?: string;
    speciality_id?: string;
    appointmentDate?: string;
    appointment_date?: string;
    startTime?: string;
    start_time?: string;
    endTime?: string;
    end_time?: string;
    reasonForVisit?: string;
    reason_for_visit?: string;
    visitType?: 'first_visit' | 'follow_up';
    visit_type?: 'first_visit' | 'follow_up';
    patientId?: string | null;
    patient_id?: string | null;
    patientName?: string;
    patient_name?: string;
    patientPhone?: string;
    patient_phone?: string;
    patientEmail?: string;
    patient_email?: string;
  }): Promise<Appointment> {
    try {
      const payload = {
        doctor_id: params.doctor_id || params.doctorId,
        speciality_id: params.speciality_id || params.specialityId,
        appointment_date: params.appointment_date || params.appointmentDate,
        start_time: params.start_time || params.startTime,
        end_time: params.end_time || params.endTime || '10:00',
        reason_for_visit: params.reason_for_visit || params.reasonForVisit,
        visit_type: params.visit_type || params.visitType || 'first_visit',
        patient_id: params.patient_id !== undefined ? params.patient_id : params.patientId,
        patient_name: params.patient_name || params.patientName,
        patient_phone: params.patient_phone || params.patientPhone,
        patient_email: params.patient_email || params.patientEmail,
      };

      const result = await api.post<Appointment>('/appointments/book', payload);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('appointment-booked', { detail: result }));
        window.dispatchEvent(new CustomEvent('doctor-availability-changed', { detail: result }));
        try {
          localStorage.setItem('sgh_last_appointment_sync', String(Date.now()));
        } catch {}
      }
      return result;
    } catch (err: any) {
      console.error('API bookAppointment error:', err);
      throw new Error(err.message || 'Failed to book appointment in MySQL database.');
    }
  },

  async addOfflineAppointment(params: {
    patient_name: string;
    patient_phone: string;
    age?: number | string;
    gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
    speciality_id: string;
    doctor_id: string;
    appointment_date: string;
    start_time: string;
    end_time?: string;
    notes?: string;
  }): Promise<Appointment> {
    try {
      const result = await api.post<Appointment>('/appointments/offline', params);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('appointment-booked', { detail: result }));
        window.dispatchEvent(new CustomEvent('doctor-availability-changed', { detail: result }));
        try {
          localStorage.setItem('sgh_last_appointment_sync', String(Date.now()));
        } catch {}
      }
      return result;
    } catch (err: any) {
      console.error('API addOfflineAppointment error:', err);
      throw new Error(err.message || 'Failed to add offline patient appointment');
    }
  },

  async rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newTime: string,
    reason: string
  ): Promise<Appointment> {
    try {
      const result = await api.put<Appointment>(`/appointments/${appointmentId}/reschedule`, {
        newDate,
        newTime,
        reason,
      });
      return result;
    } catch (err: any) {
      console.error('API rescheduleAppointment error:', err);
      throw new Error(err.message || 'Failed to reschedule appointment');
    }
  },

  async cancelAppointment(appointmentId: string, reason: string): Promise<Appointment> {
    try {
      const result = await api.put<Appointment>(`/appointments/${appointmentId}/cancel`, {
        reason,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('appointment-updated', { detail: result }));
        window.dispatchEvent(new CustomEvent('doctor-availability-changed', { detail: result }));
        try {
          localStorage.setItem('sgh_last_appointment_sync', String(Date.now()));
        } catch {}
      }
      return result;
    } catch (err: any) {
      console.error('API cancelAppointment error:', err);
      throw new Error(err.message || 'Failed to cancel appointment');
    }
  },

  async updateAppointmentStatus(
    appointmentId: string,
    status: any,
    rejectionReason?: string,
    notes?: string
  ): Promise<Appointment> {
    try {
      const result = await api.put<Appointment>(`/appointments/${appointmentId}/status`, {
        status,
        rejection_reason: rejectionReason,
        notes,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('appointment-updated', { detail: result }));
        window.dispatchEvent(new CustomEvent('doctor-availability-changed', { detail: result }));
        try {
          localStorage.setItem('sgh_last_appointment_sync', String(Date.now()));
        } catch {}
      }
      return result;
    } catch (err: any) {
      console.error('API updateAppointmentStatus error:', err);
      throw new Error(err.message || 'Failed to update appointment status');
    }
  },

  // -------------------------------------------------------------
  // Health Schemes
  // -------------------------------------------------------------
  async getHealthSchemes(): Promise<HealthScheme[]> {
    try {
      const schemes = await api.get<HealthScheme[]>('/schemes?includeUnpublished=true');
      if (Array.isArray(schemes)) return schemes;
    } catch (err) {
      console.warn('API getHealthSchemes fallback:', err);
    }
    return INITIAL_HEALTH_SCHEMES;
  },

  async updateHealthScheme(id: string, updates: Partial<HealthScheme>): Promise<HealthScheme> {
    try {
      const updated = await api.put<HealthScheme>(`/schemes/${id}`, updates);
      return updated;
    } catch (err: any) {
      console.error('API updateHealthScheme error:', err);
      throw new Error(err.message || 'Failed to update health scheme');
    }
  },

  async addHealthScheme(newScheme: Omit<HealthScheme, 'id'>): Promise<HealthScheme> {
    try {
      const created = await api.post<HealthScheme>('/schemes', newScheme);
      return created;
    } catch (err: any) {
      console.error('API addHealthScheme error:', err);
      throw new Error(err.message || 'Failed to add health scheme');
    }
  },

  async deleteHealthScheme(id: string): Promise<boolean> {
    try {
      await api.delete(`/schemes/${id}`);
      return true;
    } catch (err: any) {
      console.error('API deleteHealthScheme error:', err);
      throw new Error(err.message || 'Failed to delete health scheme');
    }
  },

  // -------------------------------------------------------------
  // Hospital Settings
  // -------------------------------------------------------------
  async getHospitalSettings(): Promise<HospitalSettings> {
    try {
      const settings = await api.get<HospitalSettings>('/settings');
      if (settings) return settings;
    } catch (err) {
      console.warn('API getHospitalSettings fallback:', err);
    }
    return INITIAL_HOSPITAL_SETTINGS;
  },

  async updateHospitalSettings(updates: Partial<HospitalSettings>): Promise<HospitalSettings> {
    try {
      const updated = await api.put<HospitalSettings>('/settings', updates);
      return updated;
    } catch (err: any) {
      console.error('API updateHospitalSettings error:', err);
      throw new Error(err.message || 'Failed to update hospital settings');
    }
  },

  // -------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------
  async getNotifications(userId?: string, isAdmin: boolean = false): Promise<Notification[]> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (isAdmin) params.append('isAdmin', 'true');
      const data = await api.get<Notification[]>(`/notifications?${params.toString()}`);
      if (Array.isArray(data)) return data;
    } catch (err) {
      console.warn('API getNotifications fallback:', err);
    }
    if (!isAdmin && !userId) {
      return [];
    }
    return INITIAL_NOTIFICATIONS.filter(n => {
      if (isAdmin) {
        return !n.user_id || n.user_id === userId || n.user_id === 'admin' || n.type === 'appointment_request' || n.type === 'reschedule_request' || n.type === 'appointment_cancelled' || n.type === 'general';
      }
      return Boolean(userId && n.user_id === userId);
    });
  },

  async createNotification(notif: Omit<Notification, 'id' | 'is_read' | 'created_at'>): Promise<Notification> {
    try {
      const created = await api.post<Notification>('/notifications', notif);
      return created;
    } catch (err: any) {
      console.error('API createNotification error:', err);
      throw new Error(err.message || 'Failed to create notification');
    }
  },

  async markNotificationRead(id: string): Promise<void> {
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (err) {
      console.warn('API markNotificationRead error:', err);
    }
  },

  async markAllNotificationsRead(userId?: string, isAdmin: boolean = false): Promise<void> {
    try {
      await api.put('/notifications/read-all', { userId, isAdmin });
    } catch (err) {
      console.warn('API markAllNotificationsRead error:', err);
    }
  },

  // -------------------------------------------------------------
  // Laboratory Tests & Settings
  // -------------------------------------------------------------
  async getLaboratoryTests(options?: { includeDrafts?: boolean; category?: string }): Promise<LaboratoryTest[]> {
    try {
      const params = new URLSearchParams();
      if (options?.includeDrafts) params.append('includeDrafts', 'true');
      if (options?.category) params.append('category', options.category);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const tests = await api.get<LaboratoryTest[]>(`/laboratory/tests${qs}`);
      if (tests) return tests;
    } catch (err) {
      console.warn('API getLaboratoryTests fallback:', err);
    }
    return INITIAL_LABORATORY_TESTS;
  },

  async getLaboratoryTestById(id: string): Promise<LaboratoryTest | null> {
    try {
      const test = await api.get<LaboratoryTest>(`/laboratory/tests/${id}`);
      if (test) return test;
    } catch (err) {
      console.warn('API getLaboratoryTestById fallback:', err);
    }
    return INITIAL_LABORATORY_TESTS.find(t => t.id === id) || null;
  },

  async addLaboratoryTest(test: Omit<LaboratoryTest, 'id' | 'created_at' | 'updated_at'>): Promise<LaboratoryTest> {
    try {
      const created = await api.post<LaboratoryTest>('/laboratory/tests', test);
      return created;
    } catch (err: any) {
      console.error('API addLaboratoryTest error:', err);
      throw new Error(err.message || 'Failed to add laboratory test');
    }
  },

  async updateLaboratoryTest(id: string, updates: Partial<LaboratoryTest>): Promise<LaboratoryTest> {
    try {
      const updated = await api.put<LaboratoryTest>(`/laboratory/tests/${id}`, updates);
      return updated;
    } catch (err: any) {
      console.error('API updateLaboratoryTest error:', err);
      throw new Error(err.message || 'Failed to update laboratory test');
    }
  },

  async deleteLaboratoryTest(id: string): Promise<void> {
    try {
      await api.delete(`/laboratory/tests/${id}`);
    } catch (err: any) {
      console.error('API deleteLaboratoryTest error:', err);
      throw new Error(err.message || 'Failed to delete laboratory test');
    }
  },

  async getLaboratorySettings(): Promise<LaboratorySettings> {
    try {
      const settings = await api.get<LaboratorySettings>('/laboratory/settings');
      if (settings) return settings;
    } catch (err) {
      console.warn('API getLaboratorySettings fallback:', err);
    }
    return INITIAL_LABORATORY_SETTINGS;
  },

  async updateLaboratorySettings(settings: Partial<LaboratorySettings>): Promise<LaboratorySettings> {
    try {
      const updated = await api.put<LaboratorySettings>('/laboratory/settings', settings);
      return updated;
    } catch (err: any) {
      console.error('API updateLaboratorySettings error:', err);
      throw new Error(err.message || 'Failed to update laboratory settings');
    }
  },

  // -------------------------------------------------------------
  // Website Sections Visibility
  // -------------------------------------------------------------
  async getWebsiteSections(): Promise<WebsiteSection[]> {
    try {
      const data = await api.get<WebsiteSection[]>('/sections');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (err) {
      console.warn('API getWebsiteSections fallback:', err);
    }
    return INITIAL_WEBSITE_SECTIONS;
  },

  async updateWebsiteSectionVisibility(id: string, is_visible: boolean): Promise<WebsiteSection> {
    try {
      const updated = await api.put<WebsiteSection>(`/sections/${id}`, { is_visible });
      return updated;
    } catch (err: any) {
      console.error('API updateWebsiteSectionVisibility error:', err);
      throw new Error(err.message || 'Failed to update section visibility');
    }
  },

  // -------------------------------------------------------------
  // Patient Feedback & Reviews
  // -------------------------------------------------------------
  async getPublicReviews(doctorId?: string): Promise<PatientReview[]> {
    try {
      const url = doctorId ? `/reviews?doctorId=${encodeURIComponent(doctorId)}` : '/reviews';
      const data = await api.get<PatientReview[]>(url);
      if (Array.isArray(data)) return data;
    } catch (err) {
      console.warn('API getPublicReviews error:', err);
    }
    return [];
  },

  async getPublicReviewStats(): Promise<{ total_approved_reviews: number; average_rating: number }> {
    try {
      const stats = await api.get<{ total_approved_reviews: number; average_rating: number }>('/reviews/stats');
      if (stats) return stats;
    } catch (err) {
      console.warn('API getPublicReviewStats error:', err);
    }
    return { total_approved_reviews: 0, average_rating: 5.0 };
  },

  async getAdminReviews(status?: string): Promise<{ reviews: PatientReview[]; stats: ReviewStats }> {
    try {
      const url = status && status !== 'all' ? `/reviews?status=${encodeURIComponent(status)}` : '/reviews';
      const res = await api.get<{ reviews: PatientReview[]; stats: ReviewStats }>(url);
      if (res && Array.isArray(res.reviews)) return res;
    } catch (err) {
      console.error('API getAdminReviews error:', err);
      throw err;
    }
    return {
      reviews: [],
      stats: { total_reviews: 0, pending_reviews: 0, approved_reviews: 0, rejected_reviews: 0, average_rating: 5.0 },
    };
  },

  async getEligibleAppointmentsForReview(): Promise<EligibleAppointmentForReview[]> {
    try {
      const data = await api.get<EligibleAppointmentForReview[]>('/reviews/eligible-appointments');
      if (Array.isArray(data)) return data;
    } catch (err) {
      console.warn('API getEligibleAppointmentsForReview error:', err);
    }
    return [];
  },

  async getMyReviews(): Promise<PatientReview[]> {
    try {
      const data = await api.get<PatientReview[]>('/reviews/my-reviews');
      if (Array.isArray(data)) return data;
    } catch (err) {
      console.warn('API getMyReviews error:', err);
    }
    return [];
  },

  async submitReview(data: {
    doctor_id: string;
    appointment_id?: string;
    rating: number;
    review_title?: string;
    review_message: string;
  }): Promise<{ message: string; review: PatientReview }> {
    try {
      const res = await api.post<{ message: string; review: PatientReview }>('/reviews', data);
      window.dispatchEvent(new CustomEvent('reviews-updated'));
      return res;
    } catch (err: any) {
      console.error('API submitReview error:', err);
      throw new Error(err.message || 'Failed to submit review');
    }
  },

  async updateReviewStatus(id: string, status: ReviewStatus): Promise<{ message: string; review: PatientReview }> {
    try {
      const res = await api.patch<{ message: string; review: PatientReview }>(`/reviews/${id}/status`, { status });
      window.dispatchEvent(new CustomEvent('reviews-updated'));
      return res;
    } catch (err: any) {
      console.error('API updateReviewStatus error:', err);
      throw new Error(err.message || 'Failed to update review status');
    }
  },

  async deleteReview(id: string): Promise<{ message: string }> {
    try {
      const res = await api.delete<{ message: string }>(`/reviews/${id}`);
      window.dispatchEvent(new CustomEvent('reviews-updated'));
      return res;
    } catch (err: any) {
      console.error('API deleteReview error:', err);
      throw new Error(err.message || 'Failed to delete review');
    }
  },

  // -------------------------------------------------------------
  // Chief Doctor Profile
  // -------------------------------------------------------------
  async getChiefDoctorProfile(): Promise<ChiefDoctorProfile> {
    try {
      const res = await api.get<ChiefDoctorProfile>('/chief-doctor');
      if (res && res.name) return res;
    } catch (err) {
      console.warn('API getChiefDoctorProfile error, using fallback:', err);
    }
    return INITIAL_CHIEF_DOCTOR_PROFILE as ChiefDoctorProfile;
  },

  async updateChiefDoctorProfile(data: Partial<ChiefDoctorProfile>): Promise<ChiefDoctorProfile> {
    try {
      const res = await api.put<ChiefDoctorProfile>('/chief-doctor', data);
      window.dispatchEvent(new CustomEvent('chief-doctor-updated', { detail: res }));
      return res;
    } catch (err: any) {
      console.error('API updateChiefDoctorProfile error:', err);
      throw new Error(err.message || 'Failed to update Chief Doctor Profile');
    }
  },

  // -------------------------------------------------------------
  // Admin Verification
  // -------------------------------------------------------------
  async verifyAdminRole(userId: string): Promise<{ isAdmin: boolean; role: string }> {
    try {
      const res = await api.get<{ isAdmin: boolean; role: string }>(`/auth/verify-admin/${userId}`);
      if (res) return res;
    } catch (err) {
      console.warn('API verifyAdminRole fallback check:', err);
    }
    return { isAdmin: false, role: 'patient' };
  },
};
