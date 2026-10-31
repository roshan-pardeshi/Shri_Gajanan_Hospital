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
  Phone
} from 'lucide-react';
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
  Notification
} from '../../types';
import { dataService } from '../../services/dataService';
import { formatDate, formatTime12 } from '../../lib/utils';
import { openWhatsAppForAppointment } from '../../lib/whatsapp';
import { AdminLaboratoryTab } from './AdminLaboratoryTab';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'doctors' | 'laboratory' | 'schemes' | 'settings'>('appointments');
  const [loading, setLoading] = useState<boolean>(true);

  // Data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [schemes, setSchemes] = useState<HealthScheme[]>([]);
  const [settings, setSettings] = useState<HospitalSettings | null>(null);
  const [labTests, setLabTests] = useState<LaboratoryTest[]>([]);
  const [labSettings, setLabSettings] = useState<LaboratorySettings | null>(null);

  // Admin Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Filters for appointments
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Actions
  const [rejectingAppointment, setRejectingAppointment] = useState<Appointment | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  
  // Doctor Add/Edit & Delete Modals
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState<boolean>(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [isDeletingDoctor, setIsDeletingDoctor] = useState<boolean>(false);
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
      const [apts, docs, specs, schs, setts, tests, labSetts] = await Promise.all([
        dataService.getAppointments(),
        dataService.getDoctors(),
        dataService.getSpecialities(),
        dataService.getHealthSchemes(),
        dataService.getHospitalSettings(),
        dataService.getLaboratoryTests({ includeDrafts: true }),
        dataService.getLaboratorySettings(),
      ]);
      setAppointments(apts);
      setDoctors(docs);
      setSpecialities(specs);
      setSchemes(schs);
      setSettings(setts);
      setLabTests(tests);
      setLabSettings(labSetts);
    } finally {
      setLoading(false);
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
    return () => {
      clearInterval(interval);
      window.removeEventListener('new-hospital-notification', handleNewNotif);
    };
  }, []);

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
  };

  const handleMarkCompleted = async (aptId: string) => {
    await dataService.updateAppointmentStatus(aptId, 'Completed');
    await loadAllAdminData();
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

  // Handlers for Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    await dataService.updateHospitalSettings(settings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Analytics KPIs
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.appointment_date === todayStr);
  const pendingRequests = appointments.filter(a => ['Pending', 'Reschedule Requested'].includes(a.status));
  const approvedAppointments = appointments.filter(a => ['Approved', 'Rescheduled'].includes(a.status));
  const cancelledAppointments = appointments.filter(a => a.status === 'Cancelled');
  const activeDoctors = doctors.filter(d => d.is_active);

  // Filtered Appointments Table
  const filteredAppointments = appointments.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchRef = a.reference_number.toLowerCase().includes(q);
      const matchPat = a.patient_name.toLowerCase().includes(q);
      const matchDoc = a.doctor_name?.toLowerCase().includes(q);
      const matchPhone = a.patient_phone.includes(q);
      return matchRef || matchPat || matchDoc || matchPhone;
    }
    return true;
  });

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
                              setStatusFilter('all');
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
        </div>

        {/* =========================================================================
            SECTION A: APPOINTMENTS MANAGEMENT
            ========================================================================= */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6">
            
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Ref #, patient name, or doctor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  <option value="all">All Statuses ({appointments.length})</option>
                  <option value="Pending">Pending Approval ({appointments.filter(a => a.status === 'Pending').length})</option>
                  <option value="Reschedule Requested">Reschedule Requested ({appointments.filter(a => a.status === 'Reschedule Requested').length})</option>
                  <option value="Approved">Approved</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Rejected">Rejected</option>
                </select>
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
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No appointments match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Patient & Ref */}
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-teal-800 text-[11px]">
                            {apt.reference_number}
                          </span>
                          <p className="font-bold text-slate-900 mt-0.5">{apt.patient_name}</p>
                          <p className="text-[11px] text-slate-500">{apt.patient_phone}</p>
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
                <p className="text-xs text-slate-500">Configure schedules, fees, slot duration, and leave status.</p>
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
                        <span className="text-slate-400">Consultation Fee:</span>
                        <span className="font-bold text-slate-800">₹{doc.consultation_fee}</span>
                      </div>
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
            MODAL: REJECTION REASON PROMPT
            ========================================================================= */}
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      value={doctorForm.consultation_fee || 500}
                      onChange={(e) => setDoctorForm({ ...doctorForm, consultation_fee: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
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
