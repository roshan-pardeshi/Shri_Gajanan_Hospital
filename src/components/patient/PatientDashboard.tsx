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
  Edit2
} from 'lucide-react';
import { Appointment, AppointmentStatus, Notification, UserProfile } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatTime12 } from '../../lib/utils';
import { RescheduleModal } from '../booking/RescheduleModal';
import { CancelModal } from '../booking/CancelModal';

interface PatientDashboardProps {
  onOpenBooking: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ onOpenBooking }) => {
  const { user, updateProfile } = useAuth();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'pending' | 'history' | 'profile' | 'notifications'>('all');
  
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
    if (!user) return;
    setLoading(true);
    try {
      const apts = await dataService.getAppointments({ patientId: user.id });
      setAppointments(apts);
      const notifs = await dataService.getNotifications(user.id);
      setNotifications(notifs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

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
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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
                    </div>
                  );
                })}
              </div>
            )}
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
