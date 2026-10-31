import React from 'react';
import { 
  Microscope, 
  Clock, 
  MapPin, 
  Phone, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  FileText,
  Activity
} from 'lucide-react';
import { LaboratorySettings } from '../../types';

interface LaboratoryCardSectionProps {
  onViewAllTests: () => void;
  onContactLab?: () => void;
  settings?: LaboratorySettings | null;
}

export const LaboratoryCardSection: React.FC<LaboratoryCardSectionProps> = ({
  onViewAllTests,
  onContactLab,
  settings,
}) => {
  const labName = settings?.lab_name || 'Shri Gajanan Hospital Diagnostic Laboratory';
  const location = settings?.location || 'Ground Floor, Diagnostics & Imaging Wing B (Near Main OPD)';
  const operatingHours = settings?.operating_hours || 'Routine Sample Collection: Mon - Sat 07:30 AM - 07:00 PM | 24/7 Emergency Diagnostics';
  const phone = settings?.contact_phone || '+91 22 2845 6795';
  const description = settings?.general_description || 'Fully automated clinical pathology, hematology, biochemistry, and microbiology diagnostic testing under strict internal and external quality control protocols.';

  return (
    <section className="py-14 bg-gradient-to-b from-white to-slate-50/70 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/60 text-teal-700 text-xs font-bold mb-2.5">
            <Microscope className="w-4 h-4 text-teal-600" />
            <span>Pathology & Diagnostic Testing</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Laboratory & Blood Testing Services
          </h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Access laboratory services and learn about the diagnostic tests available at our hospital.
          </p>
        </div>

        {/* Feature Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
          
          {/* Left Column: Visual & Diagnostic Focus */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Ambient Background Graphic */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -top-10 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
                <Microscope className="w-8 h-8 text-teal-300" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                  Central Diagnostic Facility
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {labName}
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {description}
              </p>
            </div>

            {/* Service Badges */}
            <div className="relative z-10 mt-8 pt-6 border-t border-slate-700/60 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Automated Analyzers</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Barcoded Samples</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Fast Report Turnaround</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Emergency 24/7 Stat Tests</span>
              </div>
            </div>
          </div>

          {/* Right Column: Lab Info, Timings, & Action CTAs */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-6">
            
            {/* Information Grid */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Laboratory Information & Access
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Operating Hours</span>
                    <p className="text-xs font-semibold text-slate-900 mt-0.5 leading-snug">
                      {operatingHours}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Laboratory Location</span>
                    <p className="text-xs font-semibold text-slate-900 mt-0.5 leading-snug">
                      {location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Verified Walk-in & Contact Note */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-teal-900 block">Walk-In & Prescribed OPD Patients Welcome</span>
                    <span className="text-[11px] text-teal-700">Present doctor consultation slip or request routine profiles at Counter 4.</span>
                  </div>
                </div>
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-teal-200 text-xs font-bold text-teal-800 hover:bg-teal-600 hover:text-white transition-colors shrink-0 shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{phone}</span>
                </a>
              </div>

              {/* Essential Patient Requirement Disclaimer */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Important Notice:</strong> Actual test availability, specific fasting protocols, and sample preparation guidelines must be confirmed directly with the hospital laboratory desk or your attending physician prior to sample collection.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={onViewAllTests}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
              >
                <span>View All Diagnostic Tests</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onContactLab) {
                    onContactLab();
                  } else {
                    window.location.href = `tel:${phone}`;
                  }
                }}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-xs border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-slate-500" />
                <span>Contact Laboratory Desk</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
