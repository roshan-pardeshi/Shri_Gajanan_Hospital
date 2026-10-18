import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2 
} from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: 'General Enquiry',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', phone: '', department: 'General Enquiry', message: '' });
    }, 4000);
  };

  return (
    <section className="py-16 bg-slate-50 border-t border-slate-200/80">
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
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card flex flex-col justify-between">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Hospital Address</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Plot No. 42, Station Road, Near Gajanan Maharaj Mandir, Borivali West, Mumbai, Maharashtra 400092
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
                      Emergency: +91 22 2845 9999
                    </p>
                    <p className="text-xs text-slate-500">
                      OPD Desk: +91 22 2845 6789
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
                    <p className="text-xs text-slate-500 mt-1">
                      Mon – Sat: 08:00 AM – 08:00 PM<br />
                      Sunday: Emergency Only
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
                      contact@smartcarehospital.org<br />
                      schemes@smartcarehospital.org
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Map Card Preview */}
            <div className="mt-8 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 h-48 relative flex items-center justify-center">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-70"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800')`
                }}
              />
              <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]" />
              <div className="relative z-10 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-white text-center">
                <div className="flex items-center gap-2 text-teal-700 font-bold text-xs">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>Shri Gajanan Multispeciality Hospital</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Station Road, Borivali West, Mumbai</p>
              </div>
            </div>
          </div>

          {/* Right Helpdesk Message Form (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card flex flex-col justify-between">
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
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98XXX XXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
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
                    className="w-full py-3 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 active:scale-95 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
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
