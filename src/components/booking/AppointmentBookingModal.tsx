import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Stethoscope,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Doctor, Speciality, Appointment } from '../../types';
import { dataService, isUUID } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatTime12 } from '../../lib/utils';

const isDoctorCurrentlyAvailable = (doc: Doctor): boolean => {
  // 1. Must be active in the system
  if (doc.is_active === false) {
    return false;
  }

  // 2. Doctor availability status must be explicitly 'Available'
  if (doc.availability_status !== 'Available') {
    return false;
  }

  // 3. Must have active working schedule days
  if (Array.isArray(doc.working_days) && doc.working_days.length === 0) {
    return false;
  }

  // 4. Must not be on approved leave today
  if (Array.isArray(doc.leave_dates) && doc.leave_dates.length > 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (doc.leave_dates.includes(todayStr)) {
      return false;
    }
  }

  return true;
};

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDoctor?: Doctor | null;
  onBookingSuccess: (appointment: Appointment) => void;
}

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  onClose,
  preselectedDoctor,
  onBookingSuccess,
}) => {
  const { user } = useAuth();

  // Wizard Steps (1 to 6)
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data lists
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<{ time: string; isBooked: boolean; isPast: boolean }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);

  // Selected Booking Form State
  const [selectedSpeciality, setSelectedSpeciality] = useState<Speciality | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(preselectedDoctor || null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  
  // Patient Details
  const [patientName, setPatientName] = useState<string>(user?.full_name || '');
  const [patientPhone, setPatientPhone] = useState<string>(user?.mobile_number || '');
  const [patientEmail, setPatientEmail] = useState<string>(user?.email || '');
  const [reasonForVisit, setReasonForVisit] = useState<string>('');
  const [visitType, setVisitType] = useState<'first_visit' | 'follow_up'>('first_visit');

  // Confirmed booking state
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // Load Initial Specialities and Doctors
  useEffect(() => {
    if (isOpen) {
      dataService.getSpecialities().then(setSpecialities);
      dataService.getDoctors().then(docs => {
        setDoctors(docs);
        if (preselectedDoctor) {
          const freshDoc = docs.find(d => d.id === preselectedDoctor.id) || preselectedDoctor;
          if (freshDoc.availability_status === 'Available') {
            setSelectedDoctor(freshDoc);
            const matchedSpec = docs.find(d => d.id === preselectedDoctor.id)?.speciality_id;
            if (matchedSpec) {
              dataService.getSpecialities().then(specs => {
                const sp = specs.find(s => s.id === matchedSpec);
                if (sp) setSelectedSpeciality(sp);
              });
            }
            // Fast-forward to step 3 only if doctor is available
            setStep(3);
          } else {
            // Doctor is On Leave or Not Available - prevent booking and notify patient
            setErrorMsg(`Dr. ${freshDoc.name} is currently ${freshDoc.availability_status}. Please select another doctor.`);
            setSelectedDoctor(null);
            setStep(2);
          }
        }
      });

      // Default date to tomorrow if none set
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      const defaultDateStr = tmrw.toISOString().split('T')[0];
      setSelectedDate(defaultDateStr);
    } else {
      // Reset
      setStep(1);
      setErrorMsg(null);
      setConfirmedAppointment(null);
    }
  }, [isOpen, preselectedDoctor]);

  // Listen for doctor availability updates in real time
  useEffect(() => {
    const handleAvailabilityChange = () => {
      dataService.getSpecialities().then(setSpecialities);
      dataService.getDoctors().then(setDoctors);
    };

    window.addEventListener('doctors-updated', handleAvailabilityChange);
    window.addEventListener('doctor-availability-changed', handleAvailabilityChange);
    return () => {
      window.removeEventListener('doctors-updated', handleAvailabilityChange);
      window.removeEventListener('doctor-availability-changed', handleAvailabilityChange);
    };
  }, []);

  // Sync user info into form if logged in
  useEffect(() => {
    if (user) {
      if (!patientName) setPatientName(user.full_name);
      if (!patientPhone) setPatientPhone(user.mobile_number);
      if (!patientEmail) setPatientEmail(user.email);
    }
  }, [user]);

  // Load available slots whenever selected doctor or date changes
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      setSlotsLoading(true);
      setErrorMsg(null);
      setSelectedSlot('');
      dataService.getAvailableSlots(selectedDoctor.id, selectedDate)
        .then(slots => {
          setAvailableSlots(slots);
          setSlotsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setSlotsLoading(false);
        });
    }
  }, [selectedDoctor, selectedDate]);

  if (!isOpen) return null;

  // Handle Speciality Select
  const handleSelectSpeciality = (spec: Speciality) => {
    setSelectedSpeciality(spec);
    // If current selected doctor doesn't match this speciality, reset doctor
    if (selectedDoctor && selectedDoctor.speciality_id !== spec.id) {
      setSelectedDoctor(null);
      setSelectedSlot('');
    }
    setStep(2);
  };

  // Handle Doctor Select
  const handleSelectDoctor = (doc: Doctor) => {
    setSelectedDoctor(doc);
    if (!selectedSpeciality) {
      const sp = specialities.find(s => s.id === doc.speciality_id);
      if (sp) setSelectedSpeciality(sp);
    }
    setStep(3);
  };

  // Submit Final Booking
  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot || !patientName || !patientPhone || !reasonForVisit) {
      setErrorMsg('Please ensure all required fields are filled.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const created = await dataService.bookAppointment({
        patient_id: user?.id && isUUID(user.id) ? user.id : null,
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_email: patientEmail,
        doctor_id: selectedDoctor.id,
        speciality_id: selectedDoctor.speciality_id,
        appointment_date: selectedDate,
        start_time: selectedSlot,
        reason_for_visit: reasonForVisit,
        visit_type: visitType,
      });

      setConfirmedAppointment(created);
      onBookingSuccess(created);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }

    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete booking. Please try another slot.');
    } finally {
      setLoading(false);
    }
  };

  // Filter specialities: show ONLY specialities that have at least one currently available doctor
  const availableSpecialities = specialities.filter((spec) =>
    doctors.some((doc) => doc.speciality_id === spec.id && isDoctorCurrentlyAvailable(doc))
  );

  // Filter doctors for the chosen speciality in Step 2
  const availableDoctors = selectedSpeciality
    ? doctors.filter(d => d.speciality_id === selectedSpeciality.id)
    : doctors;

  // Get min date string for date picker (today)
  const minDateStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">
              SmartCare OPD Booking
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
              Book a Doctor Appointment
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator (Only if not already confirmed) */}
        {!confirmedAppointment && (
          <div className="my-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
              <span className={step >= 1 ? 'text-teal-700 font-bold' : ''}>1. Speciality</span>
              <span className={step >= 2 ? 'text-teal-700 font-bold' : ''}>2. Doctor</span>
              <span className={step >= 3 ? 'text-teal-700 font-bold' : ''}>3. Date</span>
              <span className={step >= 4 ? 'text-teal-700 font-bold' : ''}>4. Slot</span>
              <span className={step >= 5 ? 'text-teal-700 font-bold' : ''}>5. Details</span>
              <span className={step >= 6 ? 'text-teal-700 font-bold' : ''}>6. Confirm</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-teal-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* =========================================================================
            CONFIRMATION SUCCESS SCREEN (Post-Booking)
            ========================================================================= */}
        {confirmedAppointment ? (
          <div className="py-6 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                Status: Pending Coordinator Approval
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                Appointment Requested Successfully!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your appointment reference has been generated and saved to the hospital database.
              </p>
            </div>

            {/* Reference Badge Card */}
            <div className="p-5 rounded-2xl bg-teal-50 border border-teal-100 text-left space-y-3 max-w-md mx-auto">
              <div className="flex justify-between items-center pb-2 border-b border-teal-200/60">
                <span className="text-xs text-teal-800 font-bold uppercase tracking-wider">
                  Booking Reference
                </span>
                <span className="text-sm font-black font-mono text-teal-900 bg-white px-2.5 py-0.5 rounded border border-teal-300">
                  {confirmedAppointment.reference_number}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Doctor:</span>
                  <span className="font-bold text-slate-800">{confirmedAppointment.doctor_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Department:</span>
                  <span className="font-bold text-slate-800">{confirmedAppointment.speciality_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date:</span>
                  <span className="font-bold text-slate-800">{formatDate(confirmedAppointment.appointment_date)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Time Slot:</span>
                  <span className="font-bold text-slate-800">{formatTime12(confirmedAppointment.start_time)}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-teal-100">
                  <span className="text-slate-400 block">Patient Name:</span>
                  <span className="font-semibold text-slate-800">{confirmedAppointment.patient_name} ({confirmedAppointment.patient_phone})</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
              >
                Done / View in Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* =====================================================================
                STEP 1: SELECT SPECIALITY
                ===================================================================== */}
            {step === 1 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900">
                  Step 1: Select Medical Department
                </h4>
                {availableSpecialities.length === 0 ? (
                  <div className="py-12 px-4 text-center rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-medium text-slate-600 max-w-sm mx-auto">
                      Currently, no specialities have available doctors. Please try again later.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                    {availableSpecialities.map((spec) => (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => handleSelectSpeciality(spec)}
                        className={`p-3.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                          selectedSpeciality?.id === spec.id
                            ? 'border-teal-500 bg-teal-50/70 text-teal-900 ring-2 ring-teal-500/20'
                            : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold">{spec.name}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{spec.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =====================================================================
                STEP 2: SELECT DOCTOR
                ===================================================================== */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    Step 2: Select Specialist ({selectedSpeciality?.name})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-teal-600 hover:text-teal-800"
                  >
                    Change Speciality
                  </button>
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {availableDoctors.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No doctors available in this speciality right now.
                    </div>
                  ) : (
                    availableDoctors.map((doc) => {
                      const isDoctorAvailable = doc.availability_status === 'Available';
                      return (
                        <div
                          key={doc.id}
                          onClick={() => {
                            if (isDoctorAvailable) {
                              handleSelectDoctor(doc);
                            }
                          }}
                          className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                            !isDoctorAvailable
                              ? 'border-slate-200 bg-slate-50/80 opacity-70 cursor-not-allowed'
                              : selectedDoctor?.id === doc.id
                              ? 'border-teal-500 bg-teal-50/70 text-teal-900 ring-2 ring-teal-500/20 cursor-pointer'
                              : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={doc.photo_url}
                              alt={doc.name}
                              className="w-12 h-12 rounded-xl object-cover object-top border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-xs font-bold text-slate-900">{doc.name}</h5>
                                {!isDoctorAvailable && (
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-300">
                                    Unavailable
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">{doc.qualifications} • {doc.experience_years} Yrs</p>
                            </div>
                          </div>

                          <div className="text-right">
                            {isDoctorAvailable ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 block">
                                Available
                              </span>
                            ) : doc.availability_status === 'On Leave' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white block animate-pulse">
                                On Leave
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 block">
                                {doc.availability_status}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {doc.working_hours_start} - {doc.working_hours_end}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* =====================================================================
                STEP 3: CHOOSE DATE
                ===================================================================== */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    Step 3: Select Consultation Date
                  </h4>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs font-bold text-teal-600 hover:text-teal-800"
                  >
                    Change Doctor
                  </button>
                </div>

                {selectedDoctor && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs">
                    <img
                      src={selectedDoctor.photo_url}
                      alt={selectedDoctor.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-bold text-slate-800">{selectedDoctor.name}</p>
                      <p className="text-slate-500 text-[11px]">
                        Works on: {selectedDoctor.working_days.join(', ')} ({selectedDoctor.working_hours_start} to {selectedDoctor.working_hours_end})
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Choose Date *
                  </label>
                  <input
                    type="date"
                    min={minDateStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Past dates are prevented automatically. Doctor OPD schedule is verified on date selection.
                  </p>
                </div>
              </div>
            )}

            {/* =====================================================================
                STEP 4: SELECT TIME SLOT
                ===================================================================== */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Step 4: Select Available Time Slot
                    </h4>
                    <p className="text-xs text-slate-500">
                      Date: <strong className="text-slate-800">{formatDate(selectedDate)}</strong> with {selectedDoctor?.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs font-bold text-teal-600 hover:text-teal-800"
                  >
                    Change Date
                  </button>
                </div>

                {slotsLoading ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Checking live slot availability...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">Doctor not available on this date</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      The doctor might not have an OPD shift or may be on leave. Please pick an alternate date.
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold"
                    >
                      Pick Another Date
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
                      {availableSlots.map((slot, sIdx) => {
                        const isUnavailable = slot.isBooked || slot.isPast;
                        const isSelected = selectedSlot === slot.time;

                        return (
                          <button
                            key={sIdx}
                            type="button"
                            disabled={isUnavailable}
                            onClick={() => setSelectedSlot(slot.time)}
                            className={`p-2.5 rounded-xl text-center text-xs font-semibold transition-all border ${
                              isUnavailable
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                                : isSelected
                                ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20'
                                : 'bg-white hover:border-teal-500 text-slate-800 border-slate-200'
                            }`}
                          >
                            <span>{formatTime12(slot.time)}</span>
                            {slot.isBooked && (
                              <span className="block text-[9px] text-rose-500 font-bold no-underline">Booked</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-white border border-slate-300" />
                        <span>Available</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-teal-600" />
                        <span>Selected</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-slate-200" />
                        <span>Booked / Past</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =====================================================================
                STEP 5: ENTER PATIENT DETAILS
                ===================================================================== */}
            {step === 5 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900">
                  Step 5: Patient Details & Reason for Visit
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Patient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Patil"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98XXX XXXXX"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. patient@example.com"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Visit Nature
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="visitType"
                          value="first_visit"
                          checked={visitType === 'first_visit'}
                          onChange={() => setVisitType('first_visit')}
                          className="text-teal-600 focus:ring-teal-500"
                        />
                        <span>First Consultation</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="visitType"
                          value="follow_up"
                          checked={visitType === 'follow_up'}
                          onChange={() => setVisitType('follow_up')}
                          className="text-teal-600 focus:ring-teal-500"
                        />
                        <span>Follow-up Visit</span>
                      </label>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Reason for Visit / Symptoms *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Please describe your symptoms briefly, e.g. Chest pain during exertion, knee stiffness..."
                      value={reasonForVisit}
                      onChange={(e) => setReasonForVisit(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* =====================================================================
                STEP 6: REVIEW & CONFIRM
                ===================================================================== */}
            {step === 6 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900">
                  Step 6: Review & Final Confirmation
                </h4>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedDoctor?.photo_url}
                        alt={selectedDoctor?.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-extrabold text-slate-900">{selectedDoctor?.name}</p>
                        <p className="text-slate-500">{selectedDoctor?.speciality_name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block">Appointment Date:</span>
                      <span className="font-bold text-slate-800">{formatDate(selectedDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Time Slot:</span>
                      <span className="font-bold text-slate-800">{formatTime12(selectedSlot)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Patient Name:</span>
                      <span className="font-bold text-slate-800">{patientName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Contact Phone:</span>
                      <span className="font-bold text-slate-800">{patientPhone}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-200">
                      <span className="text-slate-400 block">Reason for Consultation:</span>
                      <span className="text-slate-700 italic">"{reasonForVisit}"</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 text-[11px] text-teal-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    Your slot will be reserved immediately. Our OPD coordinator will confirm within 15 minutes.
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <span />
              )}

              {step < 6 ? (
                <button
                  type="button"
                  disabled={
                    (step === 1 && !selectedSpeciality) ||
                    (step === 2 && !selectedDoctor) ||
                    (step === 3 && !selectedDate) ||
                    (step === 4 && !selectedSlot) ||
                    (step === 5 && (!patientName || !patientPhone || !reasonForVisit))
                  }
                  onClick={() => {
                    setErrorMsg(null);
                    setStep(step + 1);
                  }}
                  className="flex items-center gap-1 px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmBooking}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Confirming...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Book Appointment</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
