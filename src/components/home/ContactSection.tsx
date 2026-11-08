import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { HospitalSettings } from '../../types';
import { dataService } from '../../services/dataService';
import { validateName, validateMobile } from '../../utils/validation';

interface ContactSectionProps {
  settings?: HospitalSettings | null;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ settings: propSettings }) => {
  const [settings, setSettings] = useState<HospitalSettings | null>(propSettings || null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: 'General Enquiry',
    message: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (propSettings) {
      setSettings(propSettings);
    } else {
      dataService.getHospitalSettings().then(setSettings);
    }

    const handleSettingsUpdate = (e: any) => {
      if (e.detail) {
        setSettings(e.detail);
      } else {
        dataService.getHospitalSettings().then(setSettings);
      }
    };
    window.addEventListener('hospital-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('hospital-settings-updated', handleSettingsUpdate);
  }, [propSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const errs: Record<string, string> = {};
    const nameCheck = validateName(formData.name, 'Full name');
    if (!nameCheck.isValid) {
      errs.name = nameCheck.error || 'Please enter a valid full name.';
    }

    const phoneCheck = validateMobile(formData.phone, true);
    if (!phoneCheck.isValid) {
      errs.phone = phoneCheck.error || 'Please enter a valid 10-digit mobile number.';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});

    setSubmitting(true);
    try {
      await dataService.createNotification({
        title: `Patient Query / Feedback: ${nameCheck.value!}`,
        message: `Department/Concern: ${formData.department}\nPhone: ${phoneCheck.value!}\nMessage: ${formData.message?.trim() || 'No additional message provided.'}`,
        type: 'general',
      });
      window.dispatchEvent(new CustomEvent('new-hospital-notification'));
    } catch (err) {
      console.warn('Could not post notification to API:', err);
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: '', phone: '', department: 'General Enquiry', message: '' });
      }, 5000);
    }
  };

  const address = settings?.address || 'Plot No. 42, Station Road, Near Gajanan Maharaj Mandir, Borivali West';
  const cityState = settings?.city ? `, ${settings.city}${settings.state ? ', ' + settings.state : ''} ${settings.pincode || ''}` : '';
  const fullAddress = address.includes('Mumbai') ? address : `${address}${cityState}`;
  const emergencyPhone = settings?.emergency_helpline || '+91 22 2845 9999';
  const opdPhone = settings?.phone || '+91 22 2845 6789';
  const operatingHours = settings?.operating_hours || 'Mon – Sat: 08:00 AM – 08:00 PM\nSunday: Emergency Only';
  const email = settings?.email || 'contact@smartcarehospital.org';

  return (
    <section id="contact-section" className="py-16 bg-slate-50 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
            Reach Out to Us
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Hospital Location & Patient Helpdesk
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Located conveniently near Borivali Station with 24/7 emergency drive-in casualty access.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Info & Interactive Map Mockup (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-4 xs:p-6 sm:p-8 border border-slate-200/80 shadow-card flex flex-col justify-between">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Hospital Address</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {fullAddress}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Helpline & Casualty</h4>
                    <p className="text-xs font-bold text-rose-600 mt-0.5">
                      Emergency: <a href={`tel:${emergencyPhone}`} className="hover:underline">{emergencyPhone}</a>
                    </p>
                    <p className="text-xs text-slate-500">
                      OPD Desk: <a href={`tel:${opdPhone}`} className="hover:underline">{opdPhone}</a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">OPD Consultation Hours</h4>
                    <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">
                      {operatingHours}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Electronic Inquiries</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      <a href={`mailto:${email}`} className="text-teal-700 hover:underline">{email}</a><br />
                      schemes@smartcarehospital.org
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Google Map Section */}
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 h-64 sm:h-72 relative shadow-inner">
                <iframe
                  title="Shri Gajanan Hospital Location Map"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent('Shri Gajanan Hospital, Jayhind Colony, Indrasen Chowk, Deopur, Dhule, Maharashtra 424001')}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Get Directions Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      Shri Gajanan Hospital, Deopur
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      Indrasen Chowk, Jayhind Colony, Dhule – 424001
                    </p>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('Shri Gajanan Hospital, Jayhind Colony, Indrasen Chowk, Deopur, Dhule, Maharashtra 424001')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs hover:shadow-md transition-all active:scale-95 shrink-0 text-center"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Directions</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Helpdesk Message Form (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-4 xs:p-6 sm:p-8 border border-slate-200/80 shadow-card flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wide">
                Patient Assistance
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                Have a Query or Feedback?
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                Our patient relations team will respond within 30 minutes during OPD hours.
              </p>

              {submitted ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Query Received!</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Thank you. Our patient coordinator will contact you at <strong>{formData.phone}</strong> shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kulkarni"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:outline-hidden ${
                        formErrors.name
                          ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-rose-400'
                          : 'border-slate-200 focus:ring-teal-500'
                      }`}
                    />
                    {formErrors.name && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: '' }));
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:outline-hidden ${
                        formErrors.phone
                          ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-rose-400'
                          : 'border-slate-200 focus:ring-teal-500'
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department / Concern
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
                    >
                      <option value="General Enquiry">General Enquiry</option>
                      <option value="Govt Health Scheme Verification">Govt Health Scheme Verification</option>
                      <option value="Billing / TPA Insurance">Billing / TPA Insurance</option>
                      <option value="Doctor Availability">Doctor Availability</option>
                      <option value="Diagnostic Reports">Diagnostic Reports</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Message / Question
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Type your question or medical inquiry here..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 active:scale-95 disabled:opacity-60 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Sending Message...' : 'Send Message'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
