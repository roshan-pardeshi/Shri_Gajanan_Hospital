import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  UserCheck, 
  Send,
  LogIn,
  Stethoscope
} from 'lucide-react';
import { Doctor, EligibleAppointmentForReview } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';

interface PatientReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDoctorId?: string;
  preselectedAppointmentId?: string;
  onSuccess?: () => void;
  onOpenLogin?: () => void;
}

export const PatientReviewModal: React.FC<PatientReviewModalProps> = ({
  isOpen,
  onClose,
  preselectedDoctorId,
  preselectedAppointmentId,
  onSuccess,
  onOpenLogin,
}) => {
  const { user } = useAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(preselectedDoctorId || '');
  const [eligibleAppointments, setEligibleAppointments] = useState<EligibleAppointmentForReview[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(preselectedAppointmentId || '');

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState<string>('');
  const [reviewMessage, setReviewMessage] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingData, setFetchingData] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  // Rating labels for helpful feedback
  const ratingLabels: Record<number, string> = {
    1: 'Poor Experience',
    2: 'Fair Experience',
    3: 'Good Consultation',
    4: 'Very Good Care',
    5: 'Excellent Treatment & Service',
  };

  // Load doctors and patient's eligible completed appointments
  useEffect(() => {
    if (!isOpen) {
      setSubmittedSuccess(false);
      setErrorMsg(null);
      return;
    }

    setFetchingData(true);
    setErrorMsg(null);

    Promise.all([
      dataService.getDoctors(),
      user ? dataService.getEligibleAppointmentsForReview() : Promise.resolve([]),
    ])
      .then(([docs, eligibles]) => {
        setDoctors(docs);
        setEligibleAppointments(eligibles);

        // Auto-select doctor if preselected or first available
        if (preselectedDoctorId) {
          setSelectedDoctorId(preselectedDoctorId);
        } else if (docs.length > 0 && !selectedDoctorId) {
          // If patient has eligible appointments, pick doctor from first eligible appointment
          if (eligibles.length > 0) {
            setSelectedDoctorId(eligibles[0].doctor_id);
            setSelectedAppointmentId(eligibles[0].appointment_id);
          } else {
            setSelectedDoctorId(docs[0].id);
          }
        }

        if (preselectedAppointmentId) {
          setSelectedAppointmentId(preselectedAppointmentId);
        }
      })
      .catch((err) => {
        console.error('Failed to load review modal data:', err);
      })
      .finally(() => {
        setFetchingData(false);
      });
  }, [isOpen, user, preselectedDoctorId, preselectedAppointmentId]);

  // When selected doctor changes, find matching completed appointment
  useEffect(() => {
    if (!selectedDoctorId) return;

    const matchingAppointments = eligibleAppointments.filter(
      (a) => a.doctor_id === selectedDoctorId
    );

    const unreviewed = matchingAppointments.find((a) => !a.existing_review_id);
    if (unreviewed) {
      setSelectedAppointmentId(unreviewed.appointment_id);
    } else if (matchingAppointments.length > 0) {
      setSelectedAppointmentId(matchingAppointments[0].appointment_id);
    } else {
      setSelectedAppointmentId('');
    }
  }, [selectedDoctorId, eligibleAppointments]);

  if (!isOpen) return null;

  // Selected doctor object
  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Check if current user has an eligible un-reviewed completed appointment with selected doctor
  const appointmentsForDoctor = eligibleAppointments.filter(
    (a) => a.doctor_id === selectedDoctorId
  );
  const activeAppointment = appointmentsForDoctor.find(
    (a) => a.appointment_id === selectedAppointmentId
  ) || appointmentsForDoctor[0];

  const hasCompletedAppointment = appointmentsForDoctor.length > 0;
  const isAlreadyReviewed = activeAppointment?.existing_review_id != null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Please log in as a patient to submit your feedback.');
      return;
    }

    if (!selectedDoctorId) {
      setErrorMsg('Please select a doctor to review.');
      return;
    }

    if (!hasCompletedAppointment) {
      setErrorMsg('Only patients who have completed an appointment with this doctor can submit a review.');
      return;
    }

    if (isAlreadyReviewed) {
      setErrorMsg('You have already submitted a review for this completed appointment.');
      return;
    }

    if (!reviewMessage.trim() || reviewMessage.trim().length < 10) {
      setErrorMsg('Please share at least 10 characters in your feedback message.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await dataService.submitReview({
        doctor_id: selectedDoctorId,
        appointment_id: activeAppointment?.appointment_id || undefined,
        rating,
        review_title: reviewTitle.trim() || undefined,
        review_message: reviewMessage.trim(),
      });

      setSubmittedSuccess(true);
      if (onSuccess) onSuccess();

      // Automatically close after a short display
      setTimeout(() => {
        onClose();
        setSubmittedSuccess(false);
        setReviewTitle('');
        setReviewMessage('');
      }, 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-teal-600 fill-teal-600" />
            </div>
            <div>
              <h3 id="review-modal-title" className="text-base font-extrabold text-slate-900">
                Share Patient Feedback & Review
              </h3>
              <p className="text-[11px] text-slate-500">
                Help other patients make informed healthcare decisions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close review dialog"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* STATE 1: Success State */}
          {submittedSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900">
                Review Received!
              </h4>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 max-w-sm mx-auto leading-relaxed">
                Thank you! Your feedback has been submitted and is awaiting admin approval.
              </div>
              <p className="text-[11px] text-slate-500 pt-2">
                Our hospital quality team reviews all feedback to maintain patient trust and service excellence.
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          ) : !user ? (
            /* STATE 2: Unauthenticated Patient Gate */
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                <UserCheck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Patient Authentication Required</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                  To ensure authentic and verified feedback, only patients with completed appointments can submit reviews.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                {onOpenLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLogin();
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In to Continue</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* STATE 3: Review Submission Form */
            <form onSubmit={handleSubmit} className="space-y-4.5">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Doctor Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Select Consulting Doctor *
                </label>
                <div className="relative">
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    disabled={fetchingData}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
                  >
                    <option value="" disabled>-- Select Doctor --</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} — {doc.speciality_name || 'Specialist'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doctor Card Badge & Appointment Verification Status */}
                {currentDoctor && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={currentDoctor.photo_url}
                        alt={currentDoctor.name}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {currentDoctor.name}
                        </p>
                        <p className="text-[11px] text-teal-700 font-medium truncate">
                          {currentDoctor.speciality_name} • {currentDoctor.qualifications}
                        </p>
                      </div>
                    </div>

                    {/* Verification Status Pill */}
                    {hasCompletedAppointment ? (
                      isAlreadyReviewed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-amber-600" />
                          <span>Reviewed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          <span>Appointment Verified</span>
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        <span>No Completed Visit</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Notice if patient does NOT have a completed appointment */}
                {selectedDoctorId && !hasCompletedAppointment && (
                  <p className="mt-1.5 text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      You need a completed appointment with {currentDoctor?.name || 'this doctor'} to submit feedback.
                    </span>
                  </p>
                )}

                {/* Notice if already reviewed */}
                {selectedDoctorId && hasCompletedAppointment && isAlreadyReviewed && (
                  <p className="mt-1.5 text-[11px] text-amber-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      You have already submitted feedback for your visit with {currentDoctor?.name}.
                    </span>
                  </p>
                )}
              </div>

              {/* 2. Interactive Star Rating */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Overall Experience Rating *
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-hidden"
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-slate-700">
                    {ratingLabels[hoverRating || rating]} ({hoverRating || rating}/5)
                  </span>
                </div>
              </div>

              {/* 3. Review Title (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Review Title <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Excellent diagnosis and compassionate consultation"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* 4. Feedback Message (Required) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4. Your Feedback & Experience *
                </label>
                <textarea
                  required
                  rows={4}
                  minLength={10}
                  maxLength={1000}
                  placeholder="Share details of your consultation, doctor's explanation, hospital amenities, or recovery experience..."
                  value={reviewMessage}
                  onChange={(e) => setReviewMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none leading-relaxed"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span>Minimum 10 characters</span>
                  <span>{reviewMessage.length}/1000</span>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-100 text-[11px] text-teal-900 leading-relaxed">
                <strong>Privacy Protected:</strong> Your mobile number and personal contact details are never made public. Your review will display your first name and last initial only.
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !hasCompletedAppointment || isAlreadyReviewed || !reviewMessage.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-md shadow-teal-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

