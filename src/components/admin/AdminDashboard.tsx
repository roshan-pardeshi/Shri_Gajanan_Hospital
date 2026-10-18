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
  FileText
} from 'lucide-react';
import { 
  Appointment, 
  AppointmentStatus, 
  Doctor, 
  HealthScheme, 
  HospitalSettings, 
  Speciality, 
  AvailabilityStatus,
  SchemeEmpanelmentStatus 
} from '../../types';
import { dataService } from '../../services/dataService';
import { formatDate, formatTime12 } from '../../lib/utils';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'doctors' | 'schemes' | 'settings'>('appointments');
  const [loading, setLoading] = useState<boolean>(true);

  // Data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [schemes, setSchemes] = useState<HealthScheme[]>([]);
  const [settings, setSettings] = useState<HospitalSettings | null>(null);

  // Filters for appointments
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Actions
  const [rejectingAppointment, setRejectingAppointment] = useState<Appointment | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  
  // Doctor Add/Edit Modal
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState<boolean>(false);
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

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [apts, docs, specs, schs, setts] = await Promise.all([
        dataService.getAppointments(),
        dataService.getDoctors(),
        dataService.getSpecialities(),
        dataService.getHealthSchemes(),
        dataService.getHospitalSettings(),
      ]);
      setAppointments(apts);
      setDoctors(docs);
      setSpecialities(specs);
      setSchemes(schs);
      setSettings(setts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Handlers for Appointment Status Change
  const handleApproveAppointment = async (aptId: string) => {
    await dataService.updateAppointmentStatus(aptId, 'Approved');
    await loadAllAdminData();
  };

  const handleOpenRejectModal = (apt: Appointment) => {
    setRejectingAppointment(apt);
    setRejectionReason('Doctor unavailable during this shift');
  };

  const handleConfirmReject = async () => {
    if (!rejectingAppointment) return;
    await dataService.updateAppointmentStatus(
      rejectingAppointment.id, 
      'Rejected', 
      rejectionReason || 'Declined by hospital coordinator'
    );
    setRejectingAppointment(null);
    await loadAllAdminData();
  };

  const handleApproveReschedule = async (apt: Appointment) => {
    // Approving a Reschedule Requested appointment promotes the requested date/time
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
    if (editingDoctor) {
      await dataService.updateDoctor(editingDoctor.id, doctorForm);
    } else {
      await dataService.addDoctor(doctorForm as any);
    }
    setEditingDoctor(null);
    setIsAddDoctorModalOpen(false);
    await loadAllAdminData();
  };

  const handleToggleDoctorStatus = async (doc: Doctor, newStatus: AvailabilityStatus) => {
    await dataService.updateDoctor(doc.id, { availability_status: newStatus });
    await loadAllAdminData();
  };

  // Handlers for Scheme Management
  const handleSaveScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingScheme) {
      await dataService.updateHealthScheme(editingScheme.id, schemeForm);
    } else {
      await dataService.addHealthScheme(schemeForm as any);
    }
    setEditingScheme(null);
    setIsAddSchemeModalOpen(false);
    await loadAllAdminData();
  };

  const handleToggleSchemeAcceptance = async (scheme: HealthScheme, newStatus: SchemeEmpanelmentStatus) => {
    await dataService.updateHealthScheme(scheme.id, { 
      hospital_acceptance_status: newStatus,
      last_verified_date: new Date().toISOString().split('T')[0]
    });
    await loadAllAdminData();
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAllAdminData}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
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

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Doctors</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{activeDoctors.length}</p>
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
                            {/* Pending State Actions */}
                            {apt.status === 'Pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveAppointment(apt.id)}
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

                    <button
                      type="button"
                      onClick={() => {
                        setEditingDoctor(doc);
                        setDoctorForm(doc);
                        setIsAddDoctorModalOpen(true);
                      }}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100"
                    >
                      Edit Profile
                    </button>
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

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Photo Image URL</label>
                  <input
                    type="url"
                    value={doctorForm.photo_url || ''}
                    onChange={(e) => setDoctorForm({ ...doctorForm, photo_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
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

      </div>
    </section>
  );
};
