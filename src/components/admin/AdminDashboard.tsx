import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Users, 
  Stethoscope, 
  HeartHandshake, 
  Settings, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  AlertCircle, 
  X,
  Building,
  Save,
  Check,
  Eye,
  EyeOff,
  FileText,
  Microscope,
  Trash2,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Lock,
  KeyRound,
  Bell,
  MessageSquare,
  Phone,
  Star,
  Award,
  UserPlus
} from 'lucide-react';
import defaultDoctorPhoto from '../../assets/doctor.jpeg';
import { api } from '../../services/apiClient';
import { 
  Appointment, 
  AppointmentStatus, 
  Doctor, 
  HealthScheme, 
  HospitalSettings, 
  Speciality, 
  AvailabilityStatus,
  SchemeEmpanelmentStatus,
  LaboratoryTest,
  LaboratorySettings,
  Notification,
  WebsiteSection,
  PatientReview,
  ReviewStats,
  ChiefDoctorProfile
} from '../../types';
import { dataService } from '../../services/dataService';
import { formatDate, formatTime12 } from '../../lib/utils';
import { openWhatsAppForAppointment } from '../../lib/whatsapp';
import { AdminLaboratoryTab } from './AdminLaboratoryTab';
import { AdminChiefDoctorTab } from './AdminChiefDoctorTab';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'doctors' | 'laboratory' | 'schemes' | 'settings' | 'visibility' | 'reviews' | 'chief_doctor'>('appointments');
  const [loading, setLoading] = useState<boolean>(true);

  // Data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [schemes, setSchemes] = useState<HealthScheme[]>([]);
  const [settings, setSettings] = useState<HospitalSettings | null>(null);
  const [labTests, setLabTests] = useState<LaboratoryTest[]>([]);
  const [labSettings, setLabSettings] = useState<LaboratorySettings | null>(null);
  const [websiteSections, setWebsiteSections] = useState<WebsiteSection[]>([]);
  const [updatingSectionId, setUpdatingSectionId] = useState<string | null>(null);
  const [sectionSuccessMsg, setSectionSuccessMsg] = useState<string | null>(null);

  // Patient Reviews State
  const [adminReviews, setAdminReviews] = useState<PatientReview[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    total_reviews: 0,
    pending_reviews: 0,
    approved_reviews: 0,
    rejected_reviews: 0,
    average_rating: 5.0,
  });
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [reviewSearch, setReviewSearch] = useState<string>('');
  const [reviewUpdatingId, setReviewUpdatingId] = useState<string | null>(null);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // Chief Doctor Profile State
  const [chiefDoctorProfile, setChiefDoctorProfile] = useState<ChiefDoctorProfile | null>(null);
  const [chiefDoctorSaving, setChiefDoctorSaving] = useState<boolean>(false);
  const [chiefDoctorSuccess, setChiefDoctorSuccess] = useState<string | null>(null);
  const [chiefDoctorError, setChiefDoctorError] = useState<string | null>(null);
  const [chiefDoctorImageTab, setChiefDoctorImageTab] = useState<'upload' | 'url'>('upload');
  const [chiefDoctorForm, setChiefDoctorForm] = useState<Partial<ChiefDoctorProfile>>({
    name: 'Dr. Vishal Panditrao Pawar',
    designation: 'Chief Doctor / Medical Director',
    qualifications: 'MBBS, MD (Medicine), DM (Cardiology), FACC',
    speciality: 'Cardiology & Internal Medicine',
    experience_years: 18,
    photo_url: '',
    introduction: '',
    welcome_message: '',
  });

  // Admin Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Filters for appointments (Separate states for Today, Upcoming, and Previous History)
  const [appointmentSubTab, setAppointmentSubTab] = useState<'today' | 'upcoming' | 'previous'>('today');
  const [todaySearchQuery, setTodaySearchQuery] = useState<string>('');
  const [todayStatusFilter, setTodayStatusFilter] = useState<string>('all');
  const [upcomingSearchQuery, setUpcomingSearchQuery] = useState<string>('');
  const [upcomingStatusFilter, setUpcomingStatusFilter] = useState<string>('all');
  const [previousSearchQuery, setPreviousSearchQuery] = useState<string>('');
  const [previousStatusFilter, setPreviousStatusFilter] = useState<string>('all');
  const [showUpcomingInToday, setShowUpcomingInToday] = useState<boolean>(true);
  const [isRefreshingQueue, setIsRefreshingQueue] = useState<boolean>(false);
  const [queueActionSuccessMsg, setQueueActionSuccessMsg] = useState<string | null>(null);

  // Modals & Actions
  const [rejectingAppointment, setRejectingAppointment] = useState<Appointment | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  
  // Offline Patient (Walk-in) Modal State
  const [isAddOfflineModalOpen, setIsAddOfflineModalOpen] = useState<boolean>(false);
  const [isSavingOffline, setIsSavingOffline] = useState<boolean>(false);
  const [offlineSuccessMsg, setOfflineSuccessMsg] = useState<string | null>(null);
  const [offlineErrorMsg, setOfflineErrorMsg] = useState<string | null>(null);
  const [offlineForm, setOfflineForm] = useState<{
    patient_name: string;
    patient_phone: string;
    age: string;
    gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | '';
    speciality_id: string;
    doctor_id: string;
    appointment_date: string;
    start_time: string;
    notes: string;
  }>({
    patient_name: '',
    patient_phone: '',
    age: '',
    gender: '',
    speciality_id: '',
    doctor_id: '',
    appointment_date: '',
    start_time: '',
    notes: '',
  });
  const [offlineAvailableSlots, setOfflineAvailableSlots] = useState<{ time: string; isBooked: boolean; isPast: boolean }[]>([]);
  const [loadingOfflineSlots, setLoadingOfflineSlots] = useState<boolean>(false);
  const [offlineDoctorOnLeave, setOfflineDoctorOnLeave] = useState<boolean>(false);
  
  // Doctor Add/Edit & Delete Modals
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState<boolean>(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [isDeletingDoctor, setIsDeletingDoctor] = useState<boolean>(false);

  // Scheme Delete & Notifications
  const [schemeToDelete, setSchemeToDelete] = useState<HealthScheme | null>(null);
  const [isDeletingScheme, setIsDeletingScheme] = useState<boolean>(false);
  const [schemeSuccessMsg, setSchemeSuccessMsg] = useState<string | null>(null);
  const [schemeErrorMsg, setSchemeErrorMsg] = useState<string | null>(null);
  const [doctorImageSourceTab, setDoctorImageSourceTab] = useState<'url' | 'pc'>('url');
  const [doctorForm, setDoctorForm] = useState<Partial<Doctor>>({
    name: '',
    speciality_id: '',
    qualifications: '',
    experience_years: 5,
    bio: '',
    consultation_fee: 500,
    photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600',
    availability_status: 'Available',
    slot_duration_minutes: 30,
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    is_active: true
  });

  // Scheme Add/Edit Modal
  const [editingScheme, setEditingScheme] = useState<HealthScheme | null>(null);
  const [isAddSchemeModalOpen, setIsAddSchemeModalOpen] = useState<boolean>(false);
  const [schemeForm, setSchemeForm] = useState<Partial<HealthScheme>>({
    name: '',
    code: '',
    category: 'Central',
    description: '',
    coverage_amount: '₹5,00,000 per family per year',
    eligibility_criteria: ['Standard BPL / SECC criteria'],
    benefits: ['Cashless IPD and OPD surgical procedures'],
    required_documents: ['Aadhaar Card', 'Ration Card'],
    how_to_apply: 'Report to Arogya Mitra counter with required documents.',
    official_url: 'https://beneficiary.nha.gov.in',
    hospital_acceptance_status: 'Accepted',
    last_verified_date: new Date().toISOString().split('T')[0],
    official_source: 'National Health Authority',
    is_published: true,
  });

  // Settings Feedback
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  // Admin Password Management State
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState<string>('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState<boolean>(false);

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeSuccess(null);
    setPasswordChangeError(null);

    if (!newAdminPassword || newAdminPassword.length < 6) {
      setPasswordChangeError('Password must be at least 6 characters long.');
      return;
    }

    if (newAdminPassword !== confirmAdminPassword) {
      setPasswordChangeError('Passwords do not match.');
      return;
    }

    setPasswordChangeLoading(true);
    try {
      await api.put('/auth/change-password', {
        newPassword: newAdminPassword,
      });
      setPasswordChangeSuccess('Admin password updated successfully in MySQL database!');
      setNewAdminPassword('');
      setConfirmAdminPassword('');
    } catch (err: any) {
      setPasswordChangeError(err.message || 'Failed to update password');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [apts, docs, specs, schs, setts, tests, labSetts, secs, revData, chiefDoc] = await Promise.all([
        dataService.getAppointments(),
        dataService.getDoctors(),
        dataService.getSpecialities(),
        dataService.getHealthSchemes(),
        dataService.getHospitalSettings(),
        dataService.getLaboratoryTests({ includeDrafts: true }),
        dataService.getLaboratorySettings(),
        dataService.getWebsiteSections(),
        dataService.getAdminReviews(),
        dataService.getChiefDoctorProfile(),
      ]);
      setAppointments(apts);
      setDoctors(docs);
      setSpecialities(specs);
      setSchemes(schs);
      setSettings(setts);
      setLabTests(tests);
      setLabSettings(labSetts);
      setWebsiteSections(secs);
      setAdminReviews(revData.reviews || []);
      setReviewStats(revData.stats || { total_reviews: 0, pending_reviews: 0, approved_reviews: 0, rejected_reviews: 0, average_rating: 5.0 });
      if (chiefDoc) {
        setChiefDoctorProfile(chiefDoc);
        setChiefDoctorForm({
          name: chiefDoc.name,
          designation: chiefDoc.designation,
          qualifications: chiefDoc.qualifications,
          speciality: chiefDoc.speciality,
          experience_years: chiefDoc.experience_years,
          photo_url: chiefDoc.photo_url || '',
          introduction: chiefDoc.introduction,
          welcome_message: chiefDoc.welcome_message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChiefDoctorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setChiefDoctorSaving(true);
    setChiefDoctorSuccess(null);
    setChiefDoctorError(null);
    try {
      const updated = await dataService.updateChiefDoctorProfile(chiefDoctorForm);
      setChiefDoctorProfile(updated);
      setChiefDoctorSuccess('Chief Doctor profile updated successfully!');
      dataService.getDoctors().then(setDoctors);
      setTimeout(() => setChiefDoctorSuccess(null), 4000);
    } catch (err: any) {
      setChiefDoctorError(err.message || 'Failed to update Chief Doctor Profile');
    } finally {
      setChiefDoctorSaving(false);
    }
  };

  const handleChiefDoctorPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setChiefDoctorForm(prev => ({ ...prev, photo_url: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateReviewStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    setReviewUpdatingId(id);
    setReviewSuccessMsg(null);
    try {
      await dataService.updateReviewStatus(id, status);
      const updated = await dataService.getAdminReviews();
      setAdminReviews(updated.reviews || []);
      setReviewStats(updated.stats || { total_reviews: 0, pending_reviews: 0, approved_reviews: 0, rejected_reviews: 0, average_rating: 5.0 });
      setReviewSuccessMsg(`Review has been successfully ${status.toLowerCase()}.`);
      setTimeout(() => setReviewSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to update review status');
    } finally {
      setReviewUpdatingId(null);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this patient review? This action cannot be undone.')) return;
    setReviewUpdatingId(id);
    setReviewSuccessMsg(null);
    try {
      await dataService.deleteReview(id);
      const updated = await dataService.getAdminReviews();
      setAdminReviews(updated.reviews || []);
      setReviewStats(updated.stats || { total_reviews: 0, pending_reviews: 0, approved_reviews: 0, rejected_reviews: 0, average_rating: 5.0 });
      setReviewSuccessMsg('Review deleted successfully.');
      setTimeout(() => setReviewSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    } finally {
      setReviewUpdatingId(null);
    }
  };

  const handleToggleSection = async (section: WebsiteSection) => {
    const newVisibility = !section.is_visible;
    setUpdatingSectionId(section.id);
    setSectionSuccessMsg(null);
    try {
      await dataService.updateWebsiteSectionVisibility(section.id, newVisibility);
      setWebsiteSections(prev => prev.map(s => s.id === section.id ? { ...s, is_visible: newVisibility } : s));
      window.dispatchEvent(new CustomEvent('website-sections-updated', { detail: { id: section.id, is_visible: newVisibility } }));
      setSectionSuccessMsg(`"${section.name}" is now ${newVisibility ? 'visible to patients' : 'hidden from patient website'}.`);
      setTimeout(() => setSectionSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Failed to update section visibility:', err);
      alert(err.message || 'Failed to update section visibility');
    } finally {
      setUpdatingSectionId(null);
    }
  };

  const fetchAdminNotifications = async () => {
    try {
      const notifs = await dataService.getNotifications(undefined, true);
      setNotifications(notifs);
    } catch (err) {
      console.warn('Failed to fetch admin notifications:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    await dataService.markAllNotificationsRead(undefined, true);
    await fetchAdminNotifications();
  };

  const handleMarkSingleNotificationRead = async (id: string) => {
    await dataService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  useEffect(() => {
    loadAllAdminData();
    fetchAdminNotifications();
    const interval = setInterval(fetchAdminNotifications, 8000);
    const handleNewNotif = () => fetchAdminNotifications();
    window.addEventListener('new-hospital-notification', handleNewNotif);

    // Synchronize queue when an appointment is booked or updated anywhere
    const handleQueueSync = () => {
      dataService.getAppointments().then(setAppointments).catch(() => {});
    };
    window.addEventListener('appointment-booked', handleQueueSync);
    window.addEventListener('appointment-updated', handleQueueSync);
    window.addEventListener('doctor-availability-changed', handleQueueSync);
    window.addEventListener('storage', handleQueueSync);

    // Periodic queue polling while on dashboard to detect patient-side bookings in real-time
    const queueInterval = setInterval(() => {
      dataService.getAppointments().then(setAppointments).catch(() => {});
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(queueInterval);
      window.removeEventListener('new-hospital-notification', handleNewNotif);
      window.removeEventListener('appointment-booked', handleQueueSync);
      window.removeEventListener('appointment-updated', handleQueueSync);
      window.removeEventListener('doctor-availability-changed', handleQueueSync);
      window.removeEventListener('storage', handleQueueSync);
    };
  }, []);

  const handleManualRefreshQueue = async () => {
    setIsRefreshingQueue(true);
    try {
      await loadAllAdminData();
      await fetchAdminNotifications();
    } finally {
      setTimeout(() => setIsRefreshingQueue(false), 500);
    }
  };

  // Handlers for Appointment Status Change
  const handleApproveAppointment = async (aptOrId: Appointment | string) => {
    const apt = typeof aptOrId === 'string' 
      ? appointments.find(a => a.id === aptOrId) 
      : aptOrId;
    if (apt) {
      openWhatsAppForAppointment(apt, 'Approved');
    }
    const aptId = typeof aptOrId === 'string' ? aptOrId : aptOrId.id;
    await dataService.updateAppointmentStatus(aptId, 'Approved');
    await loadAllAdminData();
    setQueueActionSuccessMsg(`Appointment ${apt?.reference_number || ''} approved successfully.`);
    setTimeout(() => setQueueActionSuccessMsg(null), 5000);
  };

  const handleOpenRejectModal = (apt: Appointment) => {
    setRejectingAppointment(apt);
    setRejectionReason('Doctor unavailable during this shift');
  };

  const handleConfirmReject = async () => {
    if (!rejectingAppointment) return;
    const currentApt = rejectingAppointment;
    const currentReason = rejectionReason || 'Declined by hospital coordinator';
    openWhatsAppForAppointment(currentApt, 'Rejected', currentReason);
    await dataService.updateAppointmentStatus(
      currentApt.id, 
      'Rejected', 
      currentReason
    );
    setRejectingAppointment(null);
    await loadAllAdminData();
    setQueueActionSuccessMsg(`Appointment ${currentApt.reference_number} rejected and consultation slot released.`);
    setTimeout(() => setQueueActionSuccessMsg(null), 5000);
  };

  const handleApproveReschedule = async (apt: Appointment) => {
    // Approving a Reschedule Requested appointment promotes the requested date/time
    if (apt) {
      openWhatsAppForAppointment({
        ...apt,
        appointment_date: apt.requested_reschedule_date || apt.appointment_date,
        start_time: apt.requested_reschedule_time || apt.start_time,
      }, 'Approved');
    }
    await dataService.updateAppointmentStatus(apt.id, 'Approved');
    await loadAllAdminData();
    setQueueActionSuccessMsg(`Rescheduled appointment ${apt.reference_number} approved successfully.`);
    setTimeout(() => setQueueActionSuccessMsg(null), 5000);
  };

  const handleMarkCompleted = async (aptId: string) => {
    try {
      const apt = appointments.find(a => a.id === aptId);
      await dataService.updateAppointmentStatus(aptId, 'Completed');
      await loadAllAdminData();
      setQueueActionSuccessMsg(`Appointment ${apt?.reference_number || ''} marked as Completed. Consultation slot released for future availability.`);
      setTimeout(() => setQueueActionSuccessMsg(null), 6000);
    } catch (err: any) {
      console.error('Failed to mark completed:', err);
    }
  };

  // Hospital local date in Asia/Kolkata timezone (YYYY-MM-DD)
  const getTodayIST = (): string => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  };

  // Handlers for Add Offline Patient (Walk-in Appointment)
  const handleOpenAddOfflineModal = () => {
    const today = getTodayIST();
    const defaultSpec = specialities[0]?.id || '';
    const matchingDocs = doctors.filter(d => d.is_active && (!defaultSpec || d.speciality_id === defaultSpec));
    const defaultDoc = matchingDocs[0]?.id || '';

    setOfflineForm({
      patient_name: '',
      patient_phone: '',
      age: '',
      gender: '',
      speciality_id: defaultSpec,
      doctor_id: defaultDoc,
      appointment_date: today,
      start_time: '',
      notes: '',
    });
    setOfflineErrorMsg(null);
    setIsAddOfflineModalOpen(true);
  };

  const handleOfflineSpecialityChange = (specId: string) => {
    const matchingDocs = doctors.filter(d => d.is_active && d.speciality_id === specId);
    setOfflineForm(prev => ({
      ...prev,
      speciality_id: specId,
      doctor_id: matchingDocs[0]?.id || '',
      start_time: '',
    }));
  };

  useEffect(() => {
    if (!isAddOfflineModalOpen || !offlineForm.doctor_id || !offlineForm.appointment_date) {
      setOfflineAvailableSlots([]);
      setOfflineDoctorOnLeave(false);
      return;
    }

    let isMounted = true;
    setLoadingOfflineSlots(true);
    setOfflineDoctorOnLeave(false);

    dataService.getDoctorSlotSchedule(offlineForm.doctor_id, offlineForm.appointment_date)
      .then((res) => {
        if (!isMounted) return;
        setOfflineDoctorOnLeave(res.onLeave);
        setOfflineAvailableSlots(res.slots || []);
        if (offlineForm.start_time) {
          const slot = res.slots.find(s => s.time === offlineForm.start_time);
          if (!slot || slot.isBooked || slot.isPast) {
            setOfflineForm(prev => ({ ...prev, start_time: '' }));
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load doctor slots:', err);
        if (isMounted) {
          setOfflineAvailableSlots([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingOfflineSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAddOfflineModalOpen, offlineForm.doctor_id, offlineForm.appointment_date]);

  const handleSaveOfflinePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfflineErrorMsg(null);

    if (!offlineForm.patient_name.trim()) {
      setOfflineErrorMsg('Patient full name is required.');
      return;
    }
    const cleanPhone = offlineForm.patient_phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setOfflineErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!offlineForm.speciality_id) {
      setOfflineErrorMsg('Please select a medical speciality.');
      return;
    }
    if (!offlineForm.doctor_id) {
      setOfflineErrorMsg('Please select a doctor.');
      return;
    }
    if (!offlineForm.appointment_date) {
      setOfflineErrorMsg('Please select an appointment date.');
      return;
    }
    if (!offlineForm.start_time) {
      setOfflineErrorMsg('Please select an available time slot.');
      return;
    }

    setIsSavingOffline(true);
    try {
      const created = await dataService.addOfflineAppointment({
        patient_name: offlineForm.patient_name.trim(),
        patient_phone: offlineForm.patient_phone.trim(),
        age: offlineForm.age ? parseInt(offlineForm.age, 10) : undefined,
        gender: (offlineForm.gender || undefined) as any,
        speciality_id: offlineForm.speciality_id,
        doctor_id: offlineForm.doctor_id,
        appointment_date: offlineForm.appointment_date,
        start_time: offlineForm.start_time,
        notes: offlineForm.notes.trim() || undefined,
      });

      await loadAllAdminData();
      setIsAddOfflineModalOpen(false);
      setOfflineSuccessMsg(`Walk-in appointment registered successfully for ${created.patient_name} (${created.reference_number})!`);
      setTimeout(() => setOfflineSuccessMsg(null), 6000);
    } catch (err: any) {
      console.error('Failed to save offline appointment:', err);
      setOfflineErrorMsg(err.message || 'Failed to book offline appointment.');
    } finally {
      setIsSavingOffline(false);
    }
  };

  // Handlers for Doctor Management
  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const specId = doctorForm.speciality_id || specialities[0]?.id || '';
      const matchedSpec = specialities.find(s => s.id === specId);
      const formToSave = {
        ...doctorForm,
        speciality_id: specId,
        speciality_name: matchedSpec?.name || doctorForm.speciality_name || 'General Medicine'
      };
      if (editingDoctor) {
        await dataService.updateDoctor(editingDoctor.id, formToSave);
      } else {
        await dataService.addDoctor(formToSave as any);
      }
      setEditingDoctor(null);
      setIsAddDoctorModalOpen(false);
      await loadAllAdminData();
    } catch (err) {
      console.error('Failed to save doctor:', err);
    }
  };

  const handleToggleDoctorStatus = async (doc: Doctor, newStatus: AvailabilityStatus) => {
    // Optimistic UI state update for instant visual feedback
    setDoctors(prev => prev.map(d => d.id === doc.id ? { ...d, availability_status: newStatus } : d));
    try {
      await dataService.updateDoctor(doc.id, { availability_status: newStatus });
      await loadAllAdminData();
    } catch (err) {
      console.error('Failed to toggle doctor status:', err);
    }
  };

  const handleDoctorImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (.jpg, .png, .webp).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const rawBase64 = loadEvent.target?.result as string;
      if (!rawBase64) return;

      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1000;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimized = canvas.toDataURL('image/jpeg', 0.88);
          setDoctorForm(prev => ({ ...prev, photo_url: optimized }));
        } else {
          setDoctorForm(prev => ({ ...prev, photo_url: rawBase64 }));
        }
      };
      img.onerror = () => {
        setDoctorForm(prev => ({ ...prev, photo_url: rawBase64 }));
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    setIsDeletingDoctor(true);
    try {
      await dataService.deleteDoctor(doctorToDelete.id);
      setDoctors(prev => prev.filter(d => d.id !== doctorToDelete.id));
      setDoctorToDelete(null);
      await loadAllAdminData();
    } catch (err) {
      console.error('Failed to delete doctor:', err);
    } finally {
      setIsDeletingDoctor(false);
    }
  };

  // Handlers for Scheme Management
  const handleSaveScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingScheme) {
        await dataService.updateHealthScheme(editingScheme.id, schemeForm);
      } else {
        await dataService.addHealthScheme(schemeForm as any);
      }
      setEditingScheme(null);
      setIsAddSchemeModalOpen(false);
      await loadAllAdminData();
    } catch (err) {
      console.error('Failed to save scheme:', err);
    }
  };

  const handleToggleSchemeAcceptance = async (scheme: HealthScheme, newStatus: SchemeEmpanelmentStatus) => {
    // Optimistic UI state update
    setSchemes(prev => prev.map(s => s.id === scheme.id ? { ...s, hospital_acceptance_status: newStatus } : s));
    try {
      await dataService.updateHealthScheme(scheme.id, { 
        hospital_acceptance_status: newStatus,
        last_verified_date: new Date().toISOString().split('T')[0]
      });
      await loadAllAdminData();
    } catch (err) {
      console.error('Failed to toggle scheme status:', err);
    }
  };

  const handleConfirmDeleteScheme = async () => {
    if (!schemeToDelete) return;
    setIsDeletingScheme(true);
    setSchemeSuccessMsg(null);
    setSchemeErrorMsg(null);
    try {
      await dataService.deleteHealthScheme(schemeToDelete.id);
      setSchemes(prev => prev.filter(s => s.id !== schemeToDelete.id));
      setSchemeSuccessMsg(`Health scheme "${schemeToDelete.name}" was successfully deleted.`);
      setSchemeToDelete(null);
      await loadAllAdminData();
    } catch (err: any) {
      console.error('Failed to delete scheme:', err);
      setSchemeErrorMsg(err.message || 'Failed to delete health scheme');
      setSchemeToDelete(null);
    } finally {
      setIsDeletingScheme(false);
    }
  };

  // Handlers for Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    await dataService.updateHospitalSettings(settings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const todayStr = getTodayIST();

  // Partition appointments by scheduled date (Asia/Kolkata)
  const todayAppointments = appointments.filter(a => a.appointment_date === todayStr);
  const previousAppointments = appointments.filter(a => a.appointment_date && a.appointment_date < todayStr);
  const upcomingAppointments = appointments.filter(a => a.appointment_date && a.appointment_date > todayStr);

  const pendingRequests = appointments.filter(a => ['Pending', 'Reschedule Requested'].includes(a.status));
  const approvedAppointments = appointments.filter(a => ['Approved', 'Rescheduled'].includes(a.status));
  const cancelledAppointments = appointments.filter(a => a.status === 'Cancelled');
  const activeDoctors = doctors.filter(d => d.is_active);

  // Filter for Today's Appointments
  const filteredTodayAppointments = todayAppointments.filter(a => {
    if (todayStatusFilter !== 'all' && a.status !== todayStatusFilter) return false;
    if (todaySearchQuery.trim() !== '') {
      const q = todaySearchQuery.toLowerCase();
      const matchRef = a.reference_number?.toLowerCase().includes(q);
      const matchPat = a.patient_name?.toLowerCase().includes(q);
      const matchDoc = a.doctor_name?.toLowerCase().includes(q);
      const matchPhone = a.patient_phone?.includes(q);
      const matchSource = a.booking_source?.toLowerCase().includes(q);
      return matchRef || matchPat || matchDoc || matchPhone || matchSource;
    }
    return true;
  });

  // Filter for Upcoming Appointments (Tomorrow and future dates)
  const filteredUpcomingAppointments = upcomingAppointments.filter(a => {
    if (upcomingStatusFilter !== 'all' && a.status !== upcomingStatusFilter) return false;
    if (upcomingSearchQuery.trim() !== '') {
      const q = upcomingSearchQuery.toLowerCase();
      const matchRef = a.reference_number?.toLowerCase().includes(q);
      const matchPat = a.patient_name?.toLowerCase().includes(q);
      const matchDoc = a.doctor_name?.toLowerCase().includes(q);
      const matchPhone = a.patient_phone?.includes(q);
      const matchSource = a.booking_source?.toLowerCase().includes(q);
      return matchRef || matchPat || matchDoc || matchPhone || matchSource;
    }
    return true;
  });

  // Filter for Previous Appointments (History)
  const filteredPreviousAppointments = previousAppointments.filter(a => {
    if (previousStatusFilter !== 'all' && a.status !== previousStatusFilter) return false;
    if (previousSearchQuery.trim() !== '') {
      const q = previousSearchQuery.toLowerCase();
      const matchRef = a.reference_number?.toLowerCase().includes(q);
      const matchPat = a.patient_name?.toLowerCase().includes(q);
      const matchDoc = a.doctor_name?.toLowerCase().includes(q);
      const matchPhone = a.patient_phone?.includes(q);
      const matchSource = a.booking_source?.toLowerCase().includes(q);
      return matchRef || matchPat || matchDoc || matchPhone || matchSource;
    }
    return true;
  });

  const currentDisplayedAppointments = 
    appointmentSubTab === 'today' ? filteredTodayAppointments :
    appointmentSubTab === 'upcoming' ? filteredUpcomingAppointments :
    filteredPreviousAppointments;

  return (
    <section className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-8 border-b border-slate-200 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-1">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Hospital Administration Portal</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Operations & Clinical Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Shri Gajanan Multispeciality Hospital • Real-time database controls
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell in Admin Dashboard */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Admin Notifications"
                className="relative px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-teal-600 hover:bg-slate-50 transition-colors shadow-xs flex items-center gap-2"
              >
                <Bell className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold hidden sm:inline">Alerts</span>
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>

              {/* Dropdown Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">Hospital Alerts</h4>
                      {notifications.filter(n => !n.is_read).length > 0 && (
                        <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                          {notifications.filter(n => !n.is_read).length} new
                        </span>
                      )}
                    </div>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                        className="text-xs text-teal-600 hover:text-teal-800 font-bold"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 my-2">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        No hospital notifications yet.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.is_read) handleMarkSingleNotificationRead(n.id);
                            if (n.type === 'appointment_request' || n.type === 'reschedule_request') {
                              setActiveTab('appointments');
                              setAppointmentSubTab('today');
                              setTodayStatusFilter('all');
                              setNotificationsOpen(false);
                            } else {
                              setSelectedNotification(n);
                              setNotificationsOpen(false);
                            }
                          }}
                          className={`py-3 px-2 rounded-xl flex gap-3 text-left transition-colors cursor-pointer hover:bg-slate-50 ${!n.is_read ? 'bg-amber-50/60 font-medium' : ''}`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.type === 'appointment_request' ? (
                              <Clock className="w-4 h-4 text-amber-500" />
                            ) : n.type === 'reschedule_request' ? (
                              <RotateCcw className="w-4 h-4 text-indigo-500" />
                            ) : n.type === 'appointment_cancelled' ? (
                              <XCircle className="w-4 h-4 text-rose-500" />
                            ) : (
                              <MessageSquare className="w-4 h-4 text-teal-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                              {!n.is_read && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={loadAllAdminData}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Analytics KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Bookings</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{appointments.length}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/30">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Action</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingRequests.length}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/30">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Approved</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{approvedAppointments.length}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-teal-200 shadow-xs bg-teal-50/30">
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Today's OPD</span>
            <p className="text-2xl font-black text-teal-700 mt-1">{todayAppointments.length}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-teal-200 shadow-xs bg-teal-50/20">
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Diagnostic Tests</span>
            <p className="text-2xl font-black text-teal-700 mt-1">{labTests.length}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Health Schemes</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{schemes.filter(s => s.is_published).length}</p>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 mb-6 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'appointments'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Appointments Queue ({pendingRequests.length} pending)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'doctors'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctors & OPD Rosters</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('laboratory')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'laboratory'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Microscope className="w-4 h-4" />
            <span>Laboratory & Diagnostics ({labTests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schemes')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'schemes'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Government Health Schemes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'settings'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Hospital Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visibility')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'visibility'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Website Section Visibility</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'reviews'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Patient Feedback & Reviews</span>
            {(reviewStats.pending_reviews ?? 0) > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900 font-extrabold animate-pulse">
                {reviewStats.pending_reviews} Pending
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">({adminReviews.length})</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'reviews'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Patient Feedback & Reviews</span>
            {(reviewStats.pending_reviews ?? 0) > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900 font-extrabold">
                {reviewStats.pending_reviews} Pending
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">({adminReviews.length})</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chief_doctor')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'chief_doctor'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Chief Doctor Profile</span>
          </button>
        </div>

        {/* =========================================================================
            SECTION A: APPOINTMENTS MANAGEMENT
            ========================================================================= */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6">
            
            {/* 1. Appointment Queue Division: Today's Appointments vs Previous Appointments (History) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-200 gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAppointmentSubTab('today')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    appointmentSubTab === 'today'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Today's Appointments</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    appointmentSubTab === 'today'
                      ? 'bg-white text-teal-800'
                      : 'bg-teal-100 text-teal-800'
                  }`}>
                    {todayAppointments.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAppointmentSubTab('upcoming')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    appointmentSubTab === 'upcoming'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span>Upcoming Bookings</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    appointmentSubTab === 'upcoming'
                      ? 'bg-white text-teal-800'
                      : upcomingAppointments.length > 0
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black animate-pulse'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {upcomingAppointments.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAppointmentSubTab('previous')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    appointmentSubTab === 'previous'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Previous Appointments (History)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    appointmentSubTab === 'previous'
                      ? 'bg-white text-teal-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {previousAppointments.length}
                  </span>
                </button>

                {/* Manual Refresh Queue Button */}
                <button
                  type="button"
                  onClick={handleManualRefreshQueue}
                  disabled={isRefreshingQueue}
                  title="Refresh appointments directly from MySQL"
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRefreshingQueue ? 'animate-spin text-teal-600' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                {/* Add Offline Patient (Walk-in Appointment) Button */}
                <button
                  type="button"
                  onClick={handleOpenAddOfflineModal}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all hover:shadow-md cursor-pointer ml-auto sm:ml-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Offline Patient</span>
                </button>
              </div>

              {/* Timezone & Date Indicator */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Hospital Date (Asia/Kolkata): <strong>{formatDate(todayStr)}</strong></span>
                </span>
              </div>
            </div>

            {/* Notification Banner for Actions & Offline Booking */}
            {(queueActionSuccessMsg || offlineSuccessMsg) && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{queueActionSuccessMsg || offlineSuccessMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQueueActionSuccessMsg(null);
                    setOfflineSuccessMsg(null);
                  }}
                  className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Subtle notice when viewing Today's Appointments if Upcoming Bookings exist */}
            {appointmentSubTab === 'today' && upcomingAppointments.length > 0 && (
              <div className="mb-4 px-4 py-2.5 rounded-2xl bg-sky-50 border border-sky-200/80 text-sky-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse"></span>
                  <span>
                    <strong>{upcomingAppointments.length} upcoming online/offline appointment(s)</strong> are scheduled for future dates.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAppointmentSubTab('upcoming')}
                  className="font-bold underline text-sky-700 hover:text-sky-900 text-xs cursor-pointer ml-3 shrink-0"
                >
                  View Upcoming Bookings →
                </button>
              </div>
            )}

            {/* Filter and Search Bar (Operates independently for each tab) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    appointmentSubTab === 'today'
                      ? "Search today's queue (Ref #, patient, doctor)..."
                      : appointmentSubTab === 'upcoming'
                      ? "Search upcoming bookings (Ref #, patient, doctor)..."
                      : "Search past appointment history..."
                  }
                  value={
                    appointmentSubTab === 'today' ? todaySearchQuery :
                    appointmentSubTab === 'upcoming' ? upcomingSearchQuery :
                    previousSearchQuery
                  }
                  onChange={(e) => {
                    if (appointmentSubTab === 'today') {
                      setTodaySearchQuery(e.target.value);
                    } else if (appointmentSubTab === 'upcoming') {
                      setUpcomingSearchQuery(e.target.value);
                    } else {
                      setPreviousSearchQuery(e.target.value);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
                {appointmentSubTab === 'today' ? (
                  <select
                    value={todayStatusFilter}
                    onChange={(e) => setTodayStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="all">All Statuses ({todayAppointments.length})</option>
                    <option value="Pending">Pending Approval ({todayAppointments.filter(a => a.status === 'Pending').length})</option>
                    <option value="Approved">Approved ({todayAppointments.filter(a => a.status === 'Approved').length})</option>
                    <option value="Completed">Completed ({todayAppointments.filter(a => a.status === 'Completed').length})</option>
                    <option value="Cancelled">Cancelled ({todayAppointments.filter(a => a.status === 'Cancelled').length})</option>
                    <option value="Reschedule Requested">Reschedule Requested ({todayAppointments.filter(a => a.status === 'Reschedule Requested').length})</option>
                    <option value="Rescheduled">Rescheduled ({todayAppointments.filter(a => a.status === 'Rescheduled').length})</option>
                    <option value="Rejected">Rejected ({todayAppointments.filter(a => a.status === 'Rejected').length})</option>
                  </select>
                ) : appointmentSubTab === 'upcoming' ? (
                  <select
                    value={upcomingStatusFilter}
                    onChange={(e) => setUpcomingStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="all">All Statuses ({upcomingAppointments.length})</option>
                    <option value="Pending">Pending Approval ({upcomingAppointments.filter(a => a.status === 'Pending').length})</option>
                    <option value="Approved">Approved ({upcomingAppointments.filter(a => a.status === 'Approved').length})</option>
                    <option value="Completed">Completed ({upcomingAppointments.filter(a => a.status === 'Completed').length})</option>
                    <option value="Cancelled">Cancelled ({upcomingAppointments.filter(a => a.status === 'Cancelled').length})</option>
                    <option value="Reschedule Requested">Reschedule Requested ({upcomingAppointments.filter(a => a.status === 'Reschedule Requested').length})</option>
                    <option value="Rescheduled">Rescheduled ({upcomingAppointments.filter(a => a.status === 'Rescheduled').length})</option>
                    <option value="Rejected">Rejected ({upcomingAppointments.filter(a => a.status === 'Rejected').length})</option>
                  </select>
                ) : (
                  <select
                    value={previousStatusFilter}
                    onChange={(e) => setPreviousStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="all">All Statuses ({previousAppointments.length})</option>
                    <option value="Completed">Completed ({previousAppointments.filter(a => a.status === 'Completed').length})</option>
                    <option value="Approved">Approved ({previousAppointments.filter(a => a.status === 'Approved').length})</option>
                    <option value="Cancelled">Cancelled ({previousAppointments.filter(a => a.status === 'Cancelled').length})</option>
                    <option value="Rejected">Rejected ({previousAppointments.filter(a => a.status === 'Rejected').length})</option>
                    <option value="Pending">Pending ({previousAppointments.filter(a => a.status === 'Pending').length})</option>
                    <option value="Rescheduled">Rescheduled ({previousAppointments.filter(a => a.status === 'Rescheduled').length})</option>
                  </select>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px] pb-3">
                    <th className="py-3 px-3">Reference / Patient</th>
                    <th className="py-3 px-3">Doctor / Speciality</th>
                    <th className="py-3 px-3">Date & Slot</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentDisplayedAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        {appointmentSubTab === 'today'
                          ? "No appointments scheduled for today match the selected filter."
                          : appointmentSubTab === 'upcoming'
                          ? "No upcoming appointments scheduled for future dates match the selected filter."
                          : "No previous appointments match the selected filter."}
                      </td>
                    </tr>
                  ) : (
                    currentDisplayedAppointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Patient & Ref */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-teal-800 text-[11px]">
                              {apt.reference_number}
                            </span>
                            {apt.booking_source === 'OFFLINE' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wider">
                                Offline
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200 uppercase tracking-wider">
                                Online
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-slate-900 mt-0.5">{apt.patient_name}</p>
                          <p className="text-[11px] text-slate-500">
                            {apt.patient_phone}
                            {apt.patient_age ? ` • ${apt.patient_age} yrs` : ''}
                            {apt.patient_gender ? ` • ${apt.patient_gender}` : ''}
                          </p>
                        </td>

                        {/* Doctor & Speciality */}
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{apt.doctor_name}</p>
                          <p className="text-teal-700 font-medium text-[11px]">{apt.speciality_name}</p>
                          <p className="text-slate-400 text-[10px] truncate max-w-xs italic">
                            "{apt.reason_for_visit}"
                          </p>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-800">{formatDate(apt.appointment_date)}</p>
                          <p className="text-slate-500 font-semibold">{formatTime12(apt.start_time)}</p>
                          
                          {/* If reschedule requested */}
                          {apt.status === 'Reschedule Requested' && apt.requested_reschedule_date && (
                            <span className="text-[10px] text-sky-700 font-bold block mt-1 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                              New Slot: {formatDate(apt.requested_reschedule_date)} @ {formatTime12(apt.requested_reschedule_time || '')}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            apt.status === 'Approved' || apt.status === 'Rescheduled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : apt.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : apt.status === 'Reschedule Requested'
                              ? 'bg-sky-100 text-sky-800'
                              : apt.status === 'Completed'
                              ? 'bg-slate-100 text-slate-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {apt.status}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Notification Action */}
                            <button
                              type="button"
                              onClick={() => {
                                const type = apt.status === 'Rejected' ? 'Rejected' : 'Approved';
                                openWhatsAppForAppointment(apt, type, apt.rejection_reason);
                              }}
                              title="Send WhatsApp notification"
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 inline-flex items-center gap-1 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp</span>
                            </button>

                            {/* Pending State Actions */}
                            {apt.status === 'Pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveAppointment(apt)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenRejectModal(apt)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                >
                                  Decline
                                </button>
                              </>
                            )}

                            {/* Reschedule Requested Actions */}
                            {apt.status === 'Reschedule Requested' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveReschedule(apt)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-600 text-white hover:bg-sky-700"
                                >
                                  Approve Reschedule
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenRejectModal(apt)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                >
                                  Decline
                                </button>
                              </>
                            )}

                            {/* Approved State Actions */}
                            {['Approved', 'Rescheduled'].includes(apt.status) && (
                              <button
                                type="button"
                                onClick={() => handleMarkCompleted(apt.id)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
                              >
                                Mark Completed
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION B: DOCTOR MANAGEMENT
            ========================================================================= */}
        {activeTab === 'doctors' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Hospital Medical Faculty</h3>
                <p className="text-xs text-slate-500">Configure schedules, slot duration, and leave status.</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingDoctor(null);
                  setDoctorForm({
                    name: '',
                    speciality_id: specialities[0]?.id || '',
                    speciality_name: specialities[0]?.name || 'General Medicine',
                    qualifications: 'MBBS, MD',
                    experience_years: 5,
                    bio: '',
                    consultation_fee: 600,
                    photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600',
                    availability_status: 'Available',
                    slot_duration_minutes: 30,
                    working_hours_start: '09:00',
                    working_hours_end: '17:00',
                    working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    is_active: true
                  });
                  setIsAddDoctorModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Doctor</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-3">
                      <img
                        src={doc.photo_url}
                        alt={doc.name}
                        className="w-14 h-14 rounded-xl object-cover object-top border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                          {doc.speciality_name}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-1 truncate">{doc.name}</h4>
                        <p className="text-[11px] text-slate-500 truncate">{doc.qualifications}</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">OPD Timings:</span>
                        <span className="font-semibold text-slate-800">{doc.working_hours_start} - {doc.working_hours_end}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Slot Duration:</span>
                        <span className="font-semibold text-slate-800">{doc.slot_duration_minutes} mins</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Working Days:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[150px]">{doc.working_days.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {/* Status Toggle Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleDoctorStatus(doc, 'Available')}
                        className={`px-2 py-1 rounded text-[10px] font-bold ${
                          doc.availability_status === 'Available'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Available
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleDoctorStatus(doc, 'On Leave')}
                        className={`px-2 py-1 rounded text-[10px] font-bold ${
                          doc.availability_status === 'On Leave'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        On Leave
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDoctor(doc);
                          setDoctorForm(doc);
                          setDoctorImageSourceTab(doc.photo_url?.startsWith('data:') ? 'pc' : 'url');
                          setIsAddDoctorModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                      >
                        Edit Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => setDoctorToDelete(doc)}
                        className="px-2 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1"
                        title="Delete Doctor from hospital roster"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION C: GOVERNMENT SCHEMES MANAGEMENT
            ========================================================================= */}
        {activeTab === 'schemes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Government Health Schemes</h3>
                <p className="text-xs text-slate-500">Update empanelment status, verification dates, and official source links.</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingScheme(null);
                  setSchemeForm({
                    name: '',
                    code: '',
                    category: 'Central',
                    description: '',
                    coverage_amount: '₹5,00,000 per family per year',
                    eligibility_criteria: ['Family income criteria as per official guidelines'],
                    benefits: ['Cashless hospitalization for secondary and tertiary care'],
                    required_documents: ['Ration Card', 'Aadhaar Card'],
                    how_to_apply: 'Report to Arogya Mitra Helpdesk on Ground Floor.',
                    official_url: 'https://beneficiary.nha.gov.in',
                    hospital_acceptance_status: 'Accepted',
                    last_verified_date: new Date().toISOString().split('T')[0],
                    official_source: 'National Health Authority',
                    is_published: true,
                  });
                  setIsAddSchemeModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Scheme</span>
              </button>
            </div>

            <div className="space-y-4">
              {schemeSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{schemeSuccessMsg}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setSchemeSuccessMsg(null)} 
                    className="text-emerald-600 hover:text-emerald-800 font-bold p-1 rounded-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {schemeErrorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-semibold">{schemeErrorMsg}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setSchemeErrorMsg(null)} 
                    className="text-rose-600 hover:text-rose-800 font-bold p-1 rounded-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {schemes.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                        {s.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.hospital_acceptance_status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        Hospital Status: {s.hospital_acceptance_status}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900">{s.name}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{s.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span>Coverage: <strong className="text-slate-700">{s.coverage_amount}</strong></span>
                      <span>Last Verified: <strong className="text-slate-700">{s.last_verified_date}</strong></span>
                      <span>Source: <strong className="text-slate-700">{s.official_source}</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSchemeAcceptance(
                        s, 
                        s.hospital_acceptance_status === 'Accepted' ? 'Under Verification' : 'Accepted'
                      )}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        s.hospital_acceptance_status === 'Accepted'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {s.hospital_acceptance_status === 'Accepted' ? 'Set Under Verification' : 'Mark Empaneled'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingScheme(s);
                        setSchemeForm(s);
                        setIsAddSchemeModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      Edit Details
                    </button>

                    <button
                      type="button"
                      onClick={() => setSchemeToDelete(s)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors flex items-center gap-1.5"
                      title="Delete Health Scheme"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION: LABORATORY & DIAGNOSTICS MANAGEMENT
            ========================================================================= */}
        {activeTab === 'laboratory' && (
          <AdminLaboratoryTab
            labTests={labTests}
            labSettings={labSettings}
            onRefresh={loadAllAdminData}
          />
        )}

        {/* =========================================================================
            SECTION D: HOSPITAL SETTINGS
            ========================================================================= */}
        {activeTab === 'settings' && settings && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card max-w-2xl">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Hospital Configuration & OPD Rules
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Configure hospital emergency numbers, OPD operating hours, and booking slot duration.
            </p>

            {settingsSaved && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Hospital settings saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hospital Official Name</label>
                <input
                  type="text"
                  value={settings.hospital_name}
                  onChange={(e) => setSettings({ ...settings, hospital_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">24/7 Emergency Line *</label>
                  <input
                    type="text"
                    value={settings.emergency_helpline}
                    onChange={(e) => setSettings({ ...settings, emergency_helpline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-rose-600 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">General OPD Desk Phone</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Hospital Inquiries Email</label>
                <input
                  type="email"
                  value={settings.email || ''}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operating Hours Notice</label>
                <input
                  type="text"
                  value={settings.operating_hours}
                  onChange={(e) => setSettings({ ...settings, operating_hours: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Slot Duration (Mins)</label>
                  <input
                    type="number"
                    value={settings.slot_duration_minutes}
                    onChange={(e) => setSettings({ ...settings, slot_duration_minutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cancellation Window (Hours Before Slot)</label>
                  <input
                    type="number"
                    value={settings.cancellation_window_hours}
                    onChange={(e) => setSettings({ ...settings, cancellation_window_hours: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hospital Address</label>
                <textarea
                  rows={2}
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={settings.city || ''}
                    onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={settings.state || ''}
                    onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={settings.pincode || ''}
                    onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Hospital Settings</span>
                </button>
              </div>
            </form>

            {/* Administrator Password & Security Section */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Administrator Security & Password
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Set a new password for your administrator account in the local MySQL database.
                  </p>
                </div>
              </div>

              {passwordChangeSuccess && (
                <div className="my-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passwordChangeSuccess}</span>
                </div>
              )}

              {passwordChangeError && (
                <div className="my-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passwordChangeError}</span>
                </div>
              )}

              <form onSubmit={handleChangeAdminPassword} className="mt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      New Admin Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••••••"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••••••"
                        value={confirmAdminPassword}
                        onChange={(e) => setConfirmAdminPassword(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={passwordChangeLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-95 disabled:opacity-60 transition-all cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                    <span>{passwordChangeLoading ? 'Updating Password...' : 'Save New Admin Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION F: WEBSITE SECTION VISIBILITY CONTROL
            ========================================================================= */}
        {activeTab === 'visibility' && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider block">
                    Website Management
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    Website Section Visibility Control
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    Turn patient-facing website sections ON or OFF with independent toggles. Hidden sections are automatically removed from the public homepage, navigation links, and cards while all underlying records remain safely saved in the database and accessible to administrators.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    {websiteSections.filter(s => s.is_visible).length} of {websiteSections.length} Visible
                  </span>
                </div>
              </div>

              {sectionSuccessMsg && (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{sectionSuccessMsg}</span>
                </div>
              )}

              <div className="mt-6 divide-y divide-slate-100">
                {websiteSections.map((section) => {
                  const isVisible = section.is_visible;
                  const isUpdating = updatingSectionId === section.id;
                  return (
                    <div
                      key={section.id}
                      className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 px-3 rounded-2xl transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                          isVisible ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {section.id === 'schemes' && <HeartHandshake className="w-5 h-5" />}
                          {section.id === 'laboratory' && <Microscope className="w-5 h-5" />}
                          {section.id === 'doctors' && <Stethoscope className="w-5 h-5" />}
                          {section.id === 'specialities' && <Building className="w-5 h-5" />}
                          {section.id === 'facilities' && <Building className="w-5 h-5" />}
                          {section.id === 'how_it_works' && <FileText className="w-5 h-5" />}
                          {section.id === 'health_packages' && <LayoutDashboard className="w-5 h-5" />}
                          {section.id === 'testimonials' && <MessageSquare className="w-5 h-5" />}
                          {section.id === 'contact' && <Phone className="w-5 h-5" />}
                          {section.id === 'quick_access' && <Search className="w-5 h-5" />}
                          {section.id === 'chief_doctor' && <Award className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{section.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">({section.id})</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
                            {section.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                        {/* Clear Visible/Hidden status indicator beside each toggle */}
                        {isVisible ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Visible</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                            <span>Hidden</span>
                          </span>
                        )}

                        {/* Independent ON/OFF Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleSection(section)}
                          disabled={isUpdating}
                          aria-label={`Toggle visibility for ${section.name}`}
                          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-teal-500 ${
                            isVisible ? 'bg-teal-600' : 'bg-slate-300'
                          } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              isVisible ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION G: PATIENT FEEDBACK & REVIEWS MANAGEMENT
            ========================================================================= */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Patient Feedback & Reviews</h3>
                <p className="text-xs text-slate-500">
                  Moderate patient recovery reviews. Only approved reviews appear on the public website.
                </p>
              </div>

              <button
                type="button"
                onClick={loadAllAdminData}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>Refresh Reviews</span>
              </button>
            </div>

            {/* Notification alert banner */}
            {reviewSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reviewSuccessMsg}</span>
              </div>
            )}

            {/* Metric KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Card 1: Total */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-card">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Reviews
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {reviewStats.total_reviews ?? adminReviews.length}
                </span>
              </div>

              {/* Card 2: Pending */}
              <div className="p-4 rounded-2xl bg-white border border-amber-200/90 shadow-card">
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
                  Pending Approval
                </span>
                <span className="text-2xl font-black text-amber-600">
                  {reviewStats.pending_reviews ?? 0}
                </span>
              </div>

              {/* Card 3: Approved */}
              <div className="p-4 rounded-2xl bg-white border border-emerald-200/90 shadow-card">
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                  Approved & Public
                </span>
                <span className="text-2xl font-black text-emerald-600">
                  {reviewStats.approved_reviews ?? 0}
                </span>
              </div>

              {/* Card 4: Rejected */}
              <div className="p-4 rounded-2xl bg-white border border-rose-200/90 shadow-card">
                <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block mb-1">
                  Rejected Reviews
                </span>
                <span className="text-2xl font-black text-rose-600">
                  {reviewStats.rejected_reviews ?? 0}
                </span>
              </div>

              {/* Card 5: Average Rating */}
              <div className="p-4 rounded-2xl bg-white border border-teal-200/90 shadow-card col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider block mb-1">
                  Average Rating
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black text-slate-900">
                    {reviewStats.average_rating ? reviewStats.average_rating.toFixed(1) : '5.0'}
                  </span>
                  <div className="flex items-center text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                  <span className="text-[11px] text-slate-400">/ 5.0</span>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {(['all', 'Pending', 'Approved', 'Rejected'] as const).map((filterStatus) => {
                    const count = filterStatus === 'all' 
                      ? adminReviews.length 
                      : adminReviews.filter(r => r.status === filterStatus).length;
                    return (
                      <button
                        key={filterStatus}
                        type="button"
                        onClick={() => setReviewStatusFilter(filterStatus)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          reviewStatusFilter === filterStatus
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>{filterStatus === 'all' ? 'All Reviews' : filterStatus}</span>
                        <span className="ml-1.5 opacity-80">({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search by patient, doctor, feedback..."
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                  {reviewSearch && (
                    <button
                      type="button"
                      onClick={() => setReviewSearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Reviews Table */}
              {(() => {
                const filteredReviews = adminReviews.filter((rev) => {
                  const matchesStatus = reviewStatusFilter === 'all' || rev.status === reviewStatusFilter;
                  if (!matchesStatus) return false;
                  if (!reviewSearch.trim()) return true;
                  const q = reviewSearch.toLowerCase();
                  return (
                    (rev.patient_name || '').toLowerCase().includes(q) ||
                    (rev.doctor_name || '').toLowerCase().includes(q) ||
                    (rev.review_title || '').toLowerCase().includes(q) ||
                    (rev.review_message || '').toLowerCase().includes(q)
                  );
                });

                if (filteredReviews.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      No reviews found matching the selected filter or search query.
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/60">
                          <th className="py-3 px-3">Patient Name</th>
                          <th className="py-3 px-3">Doctor & Speciality</th>
                          <th className="py-3 px-3">Rating</th>
                          <th className="py-3 px-3 min-w-[240px]">Feedback Message</th>
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Admin Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredReviews.map((rev) => {
                          const isUpdating = reviewUpdatingId === rev.id;
                          return (
                            <tr key={rev.id} className="hover:bg-slate-50/60 transition-colors">
                              {/* Patient Name */}
                              <td className="py-3.5 px-3">
                                <p className="font-bold text-slate-900">{rev.patient_name || 'Patient'}</p>
                                {rev.patient_phone && (
                                  <span className="text-[11px] text-slate-400 block">{rev.patient_phone}</span>
                                )}
                              </td>

                              {/* Doctor Name & Speciality */}
                              <td className="py-3.5 px-3">
                                <p className="font-bold text-slate-800">{rev.doctor_name}</p>
                                <span className="text-[10px] text-teal-700 uppercase font-semibold block">
                                  {rev.speciality_name || 'Specialist'}
                                </span>
                              </td>

                              {/* Star Rating */}
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <div className="flex items-center gap-0.5 text-amber-400">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-3.5 h-3.5 ${
                                        s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                      }`}
                                    />
                                  ))}
                                  <span className="ml-1 text-[11px] font-bold text-slate-700">
                                    {rev.rating}/5
                                  </span>
                                </div>
                              </td>

                              {/* Review Title & Message */}
                              <td className="py-3.5 px-3">
                                {rev.review_title && (
                                  <p className="font-extrabold text-slate-900 mb-0.5 line-clamp-1">
                                    "{rev.review_title}"
                                  </p>
                                )}
                                <p className="text-slate-600 line-clamp-2 leading-relaxed">
                                  {rev.review_message}
                                </p>
                              </td>

                              {/* Submission Date */}
                              <td className="py-3.5 px-3 whitespace-nowrap text-slate-500">
                                {formatDate(rev.created_at)}
                              </td>

                              {/* Review Status */}
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                {rev.status === 'Approved' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Approved</span>
                                  </span>
                                ) : rev.status === 'Pending' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>Pending</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    <X className="w-3 h-3 text-rose-600" />
                                    <span>Rejected</span>
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {rev.status !== 'Approved' && (
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleUpdateReviewStatus(rev.id, 'Approved')}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors"
                                      title="Approve this review for public display"
                                    >
                                      Approve
                                    </button>
                                  )}

                                  {rev.status !== 'Rejected' && (
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleUpdateReviewStatus(rev.id, 'Rejected')}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                                      title="Reject this review from public display"
                                    >
                                      Reject
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleDeleteReview(rev.id)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors ml-1"
                                    title="Delete review permanently"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION H: CHIEF DOCTOR PROFILE MANAGEMENT
            ========================================================================= */}
        {activeTab === 'chief_doctor' && (
          <AdminChiefDoctorTab onRefreshDoctors={() => dataService.getDoctors().then(setDoctors)} />
        )}

        {rejectingAppointment && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
              <h4 className="font-extrabold text-sm text-slate-900 mb-2">
                Decline Appointment {rejectingAppointment.reference_number}
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Please provide a reason. This explanation will be saved and displayed to the patient.
              </p>

              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Doctor is called for emergency OT surgery..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden resize-none"
              />

              <div className="mt-3 bg-emerald-50 border border-emerald-200/60 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-800">
                <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>WhatsApp Click-to-Chat with this rejection notice will open for you to send to the patient.</span>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingAppointment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
                >
                  Confirm Decline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: ADD OFFLINE PATIENT (WALK-IN APPOINTMENT)
            ========================================================================= */}
        {isAddOfflineModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setIsAddOfflineModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900">
                    Add Offline Patient (Walk-in Appointment)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Register a walk-in patient directly into Shri Gajanan Hospital's appointment queue.
                  </p>
                </div>
              </div>

              {offlineErrorMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{offlineErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveOfflinePatient} className="space-y-5 text-xs">
                {/* 1. Patient Details */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                  <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    <span>Patient Details</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={offlineForm.patient_name}
                        onChange={(e) => setOfflineForm(prev => ({ ...prev, patient_name: e.target.value }))}
                        placeholder="e.g. Ramesh Patil"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={15}
                        value={offlineForm.patient_phone}
                        onChange={(e) => setOfflineForm(prev => ({ ...prev, patient_phone: e.target.value }))}
                        placeholder="e.g. 9876543210"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="125"
                        value={offlineForm.age}
                        onChange={(e) => setOfflineForm(prev => ({ ...prev, age: e.target.value }))}
                        placeholder="e.g. 42"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={offlineForm.gender}
                        onChange={(e) => setOfflineForm(prev => ({ ...prev, gender: e.target.value as any }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
                      >
                        <option value="">Select Gender (Optional)</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Appointment Details */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                  <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    <span>Appointment Details</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Speciality <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={offlineForm.speciality_id}
                        onChange={(e) => handleOfflineSpecialityChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
                      >
                        <option value="">-- Select Speciality --</option>
                        {specialities.map((spec) => (
                          <option key={spec.id} value={spec.id}>
                            {spec.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Doctor <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={offlineForm.doctor_id}
                        onChange={(e) => setOfflineForm(prev => ({ ...prev, doctor_id: e.target.value, start_time: '' }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
                      >
                        <option value="">-- Select Doctor --</option>
                        {doctors
                          .filter(d => d.is_active && (!offlineForm.speciality_id || d.speciality_id === offlineForm.speciality_id))
                          .map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.name} ({doc.speciality_name || 'Consultant'})
                            </option>
                          ))}
                      </select>
                      {doctors.filter(d => d.is_active && (!offlineForm.speciality_id || d.speciality_id === offlineForm.speciality_id)).length === 0 && (
                        <p className="text-[11px] text-amber-700 mt-1">No active doctors found for the selected speciality.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Appointment Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={offlineForm.appointment_date}
                      onChange={(e) => setOfflineForm(prev => ({ ...prev, appointment_date: e.target.value, start_time: '' }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
                    />
                  </div>

                  {/* 3. Slot Selection Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-semibold text-slate-700">
                        Available Time Slot <span className="text-rose-500">*</span>
                      </label>
                      {offlineForm.start_time && (
                        <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          Selected: {formatTime12(offlineForm.start_time)}
                        </span>
                      )}
                    </div>

                    {loadingOfflineSlots ? (
                      <div className="py-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                        <div className="inline-block w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-1"></div>
                        <p className="text-[11px]">Checking doctor schedules and available slots...</p>
                      </div>
                    ) : offlineDoctorOnLeave ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs font-medium">
                          The selected doctor is on approved leave on {formatDate(offlineForm.appointment_date)}. Please choose another date or doctor.
                        </span>
                      </div>
                    ) : offlineAvailableSlots.length === 0 ? (
                      <div className="py-5 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
                        No time slots available for this doctor on {formatDate(offlineForm.appointment_date)}.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-44 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                          {offlineAvailableSlots.map((slot) => {
                            const isSelected = offlineForm.start_time === slot.time;
                            const isDisabled = slot.isBooked || slot.isPast;

                            return (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => setOfflineForm(prev => ({ ...prev, start_time: slot.time }))}
                                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all text-center ${
                                  isSelected
                                    ? 'bg-teal-600 text-white shadow-xs font-bold ring-2 ring-teal-600 ring-offset-1'
                                    : isDisabled
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 line-through'
                                    : 'bg-slate-50 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 text-slate-700 border border-slate-200'
                                }`}
                                title={
                                  slot.isBooked
                                    ? 'Slot already booked'
                                    : slot.isPast
                                    ? 'Slot is in the past'
                                    : 'Available slot'
                                }
                              >
                                {formatTime12(slot.time)}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-0.5">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded bg-slate-50 border border-slate-300"></span> Available
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded bg-teal-600"></span> Selected
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded bg-slate-200 line-through"></span> Booked / Past
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Chief Complaint / Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={offlineForm.notes}
                      onChange={(e) => setOfflineForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="e.g. Walk-in patient, headache and seasonal cold for 3 days..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    disabled={isSavingOffline}
                    onClick={() => setIsAddOfflineModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingOffline || !offlineForm.start_time || offlineDoctorOnLeave}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSavingOffline ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Registering Walk-in...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Book Offline Appointment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: ADD / EDIT DOCTOR
            ========================================================================= */}
        {isAddDoctorModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setIsAddDoctorModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <h4 className="text-lg font-extrabold text-slate-900 mb-4">
                {editingDoctor ? 'Edit Doctor Profile' : 'Add New Medical Consultant'}
              </h4>

              <form onSubmit={handleSaveDoctor} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Doctor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Deshmukh"
                    value={doctorForm.name || ''}
                    onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinical Department *</label>
                  <select
                    value={doctorForm.speciality_id || ''}
                    onChange={(e) => {
                      const sp = specialities.find(s => s.id === e.target.value);
                      setDoctorForm({ 
                        ...doctorForm, 
                        speciality_id: e.target.value,
                        speciality_name: sp?.name 
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
                  >
                    {specialities.map(sp => (
                      <option key={sp.id} value={sp.id}>{sp.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Qualifications *</label>
                    <input
                      type="text"
                      required
                      placeholder="MBBS, MD, DM"
                      value={doctorForm.qualifications || ''}
                      onChange={(e) => setDoctorForm({ ...doctorForm, qualifications: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Years of Experience</label>
                    <input
                      type="number"
                      value={doctorForm.experience_years || 5}
                      onChange={(e) => setDoctorForm({ ...doctorForm, experience_years: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Availability Status</label>
                  <select
                    value={doctorForm.availability_status || 'Available'}
                    onChange={(e: any) => setDoctorForm({ ...doctorForm, availability_status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
                  >
                    <option value="Available">Available</option>
                    <option value="Not Available">Not Available</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">OPD Start Time</label>
                    <input
                      type="time"
                      value={doctorForm.working_hours_start || '09:00'}
                      onChange={(e) => setDoctorForm({ ...doctorForm, working_hours_start: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">OPD End Time</label>
                    <input
                      type="time"
                      value={doctorForm.working_hours_end || '17:00'}
                      onChange={(e) => setDoctorForm({ ...doctorForm, working_hours_end: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Doctor Photo: Option 1 (URL) & Option 2 (Upload from PC) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800 text-xs">Doctor Profile Photo</label>
                    <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setDoctorImageSourceTab('url')}
                        className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                          doctorImageSourceTab === 'url'
                            ? 'bg-white text-teal-800 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>Web URL</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDoctorImageSourceTab('pc')}
                        className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                          doctorImageSourceTab === 'pc'
                            ? 'bg-white text-teal-800 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload from PC</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Image Preview Thumbnail */}
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow-xs shrink-0 flex items-center justify-center relative">
                      {doctorForm.photo_url ? (
                        <img 
                          src={doctorForm.photo_url} 
                          alt="Doctor Preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600';
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      {doctorImageSourceTab === 'url' ? (
                        <div>
                          <input
                            type="url"
                            placeholder="https://example.com/doctor-photo.jpg"
                            value={doctorForm.photo_url?.startsWith('data:') ? '' : (doctorForm.photo_url || '')}
                            onChange={(e) => setDoctorForm({ ...doctorForm, photo_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">Paste a direct image link from the web or hospital CDN.</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label 
                            htmlFor="doctor-pc-file-upload"
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-all"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{doctorForm.photo_url?.startsWith('data:') ? 'Change Photo from PC' : 'Choose Photo from PC'}</span>
                          </label>
                          <input
                            id="doctor-pc-file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleDoctorImageFileChange}
                            className="hidden"
                          />
                          {doctorForm.photo_url?.startsWith('data:') ? (
                            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Photo loaded from your computer
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400">Select any image from your computer (.jpg, .png, .webp)</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brief Bio</label>
                  <textarea
                    rows={2}
                    value={doctorForm.bio || ''}
                    onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddDoctorModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-xs"
                  >
                    Save Doctor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: ADD / EDIT HEALTH SCHEME
            ========================================================================= */}
        {isAddSchemeModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setIsAddSchemeModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <h4 className="text-lg font-extrabold text-slate-900 mb-4">
                {editingScheme ? 'Edit Health Scheme' : 'Add Government Scheme'}
              </h4>

              <form onSubmit={handleSaveScheme} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Scheme Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ayushman Bharat PM-JAY"
                    value={schemeForm.name || ''}
                    onChange={(e) => setSchemeForm({ ...schemeForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Scheme Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PM-JAY"
                      value={schemeForm.code || ''}
                      onChange={(e) => setSchemeForm({ ...schemeForm, code: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={schemeForm.category || 'Central'}
                      onChange={(e: any) => setSchemeForm({ ...schemeForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
                    >
                      <option value="Central">Central</option>
                      <option value="Maharashtra State">Maharashtra State</option>
                      <option value="Special Assistance">Special Assistance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Coverage Limit Amount</label>
                    <input
                      type="text"
                      placeholder="₹5,00,000 per family per year"
                      value={schemeForm.coverage_amount || ''}
                      onChange={(e) => setSchemeForm({ ...schemeForm, coverage_amount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Hospital Acceptance</label>
                    <select
                      value={schemeForm.hospital_acceptance_status || 'Accepted'}
                      onChange={(e: any) => setSchemeForm({ ...schemeForm, hospital_acceptance_status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
                    >
                      <option value="Accepted">Accepted (Empaneled)</option>
                      <option value="Under Verification">Under Verification</option>
                      <option value="Not Empanelled">Not Empanelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={schemeForm.description || ''}
                    onChange={(e) => setSchemeForm({ ...schemeForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Official Portal URL</label>
                    <input
                      type="url"
                      value={schemeForm.official_url || ''}
                      onChange={(e) => setSchemeForm({ ...schemeForm, official_url: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Official Source Name</label>
                    <input
                      type="text"
                      placeholder="National Health Authority"
                      value={schemeForm.official_source || ''}
                      onChange={(e) => setSchemeForm({ ...schemeForm, official_source: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddSchemeModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-xs"
                  >
                    Save Scheme
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DOCTOR DELETE CONFIRMATION MODAL */}
        {doctorToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-rose-100 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              
              <div className="text-center space-y-1">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Delete Doctor Profile?
                </h3>
                <p className="text-xs text-slate-500">
                  Confirm permanent removal of doctor from hospital roster
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{doctorToDelete.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    {doctorToDelete.speciality_name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {doctorToDelete.qualifications} • {doctorToDelete.experience_years} years exp.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Immediate Patient Panel Impact</span>
                </p>
                <p className="text-[11px] leading-relaxed text-rose-700">
                  Once deleted, this doctor will be immediately removed from the patient portal, Doctor Directory, and appointment scheduling wizard.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeletingDoctor}
                  onClick={() => setDoctorToDelete(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingDoctor}
                  onClick={handleConfirmDeleteDoctor}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  {isDeletingDoctor ? (
                    <span>Deleting...</span>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Yes, Delete Doctor</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCHEME DELETE CONFIRMATION MODAL */}
        {schemeToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-rose-100 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              
              <div className="text-center space-y-1">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Delete Health Scheme?
                </h3>
                <p className="text-xs text-slate-500">
                  Confirm permanent removal of health scheme from hospital database
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{schemeToDelete.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    {schemeToDelete.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Coverage: {schemeToDelete.coverage_amount}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Permanent Action</span>
                </p>
                <p className="text-[11px] leading-relaxed text-rose-700">
                  Are you sure you want to delete this health scheme? This action cannot be undone.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeletingScheme}
                  onClick={() => setSchemeToDelete(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingScheme}
                  onClick={handleConfirmDeleteScheme}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  {isDeletingScheme ? (
                    <span>Deleting...</span>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Scheme</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: PATIENT QUERY / FEEDBACK NOTIFICATION DETAILS
            ========================================================================= */}
        {selectedNotification && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative border border-slate-100 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200/60">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">
                      Patient Assistance Notification
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {selectedNotification.title}
                    </h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNotification(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                {selectedNotification.message}
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Received: {new Date(selectedNotification.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                <span className="font-semibold text-teal-700">Shri Gajanan Hospital Desk</span>
              </div>

              {/* Action buttons (Reply on WhatsApp, Call, Close) */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                {(() => {
                  const phoneMatch = selectedNotification.message.match(/(?:\+91[\s-]?)?[6-9]\d{9}/);
                  const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, '').slice(-10) : null;
                  if (phone) {
                    return (
                      <>
                        <a
                          href={`https://wa.me/91${phone}?text=${encodeURIComponent(`Dear Patient, thank you for reaching out to Shri Gajanan Hospital regarding your query. How may we assist you today?`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Reply on WhatsApp</span>
                        </a>
                        <a
                          href={`tel:+91${phone}`}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      </>
                    );
                  }
                  return null;
                })()}

                <button
                  type="button"
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
