import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Appointment } from '../../types';
import { dataService } from '../../services/dataService';
import { formatDate, formatTime12 } from '../../lib/utils';

interface CancelModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Appointment) => void;
}

export const CancelModal: React.FC<CancelModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState<string>('Symptoms resolved');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !appointment) return null;

  const handleConfirmCancel = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const updated = await dataService.cancelAppointment(appointment.id, reason);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel appointment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>Cancel Appointment</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-4 text-xs text-slate-600 space-y-2">
          <p>
            Are you sure you want to cancel appointment <strong>{appointment.reference_number}</strong> with <strong>{appointment.doctor_name}</strong> on {formatDate(appointment.appointment_date)} at {formatTime12(appointment.start_time)}?
          </p>
          <p className="text-slate-400">
            Once cancelled, the time slot will be made available for other patients.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason for cancellation
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          >
            <option value="Symptoms resolved / Better now">Symptoms resolved / Better now</option>
            <option value="Schedule conflict / Unable to travel">Schedule conflict / Unable to travel</option>
            <option value="Consulted another physician">Consulted another physician</option>
            <option value="Personal emergency">Personal emergency</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-600 mb-3 font-semibold">{errorMsg}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-bold text-xs border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Keep Appointment
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirmCancel}
            className="px-5 py-2 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 disabled:opacity-50"
          >
            {loading ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>

      </div>
    </div>
  );
};
