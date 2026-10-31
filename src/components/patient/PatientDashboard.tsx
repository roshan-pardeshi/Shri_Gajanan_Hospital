import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  RotateCcw, 
  XCircle, 
  User, 
  Bell, 
  Plus, 
  Printer, 
  X,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  Edit2,
  ExternalLink
} from 'lucide-react';
import { Appointment, AppointmentStatus, Notification, UserProfile, HealthScheme, Doctor } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatTime12 } from '../../lib/utils';
import { RescheduleModal } from '../booking/RescheduleModal';
import { CancelModal } from '../booking/CancelModal';

interface PatientDashboardProps {
  onOpenBooking: () => void;
  schemes?: HealthScheme[];
  doctors?: Doctor[];
  onSelectScheme?: (scheme: HealthScheme) => void;
  onNavigate?: (tab: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ 
  onOpenBooking,
  schemes: initialSchemes,
  doctors: initialDoctors,
  onSelectScheme,
  onNavigate
}) => {
  const { user, updateProfile } = useAuth();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'pending' | 'history' | 'schemes' | 'profile' | 'notifications'>('all');
  
  // Schemes State
  const [schemes, setSchemes] = useState<HealthScheme[]>(initialSchemes || []);
  const [schemeFilter, setSchemeFilter] = useState<'all' | 'Accepted' | 'Under Verification'>('all');

  // Doctors State (for live availability checks)
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors || []);

  // Modals
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [cancelAppointment, setCancelAppointment] = useState<Appointment | null>(null);
  const [selectedSlipAppointment, setSelectedSlipAppointment] = useState<Appointment | null>(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({
    full_name: user?.full_name || '',
    mobile_number: user?.mobile_number || '',
    email: user?.email || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || 'Male',
    address: user?.address || '',
  });
  const [profileSaved, setProfileSaved] = useState<boolean>(false);

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadDashboardData = async () => {
    try {
      const schs = await dataService.getHealthSchemes();
      setSchemes(schs);
      const docs = await dataService.getDoctors();
      setDoctors(docs);
      if (user) {
        setLoading(true);
        const apts = await dataService.getAppointments({ patientId: user.id });
        setAppointments(apts);
        const notifs = await dataService.getNotifications(user.id);
        setNotifications(notifs);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  useEffect(() => {
    if (initialSchemes && initialSchemes.length > 0) {
      setSchemes(initialSchemes);
    }
  }, [initialSchemes]);

  useEffect(() => {
    if (initialDoctors && initialDoctors.length > 0) {
      setDoctors(initialDoctors);
    }
  }, [initialDoctors]);

  useEffect(() => {
    const handleSchemesUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setSchemes(e.detail);
      } else {
        dataService.getHealthSchemes().then(setSchemes);
      }
    };
    window.addEventListener('health-schemes-updated', handleSchemesUpdate);

    const handleDoctorsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setDoctors(e.detail);
      } else {
        dataService.getDoctors().then(setDoctors);
      }
    };
    window.addEventListener('doctors-updated', handleDoctorsUpdate);

    return () => {
      window.removeEventListener('health-schemes-updated', handleSchemesUpdate);
      window.removeEventListener('doctors-updated', handleDoctorsUpdate);
    };
  }, []);

  // Sync profile form
  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name,
        mobile_number: user.mobile_number,
        email: user.email,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        address: user.address,
      });
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(profileForm);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // Status Badge Helper
  const renderStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Approval
          </span>
        );
      case 'Reschedule Requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
            <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
            Reschedule Requested
          </span>
        );
      case 'Rescheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            Rescheduled & Confirmed
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
            Completed
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Declined
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-600">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  // Scheme and stats helpers
  const underVerificationCount = schemes.filter(s => s.hospital_acceptance_status === 'Under Verification').length;
  const acceptedSchemesCount = schemes.filter(s => s.hospital_acceptance_status === 'Accepted').length;

  const filteredSchemesList = schemes.filter((s) => {
    if (schemeFilter === 'all') return true;
    return s.hospital_acceptance_status === schemeFilter;
  });

  // Filtered Appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'upcoming') {
      return ['Approved', 'Rescheduled'].includes(apt.status);
    }
    if (activeTab === 'pending') {
      return ['Pending', 'Reschedule Requested'].includes(apt.status);
    }
    if (activeTab === 'history') {
      return ['Completed', 'Cancelled', 'Rejected'].includes(apt.status);
    }
    return true;
  });

  return (
    <section className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Welcome Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-400 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-teal-500/20">
              {user?.full_name?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  Welcome, {user?.full_name || 'Patient'}
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Patient Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {user?.mobile_number} • {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenBooking}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Appointment</span>
          </button>
        </div>

        {/* Quick Stats & Health Schemes Status Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Card 1: Appointments Summary */}
          <div 
            onClick={() => setActiveTab('upcoming')}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card hover:border-teal-400 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Confirmed Visits</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {appointments.filter(a => ['Approved', 'Rescheduled'].includes(a.status)).length}
                </span>
                <span className="text-xs text-emerald-600 font-bold">Upcoming</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Pending Bookings */}
          <div 
            onClick={() => setActiveTab('pending')}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card hover:border-amber-400 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Bookings</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {appointments.filter(a => ['Pending', 'Reschedule Requested'].includes(a.status)).length}
                </span>
                <span className="text-xs text-amber-600 font-bold">Under Review</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Govt Health Schemes Status Card */}
          <div 
            onClick={() => setActiveTab('schemes')}
            className={`bg-white rounded-2xl p-5 border shadow-card cursor-pointer transition-all flex items-center justify-between group ${
              underVerificationCount > 0 
                ? 'border-amber-300 ring-2 ring-amber-100 hover:border-amber-500 bg-gradient-to-br from-white via-white to-amber-50/50' 
                : 'border-slate-200/90 hover:border-teal-400'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Govt Health Schemes</span>
                {underVerificationCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse">
                    <Clock className="w-2.5 h-2.5 text-amber-600" />
                    {underVerificationCount} Under Verification
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {acceptedSchemesCount}
                </span>
                <span className="text-xs text-emerald-600 font-bold">Empaneled & Cashless</span>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
              underVerificationCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-teal-50 text-teal-600'
            }`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Dashboard Nav Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 mb-6 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'all'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Bookings ({appointments.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'upcoming'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Upcoming Confirmed ({appointments.filter(a => ['Approved', 'Rescheduled'].includes(a.status)).length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'pending'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Pending Verification ({appointments.filter(a => ['Pending', 'Reschedule Requested'].includes(a.status)).length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schemes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'schemes'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Govt Health Schemes ({schemes.length})</span>
            {underVerificationCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1 ${
                activeTab === 'schemes'
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                <Clock className="w-2.5 h-2.5 text-amber-700" />
                {underVerificationCount} Under Verification
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'history'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Past / Cancelled ({appointments.filter(a => ['Completed', 'Cancelled', 'Rejected'].includes(a.status)).length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'notifications'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Notifications ({notifications.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'profile'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            My Profile Settings
          </button>
        </div>

        {/* =========================================================================
            TAB CONTENT: APPOINTMENT LIST
            ========================================================================= */}
        {['all', 'upcoming', 'pending', 'history'].includes(activeTab) && (
          <div>
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Loading appointments...
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-card">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">No appointments found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  You don’t have any appointments in this category right now.
                </p>
                <button
                  type="button"
                  onClick={onOpenBooking}
                  className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 text-white shadow-md shadow-teal-600/20"
                >
                  Book an Appointment
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((apt) => {
                  const canReschedule = ['Pending', 'Approved'].includes(apt.status);
                  const canCancel = ['Pending', 'Approved', 'Reschedule Requested'].includes(apt.status);
                  const matchedDoc = doctors.find(d => d.id === apt.doctor_id || (apt.doctor_name && d.name.toLowerCase() === apt.doctor_name.toLowerCase()));
                  const isDoctorOnLeave = matchedDoc?.availability_status === 'On Leave';

                  return (
                    <div
                      key={apt.id}
                      className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card hover:border-teal-400 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                    >
                      {/* Left: Doctor & Appointment Details */}
                      <div className="flex items-start gap-4">
                        <img
                          src={apt.doctor_photo || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'}
                          alt={apt.doctor_name}
                          className="w-14 h-14 rounded-2xl object-cover object-top border border-slate-100 shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              {apt.reference_number}
                            </span>
                            {renderStatusBadge(apt.status)}
                          </div>

                          <h3 className="text-base font-extrabold text-slate-900 mt-1">
                            {apt.doctor_name}
                          </h3>
                          <p className="text-xs font-semibold text-teal-700">
                            {apt.speciality_name} • {apt.visit_type === 'first_visit' ? 'First Consultation' : 'Follow-up'}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <Calendar className="w-3.5 h-3.5 text-teal-600" />
                              <span>{formatDate(apt.appointment_date)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <Clock className="w-3.5 h-3.5 text-teal-600" />
                              <span>{formatTime12(apt.start_time)} - {formatTime12(apt.end_time)}</span>
                            </div>
                          </div>

                          {/* Reason */}
                          <p className="text-xs text-slate-500 pt-1 line-clamp-1 italic">
                            Reason: "{apt.reason_for_visit}"
                          </p>

                          {/* Doctor On Leave Warning Notice */}
                          {isDoctorOnLeave && ['Approved', 'Pending', 'Rescheduled'].includes(apt.status) && (
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 mt-2 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                              <span><strong>Doctor On Leave:</strong> Dr. {apt.doctor_name} is currently marked <strong>On Leave</strong>. If this visit is today, our OPD reception will coordinate an alternate specialist.</span>
                            </div>
                          )}

                          {/* Reschedule pending notice */}
                          {apt.status === 'Reschedule Requested' && apt.requested_reschedule_date && (
                            <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 mt-2 space-y-0.5">
                              <span className="font-bold block">Reschedule Requested by you:</span>
                              <span>Target Slot: {formatDate(apt.requested_reschedule_date)} at {formatTime12(apt.requested_reschedule_time || '')}</span>
                              {apt.reschedule_reason && (
                                <span className="block text-[11px] text-sky-700 italic">"{apt.reschedule_reason}"</span>
                              )}
                            </div>
                          )}

                          {/* Rejection / Cancellation explanation */}
                          {apt.status === 'Rejected' && apt.rejection_reason && (
                            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 mt-2">
                              <strong>Decline Reason:</strong> {apt.rejection_reason}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Actions */}
                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0">
                        <button
                          type="button"
                          onClick={() => setSelectedSlipAppointment(apt)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Slip</span>
                        </button>

                        {canReschedule && (
                          <button
                            type="button"
                            onClick={() => setRescheduleAppointment(apt)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reschedule</span>
                          </button>
                        )}

                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => setCancelAppointment(apt)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      {/* Cashless Schemes OPD Footnote */}
                      <div className="w-full mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>Availing PM-JAY / MJPJAY cashless treatment? Bring original beneficiary card & Aadhaar.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('schemes')}
                          className="text-teal-700 font-bold hover:underline shrink-0 text-left sm:text-right flex items-center gap-1"
                        >
                          <span>Check Scheme Empanelment Status</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB CONTENT: GOVT HEALTH SCHEMES & EMPANELMENT STATUS
            ========================================================================= */}
        {activeTab === 'schemes' && (
          <div className="space-y-6">
            {/* Header / Intro Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Government Health Schemes & Empanelment Status
                    </h3>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      Live Hospital Acceptance
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    Shri Gajanan Multispeciality Hospital supports major central and Maharashtra state government health assurance schemes. Check real-time empanelment status, cashless financial coverage, and required documents.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSchemeFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      schemeFilter === 'all'
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({schemes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSchemeFilter('Accepted')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      schemeFilter === 'Accepted'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    Empaneled ({acceptedSchemesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSchemeFilter('Under Verification')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      schemeFilter === 'Under Verification'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    Under Verification ({underVerificationCount})
                  </button>
                </div>
              </div>

              {/* Status explanation notice if any scheme is Under Verification */}
              {underVerificationCount > 0 && (
                <div className="mt-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-200/70 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
                  </div>
                  <div className="text-xs leading-relaxed">
                    <strong className="font-extrabold text-amber-900 block mb-0.5">
                      Empanelment Notice: {underVerificationCount} {underVerificationCount === 1 ? 'Scheme is' : 'Schemes are'} Under Verification
                    </strong>
                    <span>
                      Schemes with status <span className="font-bold underline decoration-amber-400">Under Verification</span> are currently undergoing annual renewal or procedural audit with the state health authority. Patients seeking immediate admission under these schemes should consult our <strong>Arogya Mitra Helpdesk (OPD Counter 4, Ground Floor)</strong> or call <strong>+91 98765 43210</strong> for case-by-case pre-authorization.
                    </span>
                  </div>
                </div>
              )}

              {/* Arogya Mitra Help Desk Info Strip */}
              <div className="mt-4 p-4 rounded-2xl bg-teal-50/60 border border-teal-100/80 text-teal-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-teal-950 block">Ayushman Arogya Mitra Helpdesk</span>
                    <span className="text-[11px] text-teal-800">Ground Floor Reception • Counter 4 • Open 24/7 for IPD Admissions</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-teal-900 bg-teal-100/80 px-2.5 py-1 rounded-lg">
                    Helpline: 14555 / +91 98765 43210
                  </span>
                </div>
              </div>
            </div>

            {/* Scheme Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSchemesList.map((scheme) => {
                const isAccepted = scheme.hospital_acceptance_status === 'Accepted';
                const isUnderVerification = scheme.hospital_acceptance_status === 'Under Verification';

                return (
                  <div
                    key={scheme.id}
                    className={`bg-white rounded-3xl p-6 border shadow-card transition-all flex flex-col justify-between ${
                      isUnderVerification
                        ? 'border-amber-300 ring-2 ring-amber-200/50 hover:border-amber-400'
                        : 'border-slate-200/90 hover:border-teal-400'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                          {scheme.category}
                        </span>

                        <div>
                          {isAccepted && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Hospital Empaneled
                            </span>
                          )}
                          {isUnderVerification && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-700" />
                              Under Verification
                            </span>
                          )}
                          {!isAccepted && !isUnderVerification && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                              Not Empaneled
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Scheme Name & Description */}
                      <h4 className="text-lg font-extrabold text-slate-900 mb-2">
                        {scheme.name}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                        {scheme.description}
                      </p>

                      {/* Financial Coverage Banner */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Financial Protection
                          </span>
                          <span className="text-sm font-extrabold text-slate-900">
                            {scheme.coverage_amount}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-teal-600 text-white">
                          Cashless
                        </span>
                      </div>

                      {/* Status Details / Notice */}
                      <div className={`p-3 rounded-xl mb-4 text-xs ${
                        isUnderVerification
                          ? 'bg-amber-50 border border-amber-200 text-amber-800'
                          : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      }`}>
                        <div className="flex items-center gap-2 font-bold mb-0.5">
                          {isUnderVerification ? (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Empanelment Status: Under Verification</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Empanelment Status: 100% Cashless Active</span>
                            </>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-normal">
                          {isUnderVerification
                            ? 'Our hospital renewal application is in progress with the nodal agency. Counter pre-authorization is available.'
                            : 'Direct cashless claims supported for all eligible admitted patients.'}
                        </p>
                      </div>

                      {/* Mandatory Documents Checklist */}
                      {scheme.required_documents && scheme.required_documents.length > 0 && (
                        <div className="mb-4">
                          <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                            Required Documents:
                          </span>
                          <ul className="space-y-1">
                            {scheme.required_documents.slice(0, 3).map((doc, idx) => (
                              <li key={idx} className="text-[11px] text-slate-500 flex items-start gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{doc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Bottom Links */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        Verified: {scheme.last_verified_date || '2026-09-15'}
                      </span>
                      {scheme.official_url && (
                        <a
                          href={scheme.official_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                        >
                          <span>Official Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB CONTENT: NOTIFICATIONS
            ========================================================================= */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card">
            <h3 className="text-base font-extrabold text-slate-900 mb-4">
              In-App Appointment & Hospital Notifications
            </h3>

            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No notifications yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div key={n.id} className="py-3.5 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB CONTENT: PROFILE SETTINGS
            ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card max-w-2xl">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Patient Profile & Contact Information
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Used strictly for appointment confirmations and emergency communication.
            </p>

            {profileSaved && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.full_name || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={profileForm.mobile_number || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, mobile_number: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={profileForm.date_of_birth || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={profileForm.gender || 'Male'}
                    onChange={(e: any) => setProfileForm({ ...profileForm, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  value={profileForm.address || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reschedule Modal */}
        <RescheduleModal
          isOpen={Boolean(rescheduleAppointment)}
          appointment={rescheduleAppointment}
          onClose={() => setRescheduleAppointment(null)}
          onSuccess={() => {
            loadDashboardData();
          }}
        />

        {/* Cancel Modal */}
        <CancelModal
          isOpen={Boolean(cancelAppointment)}
          appointment={cancelAppointment}
          onClose={() => setCancelAppointment(null)}
          onSuccess={() => {
            loadDashboardData();
          }}
        />

        {/* View/Print Slip Modal */}
        {selectedSlipAppointment && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setSelectedSlipAppointment(null)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center pb-4 border-b border-slate-200">
                <h3 className="font-extrabold text-base text-slate-900">
                  SmartCare Hospital Portal
                </h3>
                <p className="text-[11px] text-teal-700 font-semibold">
                  Shri Gajanan Multispeciality Hospital • OPD Consultation Slip
                </p>
                <div className="mt-3 inline-block px-3 py-1 rounded-md bg-slate-100 font-mono font-bold text-xs text-slate-800">
                  REF: {selectedSlipAppointment.reference_number}
                </div>
              </div>

              <div className="py-4 space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Doctor:</span>
                  <span className="font-bold text-slate-900">{selectedSlipAppointment.doctor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Speciality:</span>
                  <span className="font-semibold">{selectedSlipAppointment.speciality_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Appointment Date:</span>
                  <span className="font-bold">{formatDate(selectedSlipAppointment.appointment_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Consultation Slot:</span>
                  <span className="font-bold">{formatTime12(selectedSlipAppointment.start_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Patient:</span>
                  <span className="font-semibold">{selectedSlipAppointment.patient_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contact:</span>
                  <span>{selectedSlipAppointment.patient_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span>{selectedSlipAppointment.status}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 text-[10px] text-slate-500 leading-relaxed border border-slate-200">
                Please present this reference number or digital slip at the OPD Reception Desk (Counter 2) 15 minutes before your slot time.
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSlipAppointment(null)}
                  className="px-5 py-2 rounded-xl font-bold text-xs bg-teal-600 text-white"
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
