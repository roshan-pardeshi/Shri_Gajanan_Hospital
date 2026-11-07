import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  HeartHandshake, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

import { HospitalSettings } from '../../types';
import { dataService } from '../../services/dataService';

interface FooterProps {
  onNavigate: (tab: string) => void;
  onOpenBooking: () => void;
  settings?: HospitalSettings | null;
  sectionsVisibility?: Record<string, boolean>;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenBooking, settings, sectionsVisibility }) => {
  const [internalVisibility, setInternalVisibility] = useState<Record<string, boolean>>(sectionsVisibility || {});

  useEffect(() => {
    if (sectionsVisibility && Object.keys(sectionsVisibility).length > 0) {
      setInternalVisibility(sectionsVisibility);
    } else {
      dataService.getWebsiteSections().then(secs => {
        const map: Record<string, boolean> = {};
        for (const s of secs) map[s.id] = s.is_visible;
        setInternalVisibility(map);
      });
    }

    const handleSectionsUpdate = () => {
      dataService.getWebsiteSections().then(secs => {
        const map: Record<string, boolean> = {};
        for (const s of secs) map[s.id] = s.is_visible;
        setInternalVisibility(map);
      });
    };

    window.addEventListener('website-sections-updated', handleSectionsUpdate);
    return () => window.removeEventListener('website-sections-updated', handleSectionsUpdate);
  }, [sectionsVisibility]);
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Column 1: Hospital Info & Accreditation (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white font-black text-lg">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                  <path d="M12 5v6"/>
                  <path d="M9 8h6"/>
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-white text-lg tracking-tight">SmartCare Hospital Portal</h3>
                <p className="text-xs text-teal-400 font-medium">{settings?.hospital_name || 'Shri Gajanan Multispeciality Hospital'}</p>
              </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              A premier 250-bed tertiary healthcare and research institution in Mumbai, Maharashtra. Dedicated to accessible, compassionate, and ethical medical care backed by world-class infrastructure and renowned doctors.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-950/80 text-teal-300 border border-teal-800/60">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                NABH Accredited
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
                PM-JAY & MJPJAY Cashless
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  type="button" 
                  onClick={() => onNavigate('home')} 
                  className="hover:text-teal-400 flex items-center gap-1 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-teal-500" />
                  <span>Home</span>
                </button>
              </li>
              {internalVisibility.doctors !== false && (
                <li>
                  <button 
                    type="button" 
                    onClick={() => onNavigate('doctors')} 
                    className="hover:text-teal-400 flex items-center gap-1 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-teal-500" />
                    <span>Find Doctors & OPD</span>
                  </button>
                </li>
              )}
              {internalVisibility.specialities !== false && (
                <li>
                  <button 
                    type="button" 
                    onClick={() => onNavigate('specialities')} 
                    className="hover:text-teal-400 flex items-center gap-1 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-teal-500" />
                    <span>Specialities</span>
                  </button>
                </li>
              )}
              {internalVisibility.laboratory !== false && (
                <li>
                  <button 
                    type="button" 
                    onClick={() => onNavigate('laboratory')} 
                    className="hover:text-teal-400 flex items-center gap-1 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-teal-500" />
                    <span>Laboratory & Tests</span>
                  </button>
                </li>
              )}
              {internalVisibility.schemes !== false && (
                <li>
                  <button 
                    type="button" 
                    onClick={() => onNavigate('schemes')} 
                    className="hover:text-teal-400 flex items-center gap-1 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-teal-500" />
                    <span>Govt Health Schemes</span>
                  </button>
                </li>
              )}
              <li>
                <button 
                  type="button" 
                  onClick={onOpenBooking} 
                  className="hover:text-teal-400 flex items-center gap-1 font-semibold text-teal-400 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-teal-400" />
                  <span>Book Appointment</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Medical Specialities */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Clinical Centers</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Cardiology & Cath Lab</li>
              <li>Orthopaedics & Joint Replacement</li>
              <li>Neurology & Neurosurgery</li>
              <li>Obstetrics & Gynaecology</li>
              <li>Paediatrics & Neonatal ICU</li>
              <li>Medical Oncology</li>
              <li>Nephrology & 24/7 Dialysis</li>
              <li>Diagnostic Pathology Laboratory</li>
            </ul>
          </div>

          {/* Column 4: Contact & Emergency */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Emergency & Contact</h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span className="text-slate-400 text-xs leading-relaxed">
                  {settings?.address || 'Plot No. 42, Station Road, Near Gajanan Maharaj Mandir, Borivali West'}
                  {settings?.city && !settings.address?.includes('Mumbai') ? `, ${settings.city}, ${settings.state || ''} ${settings.pincode || ''}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-rose-400 shrink-0" />
                <a href={`tel:${settings?.emergency_helpline || '+91 22 2845 9999'}`} className="text-rose-400 hover:text-rose-300 font-bold text-xs">
                  24/7 Emergency: {settings?.emergency_helpline || '+91 22 2845 9999'}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-slate-400 text-xs">
                  {settings?.operating_hours ? (settings.operating_hours.includes('OPD') ? settings.operating_hours : `OPD: ${settings.operating_hours}`) : 'OPD: Mon - Sat 08:00 AM - 08:00 PM'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <a href={`mailto:${settings?.email || 'contact@smartcarehospital.org'}`} className="text-slate-400 hover:text-teal-300 text-xs">
                  {settings?.email || 'contact@smartcarehospital.org'}
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Official Health Scheme Disclaimer */}
        <div className="py-6 border-b border-slate-800 text-xs text-slate-500 leading-relaxed space-y-2">
          <p className="font-semibold text-slate-400">
            Important Government Health Scheme Disclaimer:
          </p>
          <p>
            Information displayed on this portal regarding Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY), Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY), CGHS, and ESIC is curated from official government portals (National Health Authority and Government of Maharashtra). Patient eligibility, document requirements, and package authorizations are determined strictly by official biometric verification and government scheme rules at the hospital Arogya Mitra helpdesk. Shri Gajanan Hospital strictly adheres to zero-out-of-pocket rules for approved cashless procedures.
          </p>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} SmartCare Hospital Portal - Shri Gajanan Multispeciality Hospital. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onNavigate('admin-login')}
              className="text-slate-400 hover:text-teal-400 transition-colors font-medium flex items-center gap-1"
            >
              <span>Admin Access</span>
            </button>
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Patient Rights Charter</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <a 
              href="https://beneficiary.nha.gov.in" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-teal-400 flex items-center gap-1"
            >
              <span>NHA Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
