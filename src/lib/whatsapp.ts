import { Appointment } from '../types';
import { formatDate, formatTime12 } from './utils';

/**
 * Validates and formats a phone number for WhatsApp Click-to-Chat (wa.me).
 * Supports standard Indian phone numbers (10 digits, +91, 0-prefixed, 91-prefixed).
 */
export function formatWhatsAppPhone(phone?: string | null): string | null {
  if (!phone) return null;

  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // 10 digits (Standard Indian mobile e.g. 9876543210)
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // 11 digits starting with 0 (e.g. 09876543210)
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }

  // 12 digits starting with 91 (e.g. 919876543210)
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  // Other international number length (10 to 15 digits)
  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }

  return null;
}

/**
 * Generates the standardized appointment notification message for WhatsApp.
 */
export function createWhatsAppMessage(
  appointment: Appointment,
  status: 'Approved' | 'Rejected',
  rejectionReason?: string
): string {
  const patientName = appointment.patient_name || 'Patient';
  const doctorName = appointment.doctor_name || 'Specialist Doctor';
  const appointmentDate = formatDate(appointment.appointment_date);
  const appointmentTime = formatTime12(appointment.start_time);

  if (status === 'Approved') {
    return `Dear ${patientName},

Your appointment at Shri Gajanan Hospital has been approved.

Doctor: ${doctorName}
Date: ${appointmentDate}
Time: ${appointmentTime}

Thank you for choosing Shri Gajanan Hospital.`;
  }

  const reason = rejectionReason || appointment.rejection_reason || 'Doctor unavailable during requested slot';
  return `Dear ${patientName},

We regret to inform you that your appointment request at Shri Gajanan Hospital has been rejected.

Doctor: ${doctorName}
Date: ${appointmentDate}
Reason: ${reason}

Thank you for understanding.`;
}

/**
 * Generates the complete https://wa.me URL for Click-to-Chat.
 */
export function getWhatsAppClickToChatUrl(
  phone: string | undefined | null,
  message: string
): string | null {
  const formattedPhone = formatWhatsAppPhone(phone);
  if (!formattedPhone) return null;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Triggers WhatsApp Click-to-Chat in a new tab.
 * Returns true if the window was opened, false if the phone number was invalid.
 */
export function openWhatsAppForAppointment(
  appointment: Appointment,
  status: 'Approved' | 'Rejected',
  customReason?: string
): boolean {
  const message = createWhatsAppMessage(appointment, status, customReason);
  const url = getWhatsAppClickToChatUrl(appointment.patient_phone, message);

  if (!url) {
    console.warn(`[WhatsApp] Invalid phone number for appointment ${appointment.reference_number}:`, appointment.patient_phone);
    alert(`Could not open WhatsApp: Invalid or missing phone number (${appointment.patient_phone || 'None'}) for patient ${appointment.patient_name || 'Patient'}.`);
    return false;
  }

  // Open WhatsApp Web or WhatsApp Desktop in a new window/tab
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

