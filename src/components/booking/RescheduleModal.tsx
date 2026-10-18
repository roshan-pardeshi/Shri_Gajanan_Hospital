import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';
import { Appointment } from '../../types';
import { dataService } from '../../services/dataService';
import { formatDate, formatTime12 } from '../../lib/utils';

interface RescheduleModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Appointment) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [newDate, setNewDate] = useState<string>('');
  const [newSlot, setNewSlot] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [slots, setSlots] = useState<{ time: string; isBooked: boolean; isPast: boolean }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (appointment && isOpen) {
      // Default to next day
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setNewDate(d.toISOString().split('T')[0]);
      setReason('');
      setErrorMsg(null);
    }
  }, [appointment, isOpen]);

  useEffect(() => {
    if (appointment && newDate) {
      setSlotsLoading(true);
      setErrorMsg(null);
      setNewSlot('');
      dataService.getAvailableSlots(appointment.doctor_id, newDate)
        .then(s => {
          setSlots(s);
          setSlotsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setSlotsLoading(false);
        });
    }
  }, [appointment, newDate]);

  if (!isOpen || !appointment) return null;

  const minDateStr = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newSlot) {
      setErrorMsg('Please select both a new date and an available time slot.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const updated = await dataService.rescheduleAppointment(
        appointment.id,
        newDate,
        newSlot,
        reason || 'Patient requested reschedule'
      );
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request rescheduling.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">
              Appointment Modification
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
              Reschedule Appointment
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

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Current Appointment Snapshot */}
        <div className="my-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between font-bold text-slate-800">
            <span>Ref: {appointment.reference_number}</span>
            <span className="text-teal-700">{appointment.speciality_name}</span>
          </div>
          <p className="text-slate-600">
            Doctor: <strong className="text-slate-900">{appointment.doctor_name}</strong>
          </p>
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span>Currently: {formatDate(appointment.appointment_date)} at {formatTime12(appointment.start_time)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select New Consultation Date *
            </label>
            <input
              type="date"
              min={minDateStr}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select New Time Slot *
            </label>
            {slotsLoading ? (
              <div className="p-4 text-center text-slate-400 text-xs">Loading available slots...</div>
            ) : slots.length === 0 ? (
              <div className="p-3 text-center text-xs text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
                Doctor is not available on this date. Please pick another date.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                {slots.map((s, idx) => {
                  const isBlocked = s.isBooked || s.isPast;
                  const isSelected = newSlot === s.time;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isBlocked}
                      onClick={() => setNewSlot(s.time)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                        isBlocked
                          ? 'bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed'
                          : isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white hover:border-teal-500 text-slate-700 border-slate-200'
                      }`}
                    >
                      {formatTime12(s.time)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Rescheduling (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Schedule conflict, personal emergency, out of city..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Policy Notice */}
          <div className="p-3 rounded-xl bg-teal-50 text-[11px] text-teal-800 border border-teal-100 leading-relaxed">
            Note: Your existing slot remains active until the hospital OPD coordinator approves this rescheduling request.
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-bold text-xs border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newDate || !newSlot}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Reschedule Request'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
